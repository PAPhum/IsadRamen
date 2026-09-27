const express = require('express');
const router = express.Router();
const db = require('../database');

// Helper ถอดรหัส Cookie
function parseCookies(req) {
  const list = {};
  const rc = req.headers.cookie;
  if (rc) {
    rc.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      if (parts.length >= 2) {
        list[parts.shift().trim()] = decodeURIComponent(parts.join('='));
      }
    });
  }
  return list;
}

// Logic หลักในการแจกโต๊ะตามลำดับ (1 -> 2 -> ... -> 20 แล้ววนลูป) พร้อมจำ Cookie
function assignTableAndRedirect(req, res) {
  const cookies = parseCookies(req);
  const forceNew = req.query.new === '1' || req.query.reset === '1';

  // ถ้ามี Cookie โต๊ะอยู่แล้ว และไม่ได้สั่งขอโต๊ะใหม่ (?new=1) ให้พาไปโต๊ะเดิมทันที
  if (!forceNew && cookies.customer_table) {
    const existingTable = cookies.customer_table.trim().toUpperCase();
    if (/^T\d+$/.test(existingTable)) {
      return res.redirect(`/customer/${existingTable}`);
    }
  }

  // หากไม่มี Cookie หรือต้องการโต๊ะใหม่ ให้รันลำดับโต๊ะถัดไป (1..20)
  db.get("SELECT value FROM SYSTEM_STATE WHERE key = 'last_assigned_table'", [], (err, row) => {
    let lastNum = 0;
    if (row && row.value) {
      lastNum = parseInt(row.value, 10) || 0;
    }

    // รันลำดับโต๊ะถัดไป: 1 ถึง 20 แล้ววนกลับมาที่ 1
    const nextNum = (lastNum % 20) + 1;
    const tableNumber = 'T' + String(nextNum).padStart(2, '0');

    // บันทึกลำดับโต๊ะล่าสุดลง SQLite
    const updateSql = `
      INSERT INTO SYSTEM_STATE (key, value) VALUES ('last_assigned_table', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `;

    db.run(updateSql, [String(nextNum)], (saveErr) => {
      if (saveErr) {
        console.error('Error saving last assigned table:', saveErr.message);
      }

      // ตั้งค่า Cookie จำเครื่องลูกค้าไว้ 24 ชั่วโมง
      res.setHeader('Set-Cookie', `customer_table=${tableNumber}; Path=/; Max-Age=86400; SameSite=Lax`);
      console.log(`[QR Scan] เครื่องใหม่ได้รับโต๊ะ: ${tableNumber} (ถัดจากโต๊ะ ${lastNum})`);
      return res.redirect(`/customer/${tableNumber}`);
    });
  });
}

// GET /scan - ระบบสแกนแจกโต๊ะ
router.get('/', (req, res) => {
  assignTableAndRedirect(req, res);
});

// ส่งออก router พร้อมฟังก์ชัน assignTableAndRedirect สำหรับ route GET /
module.exports = router;
module.exports.assignTableAndRedirect = assignTableAndRedirect;