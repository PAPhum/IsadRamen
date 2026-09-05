const express = require('express');
const router = express.Router();
const db = require('../database');

// 1. หน้าจอหลักฝั่งครัว (Render View)
router.get('/', (req, res) => {
  res.render('kitchen/index');
});

// 2. API ดึงรายการอาหารที่กำลังรอดำเนินการ (queue & prepare)
router.get('/api/orders', (req, res) => {
  const sql = `
    SELECT 
      oi.order_item_id,
      t.table_number,
      mi.menu_name,
      oi.quantity,
      oi.status,
      oi.note,
      oi.order_item_time,
      GROUP_CONCAT(DISTINCT opt.option_name) as options,
      GROUP_CONCAT(DISTINCT top.topping_name || ' (x' || oit.quantity || ')') as toppings
    FROM ORDER_ITEM oi
    JOIN ORDERS o ON oi.order_id = o.order_id
    JOIN TABLES t ON o.table_id = t.table_id
    JOIN MENU_ITEM mi ON oi.menu_id = mi.menu_id
    LEFT JOIN ORDER_ITEM_OPTION oio ON oi.order_item_id = oio.order_item_id
    LEFT JOIN OPTION opt ON oio.option_id = opt.option_id
    LEFT JOIN ORDER_ITEM_TOPPING oit ON oi.order_item_id = oit.order_item_id
    LEFT JOIN TOPPING top ON oit.topping_id = top.topping_id
    WHERE oi.status IN ('queue', 'prepare')
    GROUP BY oi.order_item_id
    ORDER BY oi.order_item_time ASC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Error fetching kitchen orders:', err.message);
      return res.status(500).json({ success: false, message: 'DB Error' });
    }
    res.json({ success: true, orders: rows });
  });
});

// 3. API อัปเดตสถานะอาหาร
router.post('/api/update-status', (req, res) => {
  const { order_item_id, next_status } = req.body;

  if (!['prepare', 'finish'].includes(next_status)) {
    return res.status(400).json({ success: false, message: 'สถานะไม่ถูกต้อง' });
  }

  const sql = 'UPDATE ORDER_ITEM SET status = ? WHERE order_item_id = ?';
  db.run(sql, [next_status, order_item_id], function (err) {
    if (err) {
      console.error('Error updating status:', err.message);
      return res.status(500).json({ success: false, message: 'DB Error' });
    }
    res.json({ success: true, message: 'อัปเดตสถานะเรียบร้อย' });
  });
});

module.exports = router;