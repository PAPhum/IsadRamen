const express = require('express');
const router = express.Router();
const db = require('../database');

// 1. หน้าหลักแคชเชียร์
router.get('/', (req, res) => {
  db.all('SELECT * FROM TABLES ORDER BY table_id ASC', [], (err, tables) => {
    res.render('cashier/index', { tables: tables || [] });
  });
});

// 2. หน้าจอลูกค้า (Cashierจอลูกค้า ตาม Wireframe UI.png)
router.get('/customer-display', (req, res) => {
  const tableId = req.query.table_id || 1;
  db.all('SELECT * FROM TABLES ORDER BY table_id ASC', [], (err, tables) => {
    res.render('cashier/customer-display', { tables: tables || [], currentTableId: tableId });
  });
});

// 3. API ดึงรายชื่อโต๊ะทั้งหมด พร้อมสถานะว่ามีรายการค้างจ่ายหรือไม่
router.get('/api/tables', (req, res) => {
  const sql = `
    SELECT 
      t.table_id,
      t.table_number,
      t.card_id,
      COUNT(DISTINCT o.order_id) as active_order_count,
      COALESCE(SUM(oi.quantity * oi.unit_price), 0) as unpaid_total
    FROM TABLES t
    LEFT JOIN ORDERS o ON t.table_id = o.table_id AND o.is_paid = 0
    LEFT JOIN ORDER_ITEM oi ON o.order_id = oi.order_id
    GROUP BY t.table_id
    ORDER BY t.table_id ASC
  `;

  db.all(sql, [], (err, tables) => {
    if (err) return res.status(500).json({ success: false, message: 'DB Error' });
    res.json({ success: true, tables });
  });
});

// เก็บสถานะวิธีชำระเงินปัจจุบันของแคชเชียร์ สำหรับ Sync ไปยังหน้าจอลูกค้า (Customer Display)
let currentCashierState = {
  table_id: null,
  payment_method: 'CASH',
  show_qr: false,
  updated_at: Date.now()
};

// API สำหรับอัปเดตวิธีชำระเงินจากหน้าแคชเชียร์
router.post('/api/payment-method', (req, res) => {
  const { table_id, payment_method } = req.body;
  currentCashierState = {
    table_id: table_id ? parseInt(table_id) : null,
    payment_method: payment_method || 'CASH',
    show_qr: (payment_method === 'TRANSFER'),
    updated_at: Date.now()
  };
  res.json({ success: true, state: currentCashierState });
});

// API สำหรับดึงสถานะชำระเงินล่าสุด
router.get('/api/current-state', (req, res) => {
  res.json({ success: true, state: currentCashierState });
});

// 4. API ดึงบิลของโต๊ะ (รองรับทั้ง table_id, card_id, table_number)
router.get('/api/table-bill', (req, res) => {
  const { table_id, card_id, table_number } = req.query;

  let queryCond = '';
  let queryParam = [];

  if (card_id) {
    queryCond = 'UPPER(t.card_id) = ?';
    queryParam = [card_id.trim().toUpperCase()];
  } else if (table_number) {
    let tNum = table_number.trim().toUpperCase();
    if (/^\d+$/.test(tNum)) tNum = 'T' + tNum.padStart(2, '0');
    queryCond = 'UPPER(t.table_number) = ?';
    queryParam = [tNum];
  } else if (table_id) {
    queryCond = 't.table_id = ?';
    queryParam = [parseInt(table_id)];
  } else {
    return res.status(400).json({ success: false, message: 'กรุณาระบุ table_id หรือ card_id' });
  }

  // หาข้อมูลโต๊ะก่อน
  db.get(`SELECT * FROM TABLES t WHERE ${queryCond}`, queryParam, (err, table) => {
    if (err || !table) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลโต๊ะหรือ Payment Card นี้' });
    }

    // ดึงรายการอาหารที่ยังไม่ชำระ (is_paid = 0) ทั้งหมดของโต๊ะนี้
    const sql = `
      SELECT 
        oi.order_item_id,
        oi.order_id,
        mi.menu_name,
        oi.quantity,
        oi.unit_price,
        (oi.quantity * oi.unit_price) as item_total,
        (SELECT GROUP_CONCAT(opt.option_name, ' / ')
         FROM ORDER_ITEM_OPTION oio
         JOIN OPTION opt ON oio.option_id = opt.option_id
         WHERE oio.order_item_id = oi.order_item_id) AS options_text,
        (SELECT GROUP_CONCAT(top.topping_name || ' (x' || oit.quantity || ')', ', ')
         FROM ORDER_ITEM_TOPPING oit
         JOIN TOPPING top ON oit.topping_id = top.topping_id
         WHERE oit.order_item_id = oi.order_item_id) AS toppings_text
      FROM ORDER_ITEM oi
      JOIN ORDERS o ON oi.order_id = o.order_id
      JOIN MENU_ITEM mi ON oi.menu_id = mi.menu_id
      WHERE o.table_id = ? AND o.is_paid = 0
      ORDER BY oi.order_item_time ASC
    `;

    db.all(sql, [table.table_id], (itemErr, items) => {
      if (itemErr) return res.status(500).json({ success: false, message: 'DB Error' });

      const grandTotal = items ? items.reduce((sum, i) => sum + (parseFloat(i.item_total) || 0), 0) : 0;

      res.json({
        success: true,
        table_id: table.table_id,
        table_number: table.table_number,
        card_id: table.card_id,
        items: items || [],
        grand_total: grandTotal,
        cashier_state: currentCashierState
      });
    });
  });
});

// 5. API ชำระเงิน (Checkout & Reset Table)
router.post('/api/checkout', (req, res) => {
  const { table_id, total_amount, payment_method, amount_paid, change_amount } = req.body;

  if (!table_id || total_amount === undefined || !payment_method) {
    return res.status(400).json({ success: false, message: 'ข้อมูลการชำระเงินไม่ครบถ้วน' });
  }

  const total = parseFloat(total_amount);
  const paid = parseFloat(amount_paid) || total;
  const change = parseFloat(change_amount) || Math.max(0, paid - total);

  if (payment_method === 'CASH' && paid < total) {
    return res.status(400).json({ success: false, message: 'จำนวนเงินไม่เพียงพอ' });
  }

  db.serialize(() => {
    // 1. ดึงรายการอาหารก่อนปิด เพื่อใช้สร้าง Receipt
    const sqlGetItems = `
      SELECT 
        mi.menu_name,
        oi.quantity,
        oi.unit_price,
        (oi.quantity * oi.unit_price) as item_total,
        (SELECT GROUP_CONCAT(opt.option_name, ' / ')
         FROM ORDER_ITEM_OPTION oio
         JOIN OPTION opt ON oio.option_id = opt.option_id
         WHERE oio.order_item_id = oi.order_item_id) AS options_text,
        (SELECT GROUP_CONCAT(top.topping_name || ' (x' || oit.quantity || ')', ', ')
         FROM ORDER_ITEM_TOPPING oit
         JOIN TOPPING top ON oit.topping_id = top.topping_id
         WHERE oit.order_item_id = oi.order_item_id) AS toppings_text
      FROM ORDER_ITEM oi
      JOIN ORDERS o ON oi.order_id = o.order_id
      JOIN MENU_ITEM mi ON oi.menu_id = mi.menu_id
      WHERE o.table_id = ? AND o.is_paid = 0
    `;

    db.all(sqlGetItems, [table_id], (err, items) => {
      if (err) return res.status(500).json({ success: false, message: 'DB Error reading items' });

      // 2. บันทึกลงตาราง PAYMENT
      const stmtPayment = db.prepare(`
        INSERT INTO PAYMENT (table_id, total_amount, payment_method, amount_paid, change_amount)
        VALUES (?, ?, ?, ?, ?)
      `);

      stmtPayment.run(table_id, total, payment_method, paid, change, function (payErr) {
        if (payErr) {
          console.error('Payment insert error:', payErr.message);
          return res.status(500).json({ success: false, message: 'บันทึกการชำระเงินไม่สำเร็จ' });
        }

        const paymentId = this.lastID;

        // 3. ปิด Order (is_paid = 1) ของโต๊ะนั้นทั้งหมด -> Reset โต๊ะสำหรับลูกค้ารายถัดไป
        db.run('UPDATE ORDERS SET is_paid = 1 WHERE table_id = ? AND is_paid = 0', [table_id], (updateErr) => {
          if (updateErr) {
            console.error('Order update error:', updateErr.message);
            return res.status(500).json({ success: false, message: 'อัปเดตสถานะบิลไม่สำเร็จ' });
          }

          // 4. ดึงข้อมูลโต๊ะ
          db.get('SELECT * FROM TABLES WHERE table_id = ?', [table_id], (tErr, table) => {
            currentCashierState = {
              table_id: null,
              payment_method: 'CASH',
              show_qr: false,
              updated_at: Date.now()
            };
            res.json({
              success: true,
              message: 'ชำระเงินเรียบร้อยแล้ว โต๊ะถูก Reset พร้อมรับลูกค้าใหม่',
              payment: {
                payment_id: paymentId,
                table_number: table ? table.table_number : 'T??',
                card_id: table ? table.card_id : '',
                total_amount: total,
                payment_method,
                amount_paid: paid,
                change_amount: change,
                payment_time: new Date().toISOString(),
                items: items || []
              }
            });
          });
        });
      });
      stmtPayment.finalize();
    });
  });
});

// REST Routes
router.post('/card', (req, res) => {
  const { card_id } = req.body;
  res.redirect(`/cashier?card_id=${encodeURIComponent(card_id)}`);
});

router.post('/payment', (req, res) => {
  // redirect or forward to checkout API
  res.redirect('/cashier');
});

// ดึงหน้าใบเสร็จ
router.get('/receipt/:paymentId', (req, res) => {
  const pId = req.params.paymentId;
  const sql = `
    SELECT p.*, t.table_number, t.card_id 
    FROM PAYMENT p 
    JOIN TABLES t ON p.table_id = t.table_id 
    WHERE p.payment_id = ?
  `;
  db.get(sql, [pId], (err, payment) => {
    if (err || !payment) return res.status(404).send('ไม่พบใบเสร็จนี้');
    res.render('cashier/receipt', { payment });
  });
});

module.exports = router;