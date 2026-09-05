-- 1. ตารางหมวดหมู่อาหาร
CREATE TABLE MENU_CATEGORY (
    category_id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_name VARCHAR(100) NOT NULL,
    category_order INTEGER NOT NULL
);

-- 2. ตารางรายการอาหารหลัก
CREATE TABLE MENU_ITEM (
    menu_id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    menu_name VARCHAR(100) NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    menu_image VARCHAR(255),
    FOREIGN KEY (category_id) REFERENCES MENU_CATEGORY(category_id)
);

-- 3. ตารางข้อมูลโต๊ะ
CREATE TABLE TABLES (
    table_id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_number VARCHAR(10) NOT NULL,
    card_id VARCHAR(50) UNIQUE NOT NULL
);

-- 4. ตารางตัวเลือกการปรับแต่งฟรี
CREATE TABLE OPTION (
    option_id INTEGER PRIMARY KEY AUTOINCREMENT,
    option_category VARCHAR(50) NOT NULL,
    option_name VARCHAR(50) NOT NULL
);

-- 5. ตาราง Topping เพิ่มเงิน
CREATE TABLE TOPPING (
    topping_id INTEGER PRIMARY KEY AUTOINCREMENT,
    topping_name VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL
);

-- 6. ตารางหัวบิลการสั่งซื้อ (เพิ่ม order_time)
CREATE TABLE ORDERS (
    order_id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_id INTEGER NOT NULL,
    is_paid BOOLEAN DEFAULT 0,
    order_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (table_id) REFERENCES TABLES(table_id)
);

-- 7. ตารางรายการอาหารในออเดอร์
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

-- 8. ตารางกลางเลือกตัวเลือกฟรี
CREATE TABLE ORDER_ITEM_OPTION (
    item_option_id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_item_id INTEGER NOT NULL,
    option_id INTEGER NOT NULL,
    FOREIGN KEY (order_item_id) REFERENCES ORDER_ITEM(order_item_id),
    FOREIGN KEY (option_id) REFERENCES OPTION(option_id)
);

-- 9. ตารางกลางเลือก Topping
CREATE TABLE ORDER_ITEM_TOPPING (
    item_topping_id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_item_id INTEGER NOT NULL,
    topping_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    topping_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_item_id) REFERENCES ORDER_ITEM(order_item_id),
    FOREIGN KEY (topping_id) REFERENCES TOPPING(topping_id)
);

-- 10. ตารางข้อมูลการชำระเงิน
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

-- =========================================================
-- SEED DATA (ข้อมูลเริ่มต้น)
-- =========================================================

-- สร้างข้อมูลโต๊ะ 1-20
INSERT INTO TABLES (table_number, card_id) VALUES 
('T01', 'CARD-01'), ('T02', 'CARD-02'), ('T03', 'CARD-03'), ('T04', 'CARD-04'), ('T05', 'CARD-05'),
('T06', 'CARD-06'), ('T07', 'CARD-07'), ('T08', 'CARD-08'), ('T09', 'CARD-09'), ('T10', 'CARD-10'),
('T11', 'CARD-11'), ('T12', 'CARD-12'), ('T13', 'CARD-13'), ('T14', 'CARD-14'), ('T15', 'CARD-15'),
('T16', 'CARD-16'), ('T17', 'CARD-17'), ('T18', 'CARD-18'), ('T19', 'CARD-19'), ('T20', 'CARD-20');

-- หมวดหมู่อาหาร
INSERT INTO MENU_CATEGORY (category_name, category_order) VALUES 
('ราเมง', 1), ('ของทานเล่น', 2), ('เครื่องดื่ม', 3);

-- เมนูอาหารตัวอย่าง (แก้ไขชื่อไฟล์รูปภาพแล้ว)
INSERT INTO MENU_ITEM (category_id, menu_name, base_price, menu_image) VALUES 
(1, 'โชยุราเมง', 120.00, 'shoyu.jpg'),
(1, 'ทงคตสึราเมง', 140.00, 'tonkotsu.jpg'),
(1, 'ซารุราเมง', 100.00, 'zaru.jpg'),
(1, 'ชิโอะเลม่อนราเมง', 140.00, 'shio-lemon.jpg'),
(1, 'สไปซี่มิโซะราเมง', 140.00, 'spicy-miso.jpg'),
(2, 'เกี๊ยวซ่า', 60.00, 'gyoza.jpg'),
(2, 'คาราอาเกะ', 60.00, 'karaage.jpg'),
(3, 'โค้ก', 30.00, 'coke.jpg'),
(3, 'น้ำเปล่า', 20.00, 'water.jpg');

-- เพิ่มข้อมูลตัวเลือกฟรี (OPTION)
INSERT INTO OPTION (option_category, option_name) VALUES 
('ความนุ่มเส้น', 'นุ่มมาก'),
('ความนุ่มเส้น', 'ปานกลาง'),
('ความนุ่มเส้น', 'แข็ง'),
('ความข้นซุป', 'ข้นน้อย'),
('ความข้นซุป', 'ปานกลาง'),
('ความข้นซุป', 'ข้นมาก'),
('ความเผ็ด', 'เผ็ดน้อย'),
('ความเผ็ด', 'ปานกลาง'),
('ความเผ็ด', 'เผ็ดมาก'),
('ต้นหอม', 'ไม่ใส่'),
('ต้นหอม', 'ใส่'),
('ต้นหอม', 'ใส่เยอะ');

-- เพิ่มข้อมูล Topping (TOPPING)
INSERT INTO TOPPING (topping_name, price) VALUES 
('หมูชาชู', 10.00),
('ไข่ต้มยางมะตูม', 10.00),
('ลูกชิ้นปลาญี่ปุ่น', 5.00),
('สาหร่าย', 10.00);

