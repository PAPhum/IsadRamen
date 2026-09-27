# Prompt สำหรับสร้าง Demo ระบบสั่งราเมงผ่านหน้าจอ Tablet

## Tech Stack: Express.js + SQLite + EJS + Tailwind CSS

สร้าง Demo ระบบร้านราเมงแบบ Eat-in สำหรับใช้งาน local โดยจำลอง 3 ฝั่งหลัก: Customer, Chef และ Cashier และมีหน้าจอจำลองสำหรับแสดง QR/ใบเสร็จตาม Wireframe ที่แนบมา

> **สำคัญ:** UI เน้นการกด/แตะเป็นหลัก ไม่มี Slider และไม่มี Note input เพราะผู้ใช้ไม่ควรต้องพิมพ์ข้อความในการสั่งหรือปรับแต่งอาหาร

---

# 1. เป้าหมายและ Flow หลัก

ระบบต้องรองรับ Flow ตั้งแต่:

```text
Customer เข้าหน้า Tablet ของโต๊ะ
→ ดูเมนู
→ เลือกอาหาร
→ ปรับแต่งด้วยปุ่ม
→ เพิ่มเข้า Order
→ เพิ่ม/ลด/ลบ/แก้ไขรายการ
→ ยืนยัน Order
→ ส่ง Order Item เข้าครัว
→ Chef รับทีละ Item
→ queue → prepare → finish
→ เมื่อ finish ให้แสดง Food Slip แบบจำลอง
→ Customer สั่งเพิ่มได้อีก
→ นำ Payment Card ไป Cashier
→ Cashier Scan/จำลอง Scan Card
→ Card ID → Table ID
→ แสดงรายการที่ยังไม่จ่ายทั้งหมดของโต๊ะ
→ รับเงินสดหรือ Mock Transfer/QR
→ ยืนยันการชำระ
→ Receipt
→ Reset Order ของโต๊ะ
→ ลูกค้าคนใหม่เริ่มสั่งใหม่
```

---

# 2. Use Case ต้องมี 9 ตัวเท่านั้น

## Customer

1. ดูรายการอาหาร
2. เลือกรายการอาหาร
3. ปรับแต่งรายการอาหาร
4. จัดการตะกร้าสินค้า
5. ตรวจสอบประวัติรายการอาหารที่สั่ง

## Chef

6. รับคำสั่งซื้อเพื่อดำเนินการปรุงอาหาร
7. อัปเดตสถานะรายการอาหาร

## Cashier

8. ดูรายการคำสั่งซื้อ
9. รับชำระเงิน

**ห้ามสร้าง Use Case ที่ 10 สำหรับยืนยัน Order** เพราะการยืนยันเป็นส่วนหนึ่งของ Use Case 4

---

# 3. กฎสำคัญของ Order

**Cart = Order** และไม่มี Cart table/entity แยก

เมื่อ Customer เพิ่มอาหาร รายการถูกเพิ่มเข้า Order ปัจจุบัน

```text
เลือกอาหาร
→ Customize
→ เพิ่มลงรายการ
→ อยู่ใน Order ปัจจุบัน
```

เมื่อกด `ยืนยันรายการ` ไม่ได้หมายความว่าเพิ่งสร้าง Order แต่หมายถึง **ยืนยัน Order ปัจจุบันและส่งรายการไปครัว**

หลังจาก Order รอบหนึ่งถูกยืนยันแล้ว ถ้าลูกค้ากลับมาสั่งเพิ่ม ให้สร้าง Order รอบใหม่ได้

ตัวอย่าง:

```text
Order #1: ราเมง + เกี๊ยวซ่า → ยืนยัน → ส่งครัว
Order #2: โค้ก + คาราอาเกะ → ยืนยัน → ส่งครัว
```

ตอน Cashier คิดเงิน ให้รวมรายการจาก Order ที่ยังไม่ชำระทั้งหมดของ Table เดียวกัน

---

# 4. Table และ Payment Card

มีโต๊ะ T01-T20 และ Payment Card ประจำโต๊ะ เช่น:

```text
T01 → CARD-01
T02 → CARD-02
...
T20 → CARD-20
```

Tablet แต่ละเครื่องผูกกับ Table ID อยู่แล้ว เช่น:

```text
/customer/T05
```

หมายถึง Tablet ของ T05

Customer **ไม่ต้อง**:

- เลือกโต๊ะ
- Scan Card/QR ที่ Tablet
- กรอก Table ID
- Login
- เลือก Dine-in/Takeaway

Payment Card ใช้ตอนจ่ายเงินที่ Cashier เท่านั้น

---

# 5. Database

ใช้ SQLite และโครงสร้างต้องสอดคล้องกับ `detail.md`

## MENU_CATEGORY

```sql
CREATE TABLE MENU_CATEGORY (
    category_id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_name VARCHAR(100) NOT NULL,
    category_order INTEGER NOT NULL
);
```

## MENU_ITEM

```sql
CREATE TABLE MENU_ITEM (
    menu_id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    menu_name VARCHAR(100) NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    menu_image VARCHAR(255),
    FOREIGN KEY (category_id) REFERENCES MENU_CATEGORY(category_id)
);
```

## TABLES

```sql
CREATE TABLE TABLES (
    table_id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_number VARCHAR(10) NOT NULL,
    card_id VARCHAR(50) UNIQUE NOT NULL
);
```

## OPTION

```sql
CREATE TABLE OPTION (
    option_id INTEGER PRIMARY KEY AUTOINCREMENT,
    option_category VARCHAR(50) NOT NULL,
    option_name VARCHAR(50) NOT NULL
);
```

## TOPPING

```sql
CREATE TABLE TOPPING (
    topping_id INTEGER PRIMARY KEY AUTOINCREMENT,
    topping_name VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL
);
```

## ORDERS

```sql
CREATE TABLE ORDERS (
    order_id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_id INTEGER NOT NULL,
    is_paid BOOLEAN DEFAULT 0,
    order_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (table_id) REFERENCES TABLES(table_id)
);
```

## ORDER_ITEM

```sql
CREATE TABLE ORDER_ITEM (
    order_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    menu_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    status TEXT CHECK(status IN ('queue', 'prepare', 'finish')) DEFAULT 'queue',
    note VARCHAR(255),
    order_item_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES ORDERS(order_id),
    FOREIGN KEY (menu_id) REFERENCES MENU_ITEM(menu_id)
);
```

## ORDER_ITEM_OPTION

```sql
CREATE TABLE ORDER_ITEM_OPTION (
    item_option_id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_item_id INTEGER NOT NULL,
    option_id INTEGER NOT NULL,
    FOREIGN KEY (order_item_id) REFERENCES ORDER_ITEM(order_item_id),
    FOREIGN KEY (option_id) REFERENCES OPTION(option_id)
);
```

## ORDER_ITEM_TOPPING

```sql
CREATE TABLE ORDER_ITEM_TOPPING (
    item_topping_id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_item_id INTEGER NOT NULL,
    topping_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    topping_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_item_id) REFERENCES ORDER_ITEM(order_item_id)
);
```

## PAYMENT

```sql
CREATE TABLE PAYMENT (
    payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_id INTEGER NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT CHECK(payment_method IN ('CASH', 'TRANSFER')) NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL,
    change_amount DECIMAL(10,2) NOT NULL,
    payment_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (table_id) REFERENCES TABLES(table_id)
);
```

### Note column

Database เดิมมี `ORDER_ITEM.note` แต่ **Demo UI ห้ามมีช่อง Note** และห้ามมี textarea/keyboard input สำหรับ Note ปล่อยค่าเป็น `NULL` ได้

---

# 6. Seed Data

ใช้ข้อมูลตาม `detail.md`

### Category

```text
ราเมง
ของทานเล่น
เครื่องดื่ม
```

### Menu

```text
โชยุราเมง           120
ทงคตสึราเมง         140
ซารุราเมง           100
ชิโอะเลม่อนราเมง    140
สไปซี่มิโซะราเมง    140
เกี๊ยวซ่า             60
คาราอาเกะ            60
โค้ก                  30
น้ำเปล่า              20
```

Images:

```text
shoyu.jpg
tonkotsu.jpg
zaru.jpg
shio-lemon.jpg
spicy-miso.jpg
gyoza.jpg
karaage.jpg
coke.jpg
water.jpg
```

### Free Options

```text
ความนุ่มเส้น: นุ่มมาก / ปานกลาง / แข็ง
ความข้นซุป: ข้นน้อย / ปานกลาง / ข้นมาก
ความเผ็ด: เผ็ดน้อย / ปานกลาง / เผ็ดมาก
ต้นหอม: ไม่ใส่ / ใส่ / ใส่เยอะ
```

### Topping

```text
หมูชาชู +10
ไข่ต้มยางมะตูม +10
ลูกชิ้นปลาญี่ปุ่น +5
สาหร่าย +10
```

---

# 7. Customer UI

Route หลัก:

```text
/customer/:tableNumber
```

## Start Screen

หน้าจอใหญ่ตาม Wireframe:

```text
┌─────────────────────────────┐
│                             │
│       กดเพื่อเลือกเมนู       │
│                             │
└─────────────────────────────┘
```

กดแล้วไป Menu

---

# 8. Customer Menu

Layout แบบ Tablet Landscape:

```text
┌──────────────────────────────────────────────────────┐
│ [ราเมง] [ของทานเล่น] [เครื่องดื่ม]                  │
├───────────────────────────────┬──────────────────────┤
│ Menu Cards                    │ รายการอาหาร           │
│                               │                      │
│ [รูป] โชยุราเมง 120           │ ทงคตสึราเมง x1       │
│ [รูป] ทงคตสึราเมง 140         │ เกี๊ยวซ่า x2          │
│ [รูป] ...                     │                      │
│                               │ รวม xxx บาท          │
│                               │ [ยืนยันรายการ]       │
└───────────────────────────────┴──────────────────────┘
```

ต้องมี:

- Category buttons
- Menu cards
- รูป
- ชื่อ
- ราคา
- Order panel ด้านขวา
- Quantity `+/-`
- Delete
- History
- Confirm

---

# 9. เลือกอาหาร

เมื่อกด Menu Card:

### ถ้าปรับแต่งได้

```text
Menu → Customize
```

เปิด Customize ทันที

### ถ้าไม่ต้องปรับแต่ง

เพิ่มเข้า Order ได้ทันที เช่น โค้ก/น้ำเปล่า

ห้ามสร้างหน้า Customize โดยไม่จำเป็น

---

# 10. Customize UI

ต้องเป็น Click-based 100%

ตัวอย่าง:

```text
ทงคตสึราเมง

ความนุ่มเส้น
[นุ่มมาก] [ปานกลาง] [แข็ง]

ความข้นซุป
[ข้นน้อย] [ปานกลาง] [ข้นมาก]

ความเผ็ด
[เผ็ดน้อย] [ปานกลาง] [เผ็ดมาก]

ต้นหอม
[ไม่ใส่] [ใส่] [ใส่เยอะ]

Topping
[+ หมูชาชู 10]
[+ ไข่ 10]
[+ ลูกชิ้น 5]
[+ สาหร่าย 10]

จำนวน
[-] 1 [+]

ราคา 165 บาท

[เพิ่มลงรายการ]
```

**ห้ามใช้ Slider**

**ห้ามใช้ Text Input**

**ห้ามใช้ Textarea**

**ห้ามมี Note**

Free Option แต่ละ `option_category` เลือกได้ 1 ค่า

Topping ใช้ Toggle/Checkbox-style button และสามารถเลือกหลายรายการได้

---

# 11. การคำนวณราคา

```text
unit_price = base_price + topping_price_total
item_total = unit_price × quantity
```

แสดงราคาทันทีเมื่อกด Option/Topping หรือ +/-

ตัวอย่าง:

```text
ทงคตสึราเมง 140
หมูชาชู 10
ไข่ 10
ต่อหน่วย 160
จำนวน 2
รวม 320
```

`ORDER_ITEM.unit_price` ต้องเก็บราคาต่อหน่วย ณ เวลาที่เพิ่มรายการ เพื่อไม่ให้ราคา Order เก่าเปลี่ยนตาม MENU_ITEM ในอนาคต

---

# 12. Order Panel

แสดง:

```text
ทงคตสึราเมง
เส้นแข็ง / ซุปข้นมาก / เผ็ดปานกลาง
เพิ่มหมูชาชู
[-] 1 [+]
160 บาท
[ลบ]
```

การลดจนเหลือ 0 ให้ลบรายการ

การกดชื่อรายการให้เปิด Customize พร้อมค่าที่เลือกเดิมเพื่อแก้ไข

ถ้า customization ต่างกัน ให้เป็นคนละ Order Item

---

# 13. Confirm Order

ปุ่ม `ยืนยันรายการ` เป็นส่วนหนึ่งของ Use Case 4

Flow:

```text
ตรวจสอบ Order ปัจจุบัน
→ ถ้าไม่มีรายการ แสดง error
→ ถ้ามีรายการ บันทึก/ยืนยัน
→ ส่ง Order Item ไป Chef Queue
→ แสดง Success
→ Customer กลับไปสั่งเพิ่มได้
```

**ห้ามสร้าง Order ใหม่เพียงเพราะกดยืนยัน**

---

# 14. Customer History

ปุ่ม `ประวัติรายการอาหาร`

แสดงรายการที่โต๊ะนี้เคยสั่งก่อนชำระเงิน เช่น:

```text
✓ ทงคตสึราเมง x1
  เส้นแข็ง / ซุปข้นมาก
✓ เกี๊ยวซ่า x1
✓ โค้ก x2
```

อิงจาก Table ID และ Order/Order Item ที่ยังอยู่

ไม่มี Customer Account

ไม่มี Login

หลังชำระเงินและ Reset แล้ว รายการเก่าต้องไม่แสดงให้ลูกค้าคนใหม่เห็น

---

# 15. ปุ่มชำระเงินบน Customer

ปุ่มนี้ **ไม่ใช่ Payment Process**

กดแล้วแสดงข้อความ:

```text
เมื่อรับประทานอาหารเสร็จ
กรุณานำ Payment Card
ไปชำระเงินที่แคชเชียร์
```

ห้าม:

- เปิด Payment Gateway
- Lock Order
- ปิดโต๊ะ
- หยุดการสั่งอาหาร
- สร้าง Payment ผ่าน Customer

---

# 16. Chef UI

Route:

```text
/chef
```

ใช้หน้าจอเดียวสำหรับครัว

แบ่งอย่างน้อยเป็น:

```text
รอคิว
กำลังทำ
ประวัติ/เสร็จแล้ว
```

## Queue

ดึง `status = 'queue'`

ตัวอย่าง Card:

```text
T05
ทงคตสึราเมง x1
เส้นแข็ง
ซุปข้นมาก
เพิ่มหมูชาชู

[รับคำสั่งซื้อ]
```

เมื่อกด:

```text
queue → prepare
```

รับทีละ Order Item ไม่ใช่รับทั้ง Order

## Preparing

```text
T05
ทงคตสึราเมง x1

[เสร็จสิ้น]
```

เมื่อกด:

```text
prepare → finish
```

---

# 17. Food Slip

เมื่อ Item เป็น `finish` ให้สร้างใบรายการอาหารแบบจำลองทันที

ไม่จำเป็นต้องใช้ Printer จริง

แสดงเป็น Modal/Print Preview หรือหน้าจอจำลองได้

ตัวอย่าง:

```text
-------------------------
TABLE T05

ทงคตสึราเมง x1

เส้น: แข็ง
ซุป: ข้นมาก
เพิ่ม: หมูชาชู
-------------------------
```

จุดประสงค์คือให้พนักงานเสิร์ฟรู้ว่าอาหารไปโต๊ะใด

ไม่ต้องเพิ่ม Serving Staff เป็น Actor

---

# 18. Cashier UI

Route:

```text
/cashier
```

Layout ตาม Wireframe:

```text
┌──────────────┬──────────────────────────────┐
│ โต๊ะ / Card   │ รายการอาหารของโต๊ะ          │
│              │                              │
│ T01          │ รายการอาหาร                 │
│ T02          │ ...                          │
│ ...          │ รวม xxx บาท                 │
│ T20          │                              │
└──────────────┴──────────────────────────────┘
```

---

# 19. Cashier Scan Payment Card

ใน Demo ไม่ต้องต่อเครื่อง Scan จริง

ทำเป็นปุ่ม `Scan Payment Card` แล้วเปิดรายการจำลอง:

```text
CARD-01
CARD-02
...
CARD-20
```

หรือทำ UI Scan แบบ Mock

เมื่อเลือก `CARD-05`:

```text
CARD-05 → T05
```

ห้ามให้ Customer Scan Card บน Tablet

---

# 20. Cashier ดูรายการ

หลังรู้ว่าเป็น T05 ให้ดึง Order ที่ `is_paid = 0` ของ T05 ทั้งหมด แล้วรวมรายการ

ตัวอย่าง:

```text
T05

ทงคตสึราเมง x1     140
เกี๊ยวซ่า x2         120
โค้ก x1              30
ไข่ต้ม x1            10
------------------------
รวม                  300
```

ไม่ต้องแสดง `queue/prepare/finish` ในหน้า Cashier

---

# 21. Cash Payment

ใช้ Numeric Keypad แบบปุ่มกดตาม Wireframe

**ห้ามใช้ Keyboard/Text Input สำหรับจำนวนเงินสด**

ตัวอย่าง:

```text
ยอดรวม 300 บาท

รับเงิน: 500

[1][2][3]
[4][5][6]
[7][8][9]
[C][0][←]

เงินทอน 200 บาท

[ยืนยันการชำระเงิน]
```

หากเงินไม่พอให้แสดง Error และไม่ชำระ

---

# 22. Transfer / Mock QR

มีปุ่มเลือก `โอนเงิน`

เมื่อเลือก:

```text
แสดง Mock QR
```

ไม่มี Bank API และไม่มี Payment Gateway จริง

Flow:

```text
เลือก Transfer
→ แสดง QR Mock
→ ลูกค้าชำระภายนอกระบบ
→ Cashier ตรวจสอบเอง
→ Cashier กดยืนยัน
```

---

# 23. Payment Success และ Receipt

เมื่อ Cashier ยืนยัน:

1. ประมวลผล Payment
2. แสดง Payment Success
3. แสดง/สร้าง Receipt แบบจำลอง
4. Clear/ปิด Order ที่ยังไม่ชำระของ Table
5. ทำให้ Table พร้อมสำหรับลูกค้าใหม่

Receipt ตัวอย่าง:

```text
================================
       RAMEN RESTAURANT

Table: T05

ทงคตสึราเมง        x1    140
เกี๊ยวซ่า            x2    120
โค้ก                 x1     30
ไข่ต้ม               x1     10
--------------------------------
TOTAL                     300

Payment: CASH
Paid: 500
Change: 200
================================
```

ไม่ต้องทำ VAT, Promotion, Discount หรือ Service Charge

ไม่ต้องสร้าง Payment History UI

---

# 24. Reset Table

หลัง Payment สำเร็จ:

```text
T05
→ Order ที่ยังไม่จ่ายทั้งหมดถูกเคลียร์/ปิด
→ Customer History เดิมหายจากมุมมองของโต๊ะ
→ ลูกค้าคนใหม่เริ่ม Order ใหม่ได้
```

ต้องระวังไม่ให้ลูกค้าคนใหม่เห็นรายการเก่า

---

# 25. Routes ที่แนะนำ

```text
GET  /                         → Demo Role Selection

GET  /customer/:tableNumber   → Customer Start
GET  /customer/:tableNumber/menu
GET  /customer/:tableNumber/customize/:menuId
GET  /customer/:tableNumber/history
POST /customer/:tableNumber/order
POST /customer/:tableNumber/order/:itemId/update
POST /customer/:tableNumber/order/:itemId/delete
POST /customer/:tableNumber/order/confirm

GET  /chef
GET  /chef/history
POST /chef/order-item/:id/prepare
POST /chef/order-item/:id/finish

GET  /cashier
POST /cashier/card
POST /cashier/payment
GET  /cashier/receipt/:paymentId
```

ปรับ Route ได้ตาม implementation แต่ Business Flow ต้องเหมือนเดิม

---

# 26. Project Structure

```text
ramen-demo/
├── app.js
├── package.json
├── database/
│   ├── database.sqlite
│   ├── schema.sql
│   └── seed.sql
├── routes/
│   ├── customer.js
│   ├── chef.js
│   └── cashier.js
├── controllers/
│   ├── customerController.js
│   ├── chefController.js
│   └── cashierController.js
├── views/
│   ├── customer/
│   │   ├── start.ejs
│   │   ├── menu.ejs
│   │   ├── customize.ejs
│   │   ├── history.ejs
│   │   └── message.ejs
│   ├── chef/
│   │   ├── index.ejs
│   │   └── history.ejs
│   └── cashier/
│       ├── index.ejs
│       ├── payment.ejs
│       └── receipt.ejs
├── public/
│   ├── css/
│   ├── js/
│   └── images/
└── README.md
```

---

# 27. Tailwind/UI Direction

ใช้ Tailwind CSS

Customer:

- Tablet-first
- Landscape
- ปุ่มใหญ่
- Menu Card ชัดเจน
- Order Panel ด้านขวา
- Touch-friendly

Chef:

- Dashboard
- Queue/Preparing/Finished แยกชัด
- Table number เด่น
- ปุ่มสถานะใหญ่

Cashier:

- POS layout
- รายการอาหารด้านหนึ่ง
- Payment controls อีกด้าน
- Numeric keypad ใหญ่

อย่าใช้ Animation มาก และอย่าใช้ UI ที่ซับซ้อนจนบดบัง Flow

---

# 28. ไม่ต้องสร้าง Feature เหล่านี้

```text
Login
Register
Customer Account
Password
Reservation
Delivery
Takeaway
Inventory
Stock Management
Ingredient Management
Promotion
Coupon
VAT
Tax
Service Charge
Real Payment Gateway
Bank API
Real QR Payment API
Notification System
Chat
Review
Rating
Loyalty Point
Staff Management
Permission System
Complex Session Management
Note Input
Slider
Drag & Drop
Text-based food search
```

---

# 29. Error Handling

Customer:

```text
กรุณาเลือกตัวเลือกให้ครบ
กรุณาเลือกอาหารก่อน
ไม่พบรายการอาหาร
ไม่สามารถเพิ่มรายการได้
```

Chef:

```text
ไม่พบรายการอาหาร
รายการนี้ถูกดำเนินการแล้ว
```

Cashier:

```text
ไม่พบ Payment Card
ไม่พบรายการที่ต้องชำระ
จำนวนเงินไม่เพียงพอ
```

---

# 30. Database/Price Rules

การคำนวณ:

```text
Order Item Total = unit_price × quantity
Order Total = SUM(Order Item Total)
```

`unit_price` ต้องเก็บราคาของเมนู + Topping ณ เวลาที่เพิ่มรายการ

ตัวอย่าง:

```text
base = 140
topping = 20
unit_price = 160
quantity = 2
item_total = 320
```

---

# 31. Acceptance Test

ต้องสามารถ Demo ตามลำดับนี้ได้จริง:

```text
1. เปิด /customer/T05
2. กดเพื่อเลือกเมนู
3. เลือกหมวดราเมง
4. กดทงคตสึราเมง
5. เลือก Option ด้วยปุ่ม
6. เลือก Topping ด้วยปุ่ม
7. กด + เพื่อเพิ่มจำนวน
8. กดเพิ่มลงรายการ
9. เลือกเกี๊ยวซ่าเพิ่ม
10. จัดการจำนวน/ลบ/แก้ไขรายการได้
11. กดยืนยันรายการ
12. เปิด /chef
13. เห็นรายการ T05 ใน Queue
14. กดรับคำสั่งซื้อ → prepare
15. กดเสร็จสิ้น → finish
16. เห็น Food Slip แบบจำลอง
17. Customer สั่งเพิ่มได้อีก และเกิด Order รอบใหม่
18. เปิด /cashier
19. จำลอง Scan CARD-05
20. ระบบหา T05
21. แสดงรายการที่ยังไม่จ่ายทั้งหมดของ T05
22. เลือก Cash หรือ Transfer
23. Cash ใช้ Numeric Keypad
24. Transfer แสดง Mock QR
25. กดยืนยันการชำระ
26. แสดง Receipt
27. Reset Order ของ T05
28. กลับ Customer T05 แล้วไม่เห็นรายการของลูกค้าคนก่อน
29. สามารถเริ่มสั่งใหม่ได้
```

---

# 32. ข้อกำหนดสำคัญที่สุดสำหรับ Coding Agent

1. ทำให้ระบบทำงานจริงกับ SQLite ไม่ใช่ Static Mock UI
2. ทุกปุ่มหลักต้องมีผลกับข้อมูลหรือเปลี่ยนหน้าจอจริง
3. Customer ใช้ Click/Touch เป็นหลัก
4. ไม่มี Slider
5. ไม่มี Note input
6. ไม่มีการพิมพ์อาหารหรือ customization
7. Cart = Order ไม่มี Cart table
8. มี Use Case 9 ตัวตามรายการด้านบนเท่านั้น
9. Order Item มี status `queue`, `prepare`, `finish`
10. Chef รับทีละ Order Item
11. Finish แล้วสร้าง Food Slip แบบจำลองทันที
12. Cashier ใช้ Payment Card เพื่อระบุ Table
13. Cashier รวมรายการที่ยังไม่จ่ายของ Table
14. Transfer เป็น Mock QR เท่านั้น
15. Payment สำเร็จแล้วต้อง Reset ข้อมูล Order ของโต๊ะ
16. ลูกค้าคนใหม่ต้องไม่เห็นรายการของคนก่อน
17. ไม่มี Inventory
18. ไม่มี Login/Session ที่ซับซ้อน
19. UI ต้องใกล้เคียง Wireframe แต่สามารถปรับให้สวยและใช้งานง่ายขึ้นได้
20. ต้องมี README วิธีติดตั้งและ Demo

รันด้วยคำสั่งประมาณ:

```bash
npm install
npm run dev
```

และต้องสามารถทดสอบ End-to-End ตาม Acceptance Test ได้ครบ
