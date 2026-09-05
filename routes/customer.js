const express = require('express');
const router = express.Router();
const db = require('../database');

// Helper ค้นหาโต๊ะจาก tableNumber (เช่น 'T05', '5', 't05') หรือ tableId
function findTable(identifier, callback) {
  let param = identifier.trim();
  let searchNum = param;

  // แปลงให้เป็น format T01-T20 ถ้าส่งมาเป็นตัวเลข
  if (/^\d+$/.test(param)) {
    searchNum = 'T' + param.padStart(2, '0');
  } else {
    searchNum = param.toUpperCase();
  }

  const sql = `
    SELECT * FROM TABLES 
    WHERE UPPER(table_number) = ? OR table_id = ? OR UPPER(card_id) = ?
    LIMIT 1
  `;
  db.get(sql, [searchNum, parseInt(param) || 0, param.toUpperCase()], (err, table) => {
    if (err) return callback(err, null);
    callback(null, table);
  });
}

// 1. หน้าเริ่มต้น (Start Screen: กดเพื่อเลือกเมนู)
router.get('/:tableNumber', (req, res) => {
  const tableParam = req.params.tableNumber;
  if (tableParam === 'table') return res.redirect('/');

  findTable(tableParam, (err, table) => {
    if (err || !table) {
      return res.status(404).send(`
        <div style="font-family:sans-serif; text-align:center; padding:50px;">
          <h2>❌ ไม่พบข้อมูลโต๊ะ "${tableParam}"</h2>
          <p>กรุณาตรวจสอบหมายเลขโต๊ะ เช่น /customer/T05 หรือ /customer/5</p>
          <a href="/">กลับหน้าหลัก</a>
        </div>
      `);
    }
    res.render('customer/start', { table });
  });
});

// Backward compatibility สำหรับ /customer/table/:table_id
router.get('/table/:table_id', (req, res) => {
  findTable(req.params.table_id, (err, table) => {
    if (err || !table) return res.status(404).send('ไม่พบโต๊ะ');
    res.redirect(`/customer/${table.table_number}`);
  });
});

router.get('/table/:table_id/menu', (req, res) => {
  findTable(req.params.table_id, (err, table) => {
    if (err || !table) return res.status(404).send('ไม่พบโต๊ะ');
    res.redirect(`/customer/${table.table_number}/menu`);
  });
});

router.get('/table/:table_id/history', (req, res) => {
  findTable(req.params.table_id, (err, table) => {
    if (err || !table) return res.status(404).send('ไม่พบโต๊ะ');
    res.redirect(`/customer/${table.table_number}/history`);
  });
});

// 2. หน้าเมนูหลัก + Cart + Customize (menu.ejs)
router.get('/:tableNumber/menu', (req, res) => {
  const tableParam = req.params.tableNumber;

  findTable(tableParam, (err, table) => {
    if (err || !table) return res.status(404).send('ไม่พบข้อมูลโต๊ะ');

    const sqlCategories = 'SELECT * FROM MENU_CATEGORY ORDER BY category_order ASC';
    const sqlMenuItems = 'SELECT * FROM MENU_ITEM ORDER BY menu_id ASC';
    const sqlOptions = 'SELECT * FROM OPTION ORDER BY option_id ASC';
    const sqlToppings = 'SELECT * FROM TOPPING ORDER BY topping_id ASC';

    db.all(sqlCategories, [], (err, categories) => {
      db.all(sqlMenuItems, [], (err, menuItems) => {
        db.all(sqlOptions, [], (err, options) => {
          db.all(sqlToppings, [], (err, toppings) => {
            res.render('customer/menu', {
              table,
              categories: categories || [],
              menuItems: menuItems || [],
              options: options || [],
              toppings: toppings || []
            });
          });
        });
      });
    });
  });
});

// 3. Logic ยืนยันคำสั่งซื้อ (Submit Order)
// Cart = Order; ยืนยัน Order ปัจจุบันและส่งเข้าครัว
router.post('/:tableNumber/order', (req, res) => {
  const tableParam = req.params.tableNumber;
  const cart = req.body.cart;

  if (!cart || !Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ success: false, message: 'ไม่มีรายการอาหารในตะกร้า' });
  }

  findTable(tableParam, (err, table) => {
    if (err || !table) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลโต๊ะ' });
    }

    const tableId = table.table_id;

    db.serialize(() => {
      // สร้าง Order รอบใหม่สำหรับชุดรายการที่สั่งนี้
      db.run('INSERT INTO ORDERS (table_id, is_paid) VALUES (?, 0)', [tableId], function (err) {
        if (err) {
          console.error('Error creating order:', err.message);
          return res.status(500).json({ success: false, message: 'DB Error creating order' });
        }

        const currentOrderId = this.lastID;

        // บันทึกแต่ละ Order Item
        cart.forEach((item) => {
          const stmtItem = db.prepare(`
            INSERT INTO ORDER_ITEM (order_id, menu_id, quantity, unit_price, status, note)
            VALUES (?, ?, ?, ?, 'queue', NULL)
          `);

          const qty = parseInt(item.quantity) || 1;
          const unitPrice = parseFloat(item.unit_price) || 0;

          stmtItem.run(currentOrderId, item.menu_id, qty, unitPrice, function (itemErr) {
            if (itemErr) {
              console.error('Error inserting order item:', itemErr.message);
              return;
            }
            const orderItemId = this.lastID;

            // บันทึกตัวเลือกฟรีลง ORDER_ITEM_OPTION
            if (item.selected_options && Array.isArray(item.selected_options) && item.selected_options.length > 0) {
              const stmtOpt = db.prepare('INSERT INTO ORDER_ITEM_OPTION (order_item_id, option_id) VALUES (?, ?)');
              item.selected_options.forEach(optId => {
                if (optId) stmtOpt.run(orderItemId, parseInt(optId));
              });
              stmtOpt.finalize();
            }

            // บันทึก Topping ลง ORDER_ITEM_TOPPING
            if (item.selected_toppings && Array.isArray(item.selected_toppings) && item.selected_toppings.length > 0) {
              const stmtTop = db.prepare(`
                INSERT INTO ORDER_ITEM_TOPPING (order_item_id, topping_id, quantity, topping_price) 
                VALUES (?, ?, ?, ?)
              `);
              item.selected_toppings.forEach(top => {
                const topQty = parseInt(top.quantity) || 1;
                const topPrice = parseFloat(top.price) || 0;
                if (topQty > 0) {
                  stmtTop.run(orderItemId, top.topping_id, topQty, topPrice);
                }
              });
              stmtTop.finalize();
            }
          });

          stmtItem.finalize();
        });

        res.json({ success: true, message: 'สั่งอาหารเรียบร้อยแล้ว ส่งรายการไปครัวแล้ว' });
      });
    });
  });
});

// 4. หน้าประวัติการสั่งอาหารที่ยังไม่ชำระ (history.ejs)
router.get('/:tableNumber/history', (req, res) => {
  const tableParam = req.params.tableNumber;

  findTable(tableParam, (err, table) => {
    if (err || !table) return res.status(404).send('ไม่พบข้อมูลโต๊ะ');

    const tableId = table.table_id;

    const sql = `
      SELECT 
        oi.order_item_id,
        oi.order_id,
        mi.menu_name,
        oi.quantity,
        oi.unit_price,
        (oi.quantity * oi.unit_price) as total_item_price,
        oi.status,
        oi.order_item_time,
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

    db.all(sql, [tableId], (err, items) => {
      if (err) {
        console.error('Error fetching history:', err.message);
        items = [];
      }
      const grandTotal = items ? items.reduce((sum, item) => sum + (parseFloat(item.total_item_price) || 0), 0) : 0;
      res.render('customer/history', {
        table,
        items: items || [],
        grandTotal: grandTotal.toFixed(2).replace(/\.00$/, '')
      });
    });
  });
});

module.exports = router;