-- 1. ตารางหมวดหมู่อาหาร
CREATE TABLE IF NOT EXISTS MENU_CATEGORY (
    category_id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_name VARCHAR(100) NOT NULL,
    category_order INTEGER NOT NULL
);

-- 2. ตารางรายการอาหารหลัก
CREATE TABLE IF NOT EXISTS MENU_ITEM (
    menu_id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    menu_name VARCHAR(100) NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    menu_image VARCHAR(255),
    FOREIGN KEY (category_id) REFERENCES MENU_CATEGORY(category_id)
);

-- 3. ตารางข้อมูลโต๊ะ
CREATE TABLE IF NOT EXISTS TABLES (
    table_id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_number VARCHAR(10) NOT NULL,
    card_id VARCHAR(50) UNIQUE NOT NULL
);

-- 4. ตารางตัวเลือกการปรับแต่งฟรี
CREATE TABLE IF NOT EXISTS OPTION (
    option_id INTEGER PRIMARY KEY AUTOINCREMENT,
    option_category VARCHAR(50) NOT NULL,
    option_name VARCHAR(50) NOT NULL
);

-- 5. ตาราง Topping เพิ่มเงิน
CREATE TABLE IF NOT EXISTS TOPPING (
    topping_id INTEGER PRIMARY KEY AUTOINCREMENT,
    topping_name VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL
);

-- 6. ตารางหัวบิลการสั่งซื้อ
CREATE TABLE IF NOT EXISTS ORDERS (
    order_id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_id INTEGER NOT NULL,
    is_paid BOOLEAN DEFAULT 0,
    order_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (table_id) REFERENCES TABLES(table_id)
);

-- 7. ตารางรายการอาหารในออเดอร์
CREATE TABLE IF NOT EXISTS ORDER_ITEM (
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
CREATE TABLE IF NOT EXISTS ORDER_ITEM_OPTION (
    item_option_id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_item_id INTEGER NOT NULL,
    option_id INTEGER NOT NULL,
    FOREIGN KEY (order_item_id) REFERENCES ORDER_ITEM(order_item_id),
    FOREIGN KEY (option_id) REFERENCES OPTION(option_id)
);

-- 9. ตารางกลางเลือก Topping
CREATE TABLE IF NOT EXISTS ORDER_ITEM_TOPPING (
    item_topping_id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_item_id INTEGER NOT NULL,
    topping_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    topping_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_item_id) REFERENCES ORDER_ITEM(order_item_id)
);

-- 10. ตารางข้อมูลการชำระเงิน
CREATE TABLE IF NOT EXISTS PAYMENT (
    payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_id INTEGER NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT CHECK(payment_method IN ('CASH', 'TRANSFER')) NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL,
    change_amount DECIMAL(10,2) NOT NULL,
    payment_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (table_id) REFERENCES TABLES(table_id)
);
