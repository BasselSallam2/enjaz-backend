
# 🧾 Enjaz – Document Printing & Translation Platform (UAE)

**Enjaz** is a comprehensive Emirati platform for document printing and translation services, offering both a user-friendly mobile application and an advanced dashboard for internal operations.

Built with a real-time and scalable backend architecture, the system handles everything from authentication, live chat support, and online payments, to smart task distribution and performance tracking.

---

## 🔗 Postman API Collection

Explore all API endpoints here:  
📬 [Enjaz Postman Workspace](https://www.postman.com/enjaz7/workspace/enjazapp)

---

## 📱 Mobile Application Features

- 🔐 Login (email & Google)
- 🔑 OTP verification via email
- 🔔 Firebase Cloud Messaging for real-time notifications
- 📤 Upload documents for **printing** or **translation**
- ⏱ Track order status updates
- 💬 Live chat support via **Socket.IO** (Order-based chat + General support)
- 💳 Online payments via **EasyKash**
- 📁 Submit translated/printed files post-payment

---

## 🖥️ Dashboard Features

- 🔐 Role-based access (admin, employee, manager)
- 🟢 Online employee tracking
- 🎯 Random task assignment to available staff
- 📊 Track revenue & customer ratings
- ⚙️ Control system settings (e.g., payment terms, languages, services)
- 📥 Download order files, manage users, monitor live chat

---

## 🧰 Backend Tech Stack

| Feature             | Technology           |
|---------------------|----------------------|
| Server              | Node.js + Express    |
| ORM & DB            | Prisma + MySQL       |
| Auth                | JWT + Bcrypt + OTP   |
| Uploads             | Multer               |
| Realtime Messaging  | Socket.IO            |
| Validation          | Zod                  |
| Notifications       | Firebase FCM         |
| Payments            | EasyKash API         |
| API Documentation   | Postman Collection   |
| Deployment          | Hostinger VPS via SSH |



---
## 🖼️ Screenshots

### Employees  
![Employees](https://raw.githubusercontent.com/BasselSallam2/enjaz-backend/main/screenshots/Employees.png)

### Home  
![Home](https://raw.githubusercontent.com/BasselSallam2/enjaz-backend/main/screenshots/Home.png)

### Login  
![Login](https://raw.githubusercontent.com/BasselSallam2/enjaz-backend/main/screenshots/Login.jpg)

### OTP Verification  
![OTP](https://raw.githubusercontent.com/BasselSallam2/enjaz-backend/main/screenshots/OTP.jpg)

### Address Input  
![Address](https://raw.githubusercontent.com/BasselSallam2/enjaz-backend/main/screenshots/address.jpg)

### App Home  
![App Home](https://raw.githubusercontent.com/BasselSallam2/enjaz-backend/main/screenshots/app_home.jpg)

### Chat Interface  
![Chat](https://raw.githubusercontent.com/BasselSallam2/enjaz-backend/main/screenshots/chat.png)

### Customer View  
![Customer](https://raw.githubusercontent.com/BasselSallam2/enjaz-backend/main/screenshots/coustmer.png)

### Orders List  
![Orders](https://raw.githubusercontent.com/BasselSallam2/enjaz-backend/main/screenshots/orders.png)

### Payment Page  
![Payment](https://raw.githubusercontent.com/BasselSallam2/enjaz-backend/main/screenshots/payment.jpg)

### Services Page  
![Services](https://raw.githubusercontent.com/BasselSallam2/enjaz-backend/main/screenshots/services.png)

### Terms & Conditions  
![Terms](https://raw.githubusercontent.com/BasselSallam2/enjaz-backend/main/screenshots/terms.png)

### Translation Orders  
![Translation Orders](https://raw.githubusercontent.com/BasselSallam2/enjaz-backend/main/screenshots/translation_orders.jpg)



---

## 🚀 Getting Started

bash
git clone https://github.com/BasselSallam2/enjaz-backend.git
cd enjaz-backend
npm install
cp .env.example .env
npx prisma generate
npm run dev

👨‍💻 Backend Developer
Developed by Bassel Sallam
💼 LinkedIn : https://www.linkedin.com/in/basselsallam
