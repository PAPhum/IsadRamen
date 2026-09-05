const express = require('express');
const router = express.Router();
const db = require('../database');

// 1. หน้าหลักครัว (KDS)
router.get('/', (req, res) => {
  res.render('chef/index');
});

// 2. หน้าประวัติครัว (ถ้าต้องการเข้าตรง)
router.get('/history', (req, res) => {
  res.render('chef/index', { initialView: 'history' });
});

// 3. API ดึงรายการอาหารทั้งหมด (แยก queue, prepare, finish)
router.get('/api/orders', (req, res) => {
  const sql = `
    SELECT 
      oi.order_item_id,
      oi.order_id,
      t.table_number,
      t.table_id,
      mi.menu_name,
      oi.quantity,
      oi.status,
      oi.unit_price,
      oi.order_item_time,
      (SELECT GROUP_CONCAT(opt.option_category || ': ' || opt.option_name, ', ')
       FROM ORDER_ITEM_OPTION oio
       JOIN OPTION opt ON oio.option_id = opt.option_id
       WHERE oio.order_item_id = oi.order_item_id) AS options_text,
      (SELECT GROUP_CONCAT(top.topping_name || ' (x' || oit.quantity || ')', ', ')
       FROM ORDER_ITEM_TOPPING oit
       JOIN TOPPING top ON oit.topping_id = top.topping_id
       WHERE oit.order_item_id = oi.order_item_id) AS toppings_text
    FROM ORDER_ITEM oi
    JOIN ORDERS o ON oi.order_id = o.order_id
    JOIN TABLES t ON o.table_id = t.table_id
    JOIN MENU_ITEM mi ON oi.menu_id = mi.menu_id
    ORDER BY oi.order_item_time ASC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Error fetching chef orders:', err.message);
      return res.status(500).json({ success: false, message: 'DB Error' });
    }

    const queueOrders = rows.filter(r => r.status === 'queue' || r.status === 'prepare');
    const historyOrders = rows.filter(r => r.status === 'finish');

    res.json({
      success: true,
      queueOrders,
      historyOrders,
      allOrders: rows
    });
  });
});

// 4. API อัปเดตสถานะ (queue, prepare, finish)
router.post('/api/update-status', (req, res) => {
  const { order_item_id, next_status } = req.body;

  if (!['queue', 'prepare', 'finish'].includes(next_status)) {
    return res.status(400).json({ success: false, message: 'สถานะไม่ถูกต้อง' });
  }

  const sql = 'UPDATE ORDER_ITEM SET status = ? WHERE order_item_id = ?';
  db.run(sql, [next_status, order_item_id], function (err) {
    if (err) {
      console.error('Error updating status:', err.message);
      return res.status(500).json({ success: false, message: 'DB Error' });
    }
    res.json({ success: true, message: `อัปเดตสถานะเป็น ${next_status} เรียบร้อย` });
  });
});

// 5. REST Routes ตาม ramen_demo_prompt.md
router.post('/order-item/:id/prepare', (req, res) => {
  const id = req.params.id;
  db.run("UPDATE ORDER_ITEM SET status = 'prepare' WHERE order_item_id = ?", [id], (err) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true });
  });
});

router.post('/order-item/:id/finish', (req, res) => {
  const id = req.params.id;
  db.run("UPDATE ORDER_ITEM SET status = 'finish' WHERE order_item_id = ?", [id], (err) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true });
  });
});

router.post('/order-item/:id/revert', (req, res) => {
  const id = req.params.id;
  db.run("UPDATE ORDER_ITEM SET status = 'queue' WHERE order_item_id = ?", [id], (err) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true });
  });
});

module.exports = router;
