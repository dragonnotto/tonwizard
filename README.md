# 🧮 คิดเลขเร็ว (Fast Math Game)

แอปพลิเคชันเว็บสำหรับฝึก **คิดเลขเร็ว** (บวก ลบ คูณ หาร) เหมาะกับการใช้ในห้องเรียน
สร้างด้วย **HTML + CSS + Vanilla JavaScript** ล้วน ไม่ต้องติดตั้งอะไรเพิ่ม

เปิดไฟล์ `index.html` ในเบราว์เซอร์ได้ทันที

---

## ✨ ฟีเจอร์

- **ฟอร์มข้อมูลผู้เล่น** กรอก *ชื่อ-สกุล* และ *ชั้นเรียน* ก่อนเริ่มจับเวลา
- **ระบบสุ่มโจทย์** บวก / ลบ / คูณ / หาร โดย **คำตอบเป็นจำนวนเต็มเสมอ** (ไม่มีเศษ/ทศนิยม และผลลบไม่ติดลบ)
- **3 ระดับความยาก**
  - ง่าย (Easy): ตัวเลข 1 หลัก (1–9)
  - ปานกลาง (Medium): ตัวเลข 2 หลัก (10–99)
  - ยาก (Hard): ตัวเลข 3 หลัก (100–999) และคูณ/หารซับซ้อนขึ้น
- **เลือกประเภทโจทย์ได้** (เปิด/ปิด บวก ลบ คูณ หาร) และ **เลือกเวลาต่อรอบ** (30/60/90/120 วินาที)
- **ระบบจับเวลาถอยหลัง** พร้อมแถบเวลากราฟิก และเตือนสีแดงเมื่อเหลือ 10 วินาทีสุดท้าย
- **ระบบคะแนน** ตอบถูก +1 (ตอบผิดไม่หักคะแนน แต่รีเซ็ตสตรีค) นับ "ตอบถูกติดต่อกัน"
- **Feedback ชัดเจน** เปลี่ยนสี/แอนิเมชัน + เสียงเอฟเฟกต์ (สร้างจาก Web Audio API ไม่ต้องโหลดไฟล์)
- **หน้าสรุปผล** แสดงคะแนน ความแม่นยำ และสตรีคสูงสุด
- **ตารางสถิติคะแนนสูงสุด** เก็บใน `localStorage` ของเครื่อง (10 อันดับ)

---

## 📁 โครงสร้างไฟล์

```
index.html   โครงหน้าเว็บ 3 หน้าจอ (เริ่ม / เล่น / สรุปผล)
style.css    สไตล์ทั้งหมด เน้นตัวใหญ่ อ่านง่าย สีสันสดใส
script.js    ตรรกะเกมทั้งหมด (คอมเมนต์ภาษาไทย)
```

---

## 🔑 อธิบายส่วนสำคัญของโค้ด

### 1) ฟังก์ชันสุ่มโจทย์ — `generateProblem()`
หัวใจคือการรับประกันว่า **คำตอบเป็นจำนวนเต็มเสมอ**:

- **บวก / คูณ** — สุ่มตัวเลขสองตัวได้ตรง ๆ
- **ลบ** — ถ้าตัวลบมากกว่าตัวตั้ง จะสลับกัน (`[a, b] = [b, a]`) เพื่อให้ผลลัพธ์ไม่ติดลบ
- **หาร** — เทคนิคสำคัญคือ **สุ่มผลหารและตัวหารก่อน** แล้วคูณกลับเป็นตัวตั้ง
  (`ตัวตั้ง = ผลหาร × ตัวหาร`) จึงหารลงตัวเป็นจำนวนเต็มแน่นอน

ช่วงตัวเลขของแต่ละระดับกำหนดในตาราง `RANGES`

### 2) ระบบจับเวลา — `startTimer()`
ใช้ `setInterval` ลดค่า `timeLeft` ทีละ 1 วินาที แต่ละครั้งจะ:
- อัปเดตตัวเลขเวลาและความกว้างของแถบเวลา (สัดส่วน `timeLeft / duration`)
- เมื่อเหลือ ≤ 10 วินาที เพิ่มคลาส `low` เพื่อเปลี่ยนเป็นสีแดง + กะพริบ
- เมื่อ `timeLeft` ถึง 0 เรียก `endGame()` เพื่อสรุปคะแนนทันที (และ `clearInterval`)

---

## 🌐 (Optional) เชื่อมต่อฐานข้อมูลเพื่อเก็บคะแนนรวมศูนย์

ปัจจุบันคะแนนเก็บใน `localStorage` (ต่อเครื่อง) หากต้องใช้ใน **การแข่งขัน/เก็บสถิติรวม**
ให้แก้ฟังก์ชัน `saveScore()` ใน `script.js` ให้ส่งข้อมูลออกไปยังเซิร์ฟเวอร์

### ตัวอย่าง A — Google Apps Script (GAS)
ฝั่ง JavaScript:
```js
fetch("https://script.google.com/macros/s/XXXX/exec", {
  method: "POST",
  body: JSON.stringify({
    name: state.player.name, cls: state.player.cls,
    score: state.score, difficulty: state.difficulty,
  }),
});
```
ฝั่ง GAS (ผูกกับ Google Sheet):
```js
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.appendRow([new Date(), data.name, data.cls, data.score, data.difficulty]);
  return ContentService.createTextOutput("OK");
}
```

### ตัวอย่าง B — PHP + MySQL
```php
<?php // save_score.php
$data = json_decode(file_get_contents("php://input"), true);
$pdo = new PDO("mysql:host=localhost;dbname=mathgame;charset=utf8mb4", "user", "pass");
$stmt = $pdo->prepare(
  "INSERT INTO scores (name, class, score, difficulty, created_at)
   VALUES (?, ?, ?, ?, NOW())"
);
$stmt->execute([$data["name"], $data["cls"], $data["score"], $data["difficulty"]]);
echo json_encode(["ok" => true]);
```
```sql
CREATE TABLE scores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(60), class VARCHAR(20),
  score INT, difficulty VARCHAR(10),
  created_at DATETIME
);
```

> 💡 อย่าลืมตั้งค่า CORS / ตรวจสอบข้อมูลฝั่งเซิร์ฟเวอร์เพื่อความปลอดภัย

---

## 🚀 วิธีใช้งาน
1. ดับเบิลคลิกเปิด `index.html`
2. กรอกชื่อ-ชั้นเรียน เลือกระดับความยาก/ประเภทโจทย์/เวลา
3. กด **เริ่มเล่น** แล้วพิมพ์คำตอบ กด Enter ได้เลย
4. หมดเวลา → ดูสรุปผลและสถิติคะแนนสูงสุด
