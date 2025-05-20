import { Server } from "socket.io";
import axios from "axios";
import qs from "querystring";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
import { onlineEmployees, getRandomEmployeeEntry } from "../onlineEmployees.js";
import { sendNotification } from "../util/services/ordersNotification.js";
import { setSocketInstance } from "./socketInstance.js";

const SOCKETID = 0;
const EMPID = 1;

function isSocketConnected(io, socketId) {
  return io.sockets.sockets.has(socketId);
}

export function initializeSocket(server) {
  console.log("🟢 Initializing WebSocket Server...");

  const io = new Server(server, {
    cors: {
      origin: "*", // ✅ Allow all origins (Change in production)
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"], // ✅ Use WebSocket + Polling fallback
  });

  setSocketInstance(io);

  io.on("connection", (socket) => {
    try {
    console.log("✅ Flutter connected:", socket.id);
    // io.to(socket.id).emit("testResponse", {
    //   message: "Hello Flutter directly!"
    // });
    socket.on("employeeEnter", async (employeeId) => {
      try {

        onlineEmployees.set(socket.id, employeeId);
        console.log(onlineEmployees);
        
        const unsupportchat = await prisma.supportChat.findMany({
          where: { isread: false, lockedId: null },
        });
        
        const allUnEmployeeChats = await prisma.supportChat.updateMany({
          where: { isread: false, lockedId: null },
          data: {
            lockedId: employeeId,
            SocketIdEmployee: socket.id,
          },
        });
        
        const unorderchat = await prisma.orderChat.findMany({
          where: { isread: false, lockedId: null },
        });
        
        const allUnEmployeeChats2 = await prisma.orderChat.updateMany({
          where: { isread: false, lockedId: null },
          data: {
            lockedId: employeeId,
            SocketIdEmployee: socket.id,
          },
        });
        
        const unOrders = await prisma.orders.findMany({
          where: { employeeId: null },
        });
        
        const allunemployeeOrders = await prisma.orders.updateMany({
          where: { employeeId: null },
          data: { employeeId: employeeId },
        });
      }catch(error) {
        console.log(error) ;
      }
      });
      
      // (async () => {
        //   for(let order of unOrders) {
          //     await prisma.employeeNotification.create({
            //       data: {
              //         employeeId: employeeId,
              //         type: "New Order",
              //         serviceId: order.id,
    //         title: "New old Order",
    //         body: "New old Order"
    //       }
    //     });
    //   }
    // })

    // (async () => {
    //   for (const unchat of unsupportchat) {
    //     await prisma.employeeNotification.create({
    //       data: {
    //         employeeId: employeeId,
    //         type: "Support Message",
    //         serviceId: unchat.id,
    //         title: "New Unread Support Chat",
    //         body: "New message"
    //       }
    //     });
    //   }
    // })();

    // (async () => {
    //   for (const unchat of unorderchat) {
    //     await prisma.employeeNotification.create({
    //       data: {
    //         employeeId: employeeId,
    //         type: "Order Message",
    //         serviceId: unchat.id,
    //         title: "New Unread Support Chat",
    //         body: "New message"
    //       }
    //     });
    //   }
    // })();

    socket.on("SupportCoustmerMessage", async (data) => {
      try{

        let message = data.message;
        let userId = data.userId;

        const user = await prisma.user.findUnique({where:{id:userId}}) ;
        let chat = await prisma.supportChat.findUnique({
        where: { userid: userId }, include:{SupportMessages:{orderBy:{createdAt:"desc"}}}
      });
      let employee = getRandomEmployeeEntry(onlineEmployees);
      if (!chat) {
        chat = await prisma.supportChat.create({
          data: {
            userid: userId,
            lockedId: employee ? employee[EMPID] : null,
            socketIdUser: socket.id,
            SocketIdEmployee: employee ? employee[SOCKETID] : null,
          },
        });
      } else if (!chat.lockedId) {
        chat = await prisma.supportChat.update({
          where: { id: chat.id },
          data: {
            lockedId: employee ? employee[EMPID] : null,
            socketIdUser: socket.id,
            SocketIdEmployee: employee ? employee[SOCKETID] : null,
          },
        });
      }
      const sendmessage = await prisma.supportMessages.create({
        data: {
          message: message,
          sender: "client",
          senderId: userId,
          chatid: chat.id,
        },
      });
      if (employee) {
        io.to(employee[SOCKETID]).emit("NewClientSupportMessage", {
          message,
          chatId: chat.id,
          senderId: userId,
          clientemail: user.email ,
          lastmessage: chat.SupportMessages[0].message ,
          lastmessagetime: chat.SupportMessages[0].createdAt ,
        });

        io.to(employee[SOCKETID]).emit("NewEmployeeNotification", {
          employeeId: chat.lockedId,
          type: "Support Message",
          serviceId: chat.id,
          title: "NewClient Support Message",
          body: message,
          isRead: false,
          date: new Date().toISOString(),
        });
      }

      if (chat.lockedId) {
        await prisma.employeeNotification.create({
          data: {
            employeeId: chat.lockedId,
            type: "Support Message",
            serviceId: chat.id,
            title: "New Client Support Message",
            body: message,
          },
        });
      }
    }catch(error){
      console.log(error) ;
    }
    });

    socket.on("OrderCoustmerMessage", async (data) => {
      try{

        let message = data.message;
        let userId = data.userId;
        const user = await prisma.user.findUnique({where:{id:userId}}) ;
        let chat = await prisma.orderChat.findUnique({
        where: { userid: userId }, include:{OrderMessages:{orderBy:{createdAt:"desc"}}}
      });
      let employee = getRandomEmployeeEntry(onlineEmployees);
      if (!chat) {
        chat = await prisma.orderChat.create({
          data: {
            userid: userId,
            lockedId: employee ? employee[EMPID] : null,
            socketIdUser: socket.id,
            SocketIdEmployee: employee ? employee[SOCKETID] : null,
          },
        });
      } else if (!chat.lockedId) {
        chat = await prisma.orderChat.update({
          where: { id: chat.id },
          data: {
            lockedId: employee ? employee[EMPID] : null,
            socketIdUser: socket.id,
            SocketIdEmployee: employee ? employee[SOCKETID] : null,
          },
        });
      }
      await prisma.orderChat.update({
        where: { id: chat.id },
        data: { socketIdUser: socket.id },
      });
      const sendmessage = await prisma.orderMessages.create({
        data: {
          message: message,
          sender: "client",
          senderId: userId,
          chatid: chat.id,
        },
      });
      if (employee) {
        io.to(employee[SOCKETID]).emit("NewClientOrderMessage", {
          message,
          chatId: chat.id,
          senderId: userId,
          clientemail: user.email ,
          lastmessage: chat.OrderMessages[0].message ,
          lastmessagetime: chat.OrderMessages[0].createdAt ,
        });

        io.to(employee[SOCKETID]).emit("NewEmployeeNotification", {
          employeeId: chat.lockedId,
          type: "Order Message",
          serviceId: chat.id,
          title: "New Client Order Message",
          body: message,
          isRead: false,
          date: new Date().toISOString(),
        });
      }

      if (chat.lockedId) {
        await prisma.employeeNotification.create({
          data: {
            employeeId: chat.lockedId,
            type: "Order Message",
            serviceId: chat.id,
            title: "New Client Order Message",
            body: message,
          },
        });
      }
    }catch(error) {
      console.log(error) ;
    }
    });

    socket.on("SupportEmployeeMessage", async (data) => {
      try{
        let chatId = data.chatId ;
        let message = data.message ;
        const empId = onlineEmployees.get(socket.id);
        const answer = await prisma.supportMessages.create({
        data: {
          message: message,
          sender: "employee",
          chatid: chatId,
          senderId: empId,
        },
      });
      const chat = await prisma.supportChat.findUnique({
        where: { id: chatId },
      });
      if (chat) {
        io.to(chat.socketIdUser).emit("NewEmployeeSupportMessage", {
          message: message,
          chatId: chatId,
        });

        const isUserConnected = isSocketConnected(io, chat.socketIdUser);

        const user = await prisma.user.findUnique({
          where: { id: chat.userid },
          select: { mobileToken: true },
        });
        if (user.mobileToken !== null && isUserConnected === false) {
          sendNotification(
            user.mobileToken,
            "You have new Support Message",
            `${message}`
          );
          const notification = await prisma.coustmerNotification.create({
            data: {
              userid: chat.userid,
              title: "You have new Support Message",
              body: `${message}`,
              type: "Support Message",
            },
          });
        }
      }
    }catch(error) {
      console.log(error) ;
    }
    });

    socket.on("OrderEmployeeMessage", async (data) => {
      try{
        console.log(data) ;
        let message = data.message ;
        let chatId = data.chatId ; 
        const empId = onlineEmployees.get(socket.id);
        const answer = await prisma.orderMessages.create({
        data: {
          message: message,
          sender: "employee",
          chatid: chatId,
          senderId: empId,
        },
      });
      const chat = await prisma.orderChat.findUnique({ where: { id: chatId } });
      if (chat) {
        io.to(chat.socketIdUser).emit("NewEmployeeOrderMessage", {
          message: message,
          chatId: chatId,
        });

        const isUserConnected = isSocketConnected(io, chat.socketIdUser);

        const user = await prisma.user.findUnique({
          where: { id: chat.userid },
          select: { mobileToken: true },
        });
        if (user.mobileToken !== null && isUserConnected === false) {
          sendNotification(
            user.mobileToken,
            "You have new Order Message",
            `${message}`
          );
          const notification = await prisma.coustmerNotification.create({
            data: {
              userid: chat.userid,
              title: "You have new Order Message",
              body: `${message}`,
              type: "Order Message",
            },
          });
        }
      }
    }catch(error) {
      console.log(error) ;
    }
    });

    socket.on("disconnect", async () => {
      try{

        if (onlineEmployees.has(socket.id)) {
          const empId = onlineEmployees.get(socket.id);
          onlineEmployees.delete(socket.id);
        await prisma.supportChat.updateMany({
          where: { SocketIdEmployee: socket.id },
          data: { lockedId: null, SocketIdEmployee: null },
        });

        await prisma.orderChat.updateMany({
          where: { SocketIdEmployee: socket.id },
          data: { lockedId: null, SocketIdEmployee: null },
        });
      }
    }catch(error){
      console.log(error);
    }
    });

    socket.on("SupportChatRead", async (chatId) => {
      try{

        const chat = await prisma.supportChat.findUnique({
          where: { id: chatId },
        });
      if (chat) {
        await prisma.supportChat.update({
          where: { id: chat.id },
          data: { isread: true },
        });
      }
    }catch(error){
      console.log(error);
    }
    });

    socket.on("OrderChatRead", async (chatId) => {
      try{

        const chat = await prisma.orderChat.findUnique({
          where: { id: chatId },
        });
        if (chat) {
        await prisma.orderChat.update({
          where: { id: chat.id },
          data: { isread: true },
        });
      }
    }catch(error){
      console.log(error);
    }
    });

    socket.on("SupportChatEnd", async (chatId) => {
      try{

        const chat = await prisma.supportChat.findUnique({
          where: { id: chatId },
        });
        if (chat) {
          await prisma.supportChat.update({
            where: { id: chat.id },
            data: { isread: true, lockedId: null, SocketIdEmployee: null },
          });
        }
      }catch(error){
        console.log(error);
      }
    });

    socket.on("OrderChatEnd", async (chatId) => {
      try{

        const chat = await prisma.orderChat.findUnique({
          where: { id: chatId },
        });
      if (chat) {
        await prisma.orderChat.update({
          where: { id: chat.id },
          data: { isread: true, lockedId: null, SocketIdEmployee: null },
        });
      }
    }catch(error){
      console.log(error) ;
    }
    });

    // socket.on("testEvent", (data) => {
    //   console.log("Received testEvent with data:", data);
    //   socket.emit("testResponse", { message: "Test event received successfully!" });
    // });

    return io;
}catch(error) {
  console.log(error) ;
}
  });
}
