import express from "express";
import pkg from "express-openid-connect";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
dotenv.config();
const prisma = new PrismaClient();
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import http from "http";
import { initializeSocket } from "./socket/socket.js";
import schedule from "node-schedule";
import bcrypt from "bcryptjs";

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);

initializeSocket(server);

app.use(cors());
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import AuthRouter from "./Routes/AuthRouter.js";
import ErrorHandler from "./middleware/ErrorHandler.js";
import OrdersRouter from "./Routes/OrdersRouter.js";
import AddressRouter from "./Routes/AddressRouter.js";
import LanguageRouter from "./Routes/langugeRouter.js";
import UserRouter from "./Routes/UserRouter.js";
import ConditionsRouter from "./dashboard/Routes/termsRouter.js";
import DashboardAuthRouter from "./dashboard/Routes/AuthRouter.js";
import clinetsRouter from "./dashboard/Routes/clientsRouter.js";
import HomeRouter from "./dashboard/Routes/mainMenuRouter.js"
import OrdersRouterDashboard from "./dashboard/Routes/OrdersRouter.js";
import EmployeesRouter from "./dashboard/Routes/EmployessRouter.js";
import costsRouter from "./dashboard/Routes/costsRouter.js";
import ClientSupportChatsRouter from "./Routes/ChatsRouter.js"
import EmployeeSupportChatRouter from "./dashboard/Routes/DashChatsRouter.js"
import coustmerNotifications from "./Routes/costumerNotificationRouter.js"
import EmployeeNotifications from "./dashboard/Routes/EmployeeNotificationRouter.js"



// (async () => {
//   await prisma.languge.createMany({
//     data: [
//       { name: "Arabic", Arabicname: "العربية", cost: 50 },
//       { name: "English", Arabicname: "الإنجليزية", cost: 50 },
//       { name: "French", Arabicname: "الفرنسية", cost: 50 },
//       { name: "Spanish", Arabicname: "الإسبانية", cost: 50 },
//       { name: "German", Arabicname: "الألمانية", cost: 50 },
//       { name: "Italian", Arabicname: "الإيطالية", cost: 50 },
//       { name: "Chinese", Arabicname: "الصينية", cost: 50 },
//       { name: "Japanese", Arabicname: "اليابانية", cost: 50 },
//       { name: "Korean", Arabicname: "الكورية", cost: 50 },
//       { name: "Russian", Arabicname: "الروسية", cost: 50 },
//       { name: "Hindi", Arabicname: "الهندية", cost: 50 },
//       { name: "Turkish", Arabicname: "التركية", cost: 50 },
//       { name: "Urdu", Arabicname: "الأردية", cost: 50 },
//       { name: "Portuguese", Arabicname: "البرتغالية", cost: 50 },
//       { name: "Dutch", Arabicname: "الهولندية", cost: 50 },
//       { name: "Swedish", Arabicname: "السويدية", cost: 50 }
//     ],
   
//   });

//   console.log("✅ Languages seeded.");
//   await prisma.$disconnect();
// })();

// (async () => {
//   await prisma.officeAddress.create({data:{
//     address:"الدمام الدوحة"
//   }})
// })() ;

// (async () => {
//   await prisma.printingCollors.createMany({data:[
//     {color:"White and Black" , ArabicColor:"ابيض و اسود" , cost:300} ,
//     {color:"Colors" , ArabicColor:"الوان" , cost:900}
//   ]})
// })() ;

// (async () => {
//   await prisma.printingCovers.create({data:{
//     name:"cubed" , arabicname:"مكعب" , cost:30
//   }})
// })() ;


// (async () => {
//   await prisma.terms.create({
//     data: {
//       EnglishPrivacy: "This is the English privacy policy.",
//       ArabicPrivacy: "هذه هي سياسة الخصوصية باللغة العربية.",
//       EnglishTerms: "These are the English terms and conditions.",
//       ArabicTerms: "هذه هي الشروط والأحكام باللغة العربية.",
//       EnglishUsage: "These are the English usage rules.",
//       ArabicUsage: "هذه هي قواعد الاستخدام باللغة العربية."
//     }
//   });

//   console.log("✅ Terms seeded.");
//   await prisma.$disconnect();
// })();





(async () => {

  // Schedule a job to run at the end of each month
  schedule.scheduleJob("59 23 28-31 * *", async () => {
    const now = new Date();
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    if (now.getDate() === lastDayOfMonth || 1) {
      try {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const orders = await prisma.orders.findMany({
          where: {
            createdAt: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          select:{paid:true}
        });
        let margin = 0 ;
        margin = orders.reduce((acc, order) => acc + order.paid, 0);
        const monthName = now.toLocaleString('default', { month: 'long' });
        await prisma.margin.create({ data: { month: monthName, revenue: margin } });
      } catch (error) {
        console.error("Error executing end of month task:", error);
      }
    }
  });
})();




app.use("/api", AuthRouter);
app.use("/api", OrdersRouter);
app.use("/api", AddressRouter);
app.use("/api", LanguageRouter);
app.use("/api", UserRouter);
app.use("/api" , ClientSupportChatsRouter);
app.use("/api" , coustmerNotifications) ;
app.use("/api/dashboard", EmployeesRouter);
app.use("/api/dashboard", costsRouter);
app.use("/api/dashboard" , EmployeeSupportChatRouter) ;
app.use("/api/dashboard" ,ConditionsRouter ) ;
app.use("/api/dashboard" ,DashboardAuthRouter ) ;
app.use("/api/dashboard" , clinetsRouter) ;
app.use("/api/dashboard" ,HomeRouter ) ;
app.use("/api/dashboard" ,OrdersRouterDashboard ) ;
app.use("/api/dashboard" , EmployeeNotifications);

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

app.use("/", (req, res, next) => {
  res.status(404).send("Page not found");
});

app.use(ErrorHandler);




server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
