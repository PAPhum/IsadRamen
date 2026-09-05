const express = require('express');
const path = require('path');
const db = require('./database');

// Import Routes
const customerRouter = require('./routes/customer');
const chefRouter = require('./routes/chef');
const cashierRouter = require('./routes/cashier');
const scanRouter = require('./routes/scan');

const app = express();
const PORT = process.env.PORT || 3000;

// ตั้งค่า View Engine เป็น EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ตั้งค่า Body Parser และ Static Assets Folder
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ใช้งาน Routes หลัก
app.use('/customer', customerRouter);
app.use('/chef', chefRouter);
app.use('/kitchen', chefRouter); // รองรับ alias /kitchen ให้เข้าหน้าครัวได้เช่นกัน
app.use('/cashier', cashierRouter);
app.use('/scan', scanRouter);

// หน้า Demo Role Selection (GET /)
app.get('/', (req, res) => {
  res.render('home');
});

// API สำหรับ Reset ข้อมูล Orders เพื่อเริ่มทดสอบ Demo ใหม่
app.post('/api/reset-demo-orders', (req, res) => {
  db.serialize(() => {
    db.run('DELETE FROM ORDER_ITEM_OPTION');
    db.run('DELETE FROM ORDER_ITEM_TOPPING');
    db.run('DELETE FROM ORDER_ITEM');
    db.run('DELETE FROM ORDERS');
    db.run('DELETE FROM PAYMENT');
    db.run("DELETE FROM sqlite_sequence WHERE name IN ('ORDERS', 'ORDER_ITEM', 'ORDER_ITEM_OPTION', 'ORDER_ITEM_TOPPING', 'PAYMENT')", () => {
      res.json({ success: true, message: 'ล้างข้อมูล Orders และ Payments เรียบร้อยแล้ว' });
    });
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=================================`);
  console.log(`🚀 IsadRamen Server is running on port ${PORT}`);
  console.log(`🔗 Local Hub: http://localhost:${PORT}`);
  console.log(`🍜 Customer:  http://localhost:${PORT}/customer/T05`);
  console.log(`👨‍🍳 Chef:      http://localhost:${PORT}/chef`);
  console.log(`💳 Cashier:   http://localhost:${PORT}/cashier`);
  console.log(`🖥️ Display:   http://localhost:${PORT}/cashier/customer-display`);
  console.log(`=================================`);
});