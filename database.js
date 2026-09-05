const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// ชี้ตำแหน่งไปยังไฟล์ ramen.db ในโฟลเดอร์ database
const dbPath = path.join(__dirname, 'database', 'ramen.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ ไม่สามารถเชื่อมต่อ SQLite Database ได้:', err.message);
  } else {
    console.log('✅ เชื่อมต่อ SQLite Database (ramen.db) เรียบร้อยแล้ว');
    initDatabase();
  }
});

function initDatabase() {
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='TABLES'", (err, row) => {
    if (err) return console.error('Error checking tables:', err);
    if (!row) {
      console.log('⚡ ฐานข้อมูลยังไม่มีตาราง กำลังรัน schema.sql และ seed.sql...');
      const schemaSql = fs.readFileSync(path.join(__dirname, 'database', 'schema.sql'), 'utf8');
      const seedSql = fs.readFileSync(path.join(__dirname, 'database', 'seed.sql'), 'utf8');
      
      db.exec(schemaSql, (schemaErr) => {
        if (schemaErr) return console.error('Error executing schema.sql:', schemaErr);
        db.exec(seedSql, (seedErr) => {
          if (seedErr) return console.error('Error executing seed.sql:', seedErr);
          console.log('✅ โหลด Schema และ Seed ข้อมูลเริ่มต้นเรียบร้อยแล้ว');
        });
      });
    }
  });
}

module.exports = db;