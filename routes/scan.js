const express = require('express');
const router = express.Router();
const db = require('../database');

// GET /scan - ระบบสุ่ม/แจกโต๊ะว่างอัตโนมัติ
router.get('/', (req, res) => {
  // คิวรีหา table_id ตัวแรกที่ไม่มี order ค้างจ่าย (is_paid = 0)
  const sql = `
    SELECT table_id, table_number 
    FROM TABLES 
    WHERE table_id NOT IN (
      SELECT DISTINCT table_id 
      FROM ORDERS 
      WHERE is_paid = 0
    ) 
    ORDER BY table_id ASC 
    LIMIT 1
  `;

  db.get(sql, [], (err, row) => {
    if (err) {
      console.error('Error querying available table:', err.message);
      return res.status(500).send('เกิดข้อผิดพลาดในการค้นหาโต๊ะว่าง');
    }

    if (row) {
      // ถ้าเจอโต๊ะว่าง ให้ Redirect ไปยังหน้าแท็บเล็ตประจำโต๊ะนั้น
      console.log(`Assigning Table ID: ${row.table_id} (${row.table_number})`);
      return res.redirect(`/customer/table/${row.table_id}`);
    } else {
      // ถ้าโต๊ะเต็มทั้ง 20 โต๊ะ
      return res.send(`
        <div style="text-align: center; font-family: sans-serif; padding-top: 50px;">
          <h2>⚠️ ขณะนี้โต๊ะเต็มทุกโต๊ะ (1-20)</h2>
          <p>กรุณารอสักครู่ให้โต๊ะอื่นชำระเงินเรียบร้อยแล้วลองสแกนใหม่อีกครั้ง</p>
        </div>
      `);
    }
  });
});

module.exports = router;