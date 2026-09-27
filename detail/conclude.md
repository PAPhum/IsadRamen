# สรุปการปรับปรุงและแก้ไขระบบ IsadRamen (conclude.md)

เอกสารฉบับนี้สรุปรายการแก้ไข การปรับปรุง UI/UX ฟังก์ชันการทำงาน และไฟล์ที่เกี่ยวข้องทั้งหมดตามข้อกำหนด โดยปฏิบัติตามกฎความปลอดภัยของ DOM ใน [AGENTS.md](file:///F:/year2/IsadRamen/AGENTS.md) อย่างเคร่งครัด (**ไม่มีการใช้ `innerHTML`, `outerHTML` หรือ `insertAdjacentHTML`** ในทุกส่วนที่พัฒนา)

---

## 1. ภาพรวมรายการแก้ไขตามความต้องการ (Feature Changelog)

### 1.1 หน้าจอเริ่มต้นลูกค้า (Customer Start: `/customer/:table_id`)
- **วัตถุประสงค์**: ปรับให้ผู้ใช้สามารถแตะหรือคลิกที่บริเวณใดก็ได้บนหน้าจอ (Click anywhere on screen) เพื่อเข้าสู่หน้าสั่งอาหารทันที
- **สิ่งที่ดำเนินการ**:
  - กำหนด `onclick` redirect ให้กับแท็ก `<body>` และครอบคลุมทั้งหน้าจอผ่าน container flex/link
  - ปรับปรุงให้รองรับทั้งเมาส์และการสัมผัสบน Tablet (`cursor-pointer`, `select-none`)
- **ไฟล์ที่แก้ไข**:
  - [`views/customer/start.ejs`](file:///F:/year2/IsadRamen/views/customer/start.ejs)

---

### 1.2 หน้าสั่งอาหารลูกค้า (Customer Menu: `/customer/:table_id/menu`)
- **วัตถุประสงค์**:
  1. ภาพอาหารอัตราส่วน 1:1 (Square aspect ratio) และจัดวาง Card ให้อยู่กึ่งกลางสมดุล
  2. การเปลี่ยนหน้าเมนูแบบวนลูปต่อเนื่อง (Continuous Looping Pagination) ข้ามหมวดหมู่ได้แบบไร้รอยต่อ
  3. ตารางตะกร้าสินค้า (Cart Table) ขยายเต็มความสูงแนวตั้ง พร้อมจัดสรรความสูง 8 แถวคงที่เท่ากันทุกแถว
- **สิ่งที่ดำเนินการ**:
  - **ภาพอาหาร 1:1**: ใช้คลาส `aspect-square`, `w-full`, `object-cover` และกำหนด style `aspectRatio = '1 / 1'` ให้รูปภาพเมนูทุกรายการ
  - **Continuous Looping Pagination**:
    - ฟังก์ชัน `nextMenuPage()`: เมื่อกดหน้าถัดไปในหน้าสุดท้ายของหมวดหมู่ จะเลื่อนไปยังหมวดหมู่ถัดไปโดยอัตโนมัติ (เช่น ราเมง ➔ ของทานเล่น ➔ เครื่องดื่ม ➔ วนกลับมาราเมง)
    - ฟังก์ชัน `prevMenuPage()`: เมื่อกดถอยหลังจากหน้าแรก จะย้อนกลับไปยังหน้าสุดท้ายของหมวดหมู่ก่อนหน้าแบบวนลูป
  - **ตาราง Cart เต็มความสูง 8 แถว**:
    - ตั้งค่าคอนเทนเนอร์ตารางเป็น `flex-1 overflow-hidden flex flex-col` และ `table` เป็น `h-full table-fixed`
    - กำหนดให้แต่ละแถวมีความสูง `style.height = '12.5%'` (100% / 8 แถว)
    - หากมีรายการน้อยกว่า 8 แถว ระบบจะสร้าง Empty Rows เติมเต็มให้ครบ 8 แถว พร้อมจัดเนื้อหากึ่งกลางแนวตั้ง (`align-middle`)
  - **DOM Manipulation**: ใช้ `textContent` และ standard DOM elements แทน `innerText` / `innerHTML`
- **ฟังก์ชันสำคัญที่แก้ไข**:
  - `renderMenuGrid()`
  - `nextMenuPage()`
  - `prevMenuPage()`
  - `renderCartTable()`
- **ไฟล์ที่แก้ไข**:
  - [`views/customer/menu.ejs`](file:///F:/year2/IsadRamen/views/customer/menu.ejs)

---

### 1.3 หน้าจอคิวในครัว (Chef Queue & History: `/chef`)
- **วัตถุประสงค์**:
  1. ลบป้าย "Auto Refresh (3s)" ออกจากส่วนหัว
  2. ปรับตารางคิวและตารางประวัติให้ขยายเต็มความสูง พร้อมจัด 8 แถวคงที่
  3. ปรับคอลัมน์สถานะ (Status) เป็นข้อความธรรมดา (Plain text) โดยไม่มีเส้นขอบหรือกล่อง Badge
- **สิ่งที่ดำเนินการ**:
  - นำ Badge แสดงสถานะ Auto Refresh ออกจากหัวข้อหน้าจอ
  - ปรับความสูงตารางคิวและตารางประวัติอาหารให้สูงเต็มพื้นที่ container และกระจายความสูง 8 แถว (`style.height = '12.5%'`)
  - แสดงสถานะเป็นข้อความธรรมดา เช่น `อยู่ในคิว`, `กำลังทำ`, `เสร็จสิ้น` พร้อมสีที่ชัดเจน (สีเหลืองอำพัน, สีน้ำเงิน, สีเขียว) โดยไม่มีขอบกล่อง badge
  - ใช้ `textContent` และ DOM methods ทั้งหมด
- **ฟังก์ชันสำคัญที่แก้ไข**:
  - `renderOrders(orders)`
  - `renderHistory(items)`
- **ไฟล์ที่แก้ไข**:
  - [`views/chef/index.ejs`](file:///F:/year2/IsadRamen/views/chef/index.ejs)

---

### 1.4 หน้าจอประวัติการสั่งซื้อลูกค้า (Customer History: `/customer/:table_id/history`)
- **วัตถุประสงค์**:
  1. ขยายตารางประวัติเต็มความสูงแนวตั้ง พร้อม 8 แถวคงที่
  2. นำขอบ/กล่อง badge ออกจากคอลัมน์สถานะ เหลือเฉพาะข้อความธรรมดา
- **สิ่งที่ดำเนินการ**:
  - ปรับโครงสร้าง Table Container เป็น `flex-1 overflow-hidden` และตารางความสูงเต็ม `h-full table-fixed`
  - Render แถวคงที่ 8 แถว (`style.height = '12.5%'`) ทั้งแถวข้อมูลและแถวว่าง
  - คอลัมน์สถานะแสดงผลข้อความ plain text สะอาดตา มีสีแบ่งสถานะชัดเจน
- **ฟังก์ชันสำคัญที่แก้ไข**:
  - `renderHistory(orders)`
- **ไฟล์ที่แก้ไข**:
  - [`views/customer/history.ejs`](file:///F:/year2/IsadRamen/views/customer/history.ejs)

---

### 1.5 หน้าจอแคชเชียร์ (Cashier POS: `/cashier`)
- **วัตถุประสงค์**:
  1. นำปุ่มนำทางด้านขวาบน (Nav Buttons) ออก
  2. ย่อขนาดโซนเลือกโต๊ะฝั่งซ้ายให้แสดง 10 โต๊ะต่อหน้า (2 คอลัมน์ x 5 แถว)
  3. ตารางรายการออเดอร์ตรงกลางขยายเต็มความสูง 8 แถว
  4. ซิงค์สถานะการเลือกชำระเงินไปยังจอฝั่งลูกค้าแบบ Real-time
- **สิ่งที่ดำเนินการ**:
  - ลบ navigation header ด้านขวาบนออกเพื่อให้หน้าจอสะอาดและเหมาะสมกับ POS
  - ปรับ Layout Grid เป็น `col-span-2` (โต๊ะ) | `col-span-6` (บิล/รายการ) | `col-span-4` (สรุปยอดและชำระเงิน)
  - กำหนด `tablesPerPage = 10` แสดงผลในรูปแบบ 2 คอลัมน์ x 5 แถว พร้อมปุ่มเลื่อนหน้าโต๊ะและแสดงอินดิเคเตอร์หน้า
  - ฟังก์ชัน `renderBill(orders)` ขยายเต็มความสูง 8 แถว (`style.height = '12.5%'`)
  - เพิ่มฟังก์ชัน `syncToCustomerDisplay(method, showQr)` เพื่อส่งสถานะไปยังจอฝั่งลูกค้าผ่าน 3 ช่องทางพร้อมกัน:
    1. `BroadcastChannel('cashier_display_sync')` (สำหรับ Instant Tab-to-Tab sync)
    2. `localStorage.setItem('cashier_display_state', ...)` (รองรับ Cross-window Event)
    3. ส่งสถานะไปยัง Backend Server ผ่าน `POST /cashier/api/payment-method`
- **ฟังก์ชันสำคัญที่แก้ไข**:
  - `renderTables()`
  - `renderBill(orders)`
  - `selectPayment(method)`
  - `syncToCustomerDisplay(method, showQr)`
  - `clearSelection()`
- **ไฟล์ที่แก้ไข**:
  - [`views/cashier/index.ejs`](file:///F:/year2/IsadRamen/views/cashier/index.ejs)
  - [`routes/cashier.js`](file:///F:/year2/IsadRamen/routes/cashier.js)

---

### 1.6 หน้าจอแสดงผลลูกค้าของแคชเชียร์ (Cashier Customer Display: `/cashier/customer-display`)
- **วัตถุประสงค์**:
  1. ซ่อน QR code เริ่มต้น (Default Hidden)
  2. แสดง QR code เฉพาะเมื่อแคชเชียร์กดเลือกวิธีชำระเงิน "โอน (QR)"
  3. ซ่อน QR code เมื่อแคชเชียร์กดเลือกวิธีชำระเงิน "เงินสด (CASH)"
  4. ตารางรายการอาหารขยายเต็มความสูง 8 แถว
- **สิ่งที่ดำเนินการ**:
  - ตั้งค่าเริ่มต้นของ QR Code Container ให้มีคลาส `hidden` และแสดง Banner Placeholder การชำระเงินแบบเงินสด/เคาน์เตอร์แทน
  - สร้างฟังก์ชัน `setQrVisibility(show, promptpayUrl)` เพื่อสลับการแสดงผลอย่างราบรื่น
  - เชื่อมโยงการรับ Event แบบ Real-time ผ่าน:
    - `BroadcastChannel('cashier_display_sync')` onmessage
    - `window.addEventListener('storage', ...)`
    - สถานะ `cashier_state` จาก API Polling (`/cashier/api/table-bill`)
  - ตารางรายการออเดอร์ของลูกค้าขยายเต็มความสูง 8 แถวคงที่ (`style.height = '12.5%'`)
- **ฟังก์ชันสำคัญที่แก้ไข**:
  - `setQrVisibility(show, promptpayUrl)`
  - `renderCustomerBill(data)`
  - `fetchCustomerBill()`
- **ไฟล์ที่แก้ไข**:
  - [`views/cashier/customer-display.ejs`](file:///F:/year2/IsadRamen/views/customer/display.ejs -> customer-display.ejs)

---

## 2. การปฏิบัติตามกฎ AGENTS.md (DOM Security Compliance)

ทุกส่วนของระบบได้รับการตรวจสอบอย่างเข้มงวด:
- **`innerHTML`**: **0 จุด** ในโค้ดทั้งหมดของโปรเจกต์
- **`outerHTML`**: **0 จุด** ในโค้ดทั้งหมดของโปรเจกต์
- **`insertAdjacentHTML`**: **0 จุด** ในโค้ดทั้งหมดของโปรเจกต์
- การสร้างและปรับแต่ง DOM ใช้มาตรฐาน:
  - `document.createElement(...)`
  - `element.textContent`
  - `element.appendChild(...)` / `element.replaceChildren(...)`
  - การกำหนด Attributes / CSS Classes / Styles โดยตรงผ่าน Properties

---

## 3. สรุปรายการไฟล์และฟังก์ชันที่เกี่ยวข้อง

| ลำดับ | ไฟล์ที่แก้ไข | ฟังก์ชัน / ส่วนประกอบที่เกี่ยวข้อง | รายละเอียดสรุป |
|:---:|:---|:---|:---|
| 1 | `views/customer/start.ejs` | `body.onclick`, Container link | รองรับการคลิกทุกตำแหน่งบนหน้าจอเพื่อเข้าเมนู |
| 2 | `views/customer/menu.ejs` | `renderMenuGrid()`, `nextMenuPage()`, `prevMenuPage()`, `renderCartTable()` | ภาพ 1:1, วนลูปหมวดหมู่ต่อเนื่อง, ตาราง Cart 8 แถวเต็มความสูง, เปลี่ยน innerText เป็น textContent |
| 3 | `views/chef/index.ejs` | `renderOrders()`, `renderHistory()`, Header template | ลบ Badge Auto Refresh, ตารางคิวและประวัติ 8 แถวเต็มความสูง, สถานะเป็น Plain text ไม่มีกล่อง |
| 4 | `views/customer/history.ejs` | `renderHistory()` | ตารางประวัติ 8 แถวเต็มความสูง, สถานะ Plain text ไม่มีกล่อง |
| 5 | `views/cashier/index.ejs` | `renderTables()`, `renderBill()`, `selectPayment()`, `syncToCustomerDisplay()` | ลบปุ่ม Nav ขวาบน, แสดง 10 โต๊ะต่อหน้า (2x5), ตาราง 8 แถวเต็มความสูง, ซิงค์วิธีชำระเงินไปจอแสดงผลลูกค้า |
| 6 | `views/cashier/customer-display.ejs` | `setQrVisibility()`, `renderCustomerBill()`, BroadcastChannel listener | ซ่อน QR เริ่มต้น, แสดง QR เฉพาะเมื่อเลือก "โอน (QR)", ซ่อนเมื่อเป็น "เงินสด", ตาราง 8 แถวเต็มความสูง |
| 7 | `routes/cashier.js` | `currentCashierState`, `POST /api/payment-method`, `GET /api/table-bill`, `POST /api/checkout` | จัดการและส่งคืนสถานะวิธีชำระเงินแบบ Real-time ข้ามหน้าจอ |
