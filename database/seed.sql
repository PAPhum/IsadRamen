-- สร้างข้อมูลโต๊ะ 1-20
INSERT OR IGNORE INTO TABLES (table_number, card_id) VALUES 
('T01', 'CARD-01'), ('T02', 'CARD-02'), ('T03', 'CARD-03'), ('T04', 'CARD-04'), ('T05', 'CARD-05'),
('T06', 'CARD-06'), ('T07', 'CARD-07'), ('T08', 'CARD-08'), ('T09', 'CARD-09'), ('T10', 'CARD-10'),
('T11', 'CARD-11'), ('T12', 'CARD-12'), ('T13', 'CARD-13'), ('T14', 'CARD-14'), ('T15', 'CARD-15'),
('T16', 'CARD-16'), ('T17', 'CARD-17'), ('T18', 'CARD-18'), ('T19', 'CARD-19'), ('T20', 'CARD-20');

-- หมวดหมู่อาหาร
INSERT OR IGNORE INTO MENU_CATEGORY (category_id, category_name, category_order) VALUES 
(1, 'ราเมง', 1), (2, 'ของทานเล่น', 2), (3, 'เครื่องดื่ม', 3);

-- เมนูอาหารตัวอย่าง
INSERT OR IGNORE INTO MENU_ITEM (menu_id, category_id, menu_name, base_price, menu_image) VALUES 
(1, 1, 'โชยุราเมง', 120.00, 'shoyu.jpg'),
(2, 1, 'ทงคตสึราเมง', 140.00, 'tonkotsu.jpg'),
(3, 1, 'ซารุราเมง', 100.00, 'zaru.jpg'),
(4, 1, 'ชิโอะเลม่อนราเมง', 140.00, 'shio-lemon.jpg'),
(5, 1, 'สไปซี่มิโซะราเมง', 140.00, 'spicy-miso.jpg'),
(6, 2, 'เกี๊ยวซ่า', 60.00, 'gyoza.jpg'),
(7, 2, 'คาราอาเกะ', 60.00, 'karaage.jpg'),
(8, 3, 'โค้ก', 30.00, 'coke.jpg'),
(9, 3, 'น้ำเปล่า', 20.00, 'water.jpg');

-- ตัวเลือกฟรี (OPTION)
INSERT OR IGNORE INTO OPTION (option_id, option_category, option_name) VALUES 
(1, 'ความนุ่มเส้น', 'นุ่มมาก'),
(2, 'ความนุ่มเส้น', 'ปานกลาง'),
(3, 'ความนุ่มเส้น', 'แข็ง'),
(4, 'ความข้นซุป', 'ข้นน้อย'),
(5, 'ความข้นซุป', 'ปานกลาง'),
(6, 'ความข้นซุป', 'ข้นมาก'),
(7, 'ความเผ็ด', 'เผ็ดน้อย'),
(8, 'ความเผ็ด', 'ปานกลาง'),
(9, 'ความเผ็ด', 'เผ็ดมาก'),
(10, 'ต้นหอม', 'ไม่ใส่'),
(11, 'ต้นหอม', 'ใส่'),
(12, 'ต้นหอม', 'ใส่เยอะ');

-- Topping (TOPPING)
INSERT OR IGNORE INTO TOPPING (topping_id, topping_name, price) VALUES 
(1, 'หมูชาชู', 10.00),
(2, 'ไข่ต้มยางมะตูม', 10.00),
(3, 'ลูกชิ้นปลาญี่ปุ่น', 5.00),
(4, 'สาหร่าย', 10.00);
