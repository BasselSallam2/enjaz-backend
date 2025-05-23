import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { z } from "zod";
import bcrypt from "bcryptjs";
dotenv.config();
import express from "express";
import sgMail from "@sendgrid/mail";
import {
  orderMapper,
  orderDetailsMapper,
} from "../util/mappers/orderMapper.js";

import { onlineEmployees, getRandomEmployeeEntry } from "../onlineEmployees.js";

import { getSocketInstance } from "../socket/socketInstance.js";
import { title } from "process";

const EMPID = 1;
const SOCKETID = 0;

export const newTranslationOrder = async (req, res, next) => {
  try {
    let { fileLanguge, translationLanguges, methodOfDelivery, notes, Address } =
      req.body;
    const files = req.files;
    let filename;
    const { userId } = req.user;
    console.log(req.body);
    console.log("hh", files);

    if (!fileLanguge || !translationLanguges || !methodOfDelivery || !files) {
      return res.status(400).json({
        message: "All inputs are required",
      });
    }
    if (typeof translationLanguges === "string") {
      translationLanguges = JSON.parse(translationLanguges);
    }

    if (methodOfDelivery !== "Home" && methodOfDelivery !== "Office") {
      return res.status(400).json({
        message: "Method of delivery must be 'Home' or 'Office'",
      });
    }

    if (methodOfDelivery == "Home" && !Address) {
      return res.status(400).json({
        message: "AddressId is required when methodOfDelivery is 'Home'",
      });
    }

    filename = files.otherDocs.map((file) => {
      return file.filename;
    });

    const languges = await prisma.languge.findMany({ select: { name: true } });
    const languageNames = languges.map((lang) => lang.name);

    if (!languageNames.includes(fileLanguge)) {
      console.log(languageNames);
      return res.status(400).json({
        message: "The file language is not supported",
        supportedlanguge: languageNames,
      });
    }

    if (!translationLanguges.every((lang) => languageNames.includes(lang))) {
      return res.status(400).json({
        message: "The translation language is not supported",
        supportedlanguge: languageNames,
      });
    }

    const employee = getRandomEmployeeEntry(onlineEmployees);

    const newOrder = await prisma.orders.create({
      data: {
        userid: userId,
        type: "translation",
        delivery: methodOfDelivery,
        paymentStatus: "no payment",
        status: "Under Review",
        files: filename,
        address: Address || null,
        notes: notes,
        translationfrom: fileLanguge,
        translationto: translationLanguges,
        employeeId: employee ? employee[EMPID] : null,
      },
    });

    if (employee) {
      await prisma.employeeNotification.create({
        data: {
          employeeId: employee[EMPID],
          type: "Translation Order",
          serviceId: newOrder.number.toString(),
          title: "New Translation Order",
          body: `Order number ${newOrder.number}`,
        },
      });
    }

    const io = getSocketInstance();
    if (io && employee) {
      io.to(employee[SOCKETID]).emit("NewEmployeeNotification", {
        employeeId: employee[EMPID],
        type: "Translation Order",
        serviceId: newOrder.number.toString(),
        title: "New Translation Order",
        body: `Order number ${newOrder.number}`,
        date: new Date().toISOString()
      });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { ordersCounter: { increment: 1 }, lastOrder: new Date() },
    });


    let userchat = await prisma.orderChat.findUnique({where:{userid:userId}}) ;
    if(!userchat) {
      userchat = await prisma.orderChat.create({data:{userid:userId}}) ;
    }

    const newmessage = await prisma.orderMessages.create({data:{message:`تم تقديم طلبك و جاري مراجعه ب رقم ${newOrder.number}` , chatid:userchat.id , sender:"employee"}}) ;
    

    res.status(201).json({
      message: "Order uploaded successfully!",
      ordernumber: newOrder.number
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const myorders = async (req, res, next) => {
  try {
    let { userId } = req.user;
    let { type, status } = req.query;

    let allowedtype = ["translation", "printing"];

    let allowedstatus = ["new", "current", "finished", "cancelled"];
    // status = [ Under Review , Offer Sent ,  In Progress , In delivery , Finished ,Cancelled  ]

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    if (!type || !status) {
      return res.status(400).json({
        message: "Type and status are required",
      });
    }
    if (!allowedtype.includes(type)) {
      return res.status(400).json({
        message: "Type is not supported",
        supportedTypes: allowedtype,
      });
    }
    if (!allowedstatus.includes(status)) {
      return res.status(400).json({
        message: "Status is not supported",
        supportedstatus: allowedstatus,
      });
    }

    let fillter;

    if (status == "new") {
      fillter = {
        userid: userId,
        type: type,
        status: {
          in: ["Under Review", "Offer Sent"],
        },
      };
    } else if (status == "current") {
      fillter = {
        userid: userId,
        type: type,
        status: {
          in: ["In Progress", "In delivery"],
        },
      };
    } else if (status == "finished") {
      fillter = {
        userid: userId,
        type: type,
        status: {
          in: ["Finished"],
        },
      };
    } else if (status == "cancelled") {
      fillter = {
        userid: userId,
        type: type,
        status: {
          in: ["Cancelled"],
        },
      };
    }

    const orders = await prisma.orders.findMany({
      where: fillter,
      select: {
        status: true,
        number: true,
        createdAt: true,
        delivery: true,
        translationfrom: true,
        files: true,
        type: true,
        PrintingDetails: true,
      },
    });
    if (!orders) {
      return res.status(404).json({
        message: "No orders found",
      });
    }

    res.status(200).json(orderMapper(orders));
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const orderDetails = async (req, res, next) => {
  try {
    let { orderId } = req.params;
    orderId = parseInt(orderId);
    const { userId } = req.user;
    if (!orderId) {
      return res.status(400).json({
        message: "Order ID is required",
      });
    }

    const order = await prisma.orders.findUnique({
      where: { number: orderId, userid: userId },
      include: { PrintingDetails: true },
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    const orderDetails = await orderDetailsMapper(order);

    res.status(200).json(orderDetails);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const cancellOrder = async (req, res, next) => {
  try {
    let { orderId } = req.params;
    if (!orderId) {
      return res.status(400).json({
        message: "Order ID is required",
      });
    }
    orderId = parseInt(orderId);
    const { userId } = req.user;
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({
        message: "Reason is required",
      });
    }
    const order = await prisma.orders.findUnique({
      where: { number: orderId, userid: userId },
    });
    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }
    await prisma.orders.update({
      where: { number: orderId, userid: userId },
      data: { status: "Cancelled", cancelationreason: reason },
    });
    res.status(200).json({
      message: "Order cancelled successfully",
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const rateOrder = async (req, res, next) => {
  try {
    let { orderId } = req.params;
    const { userId } = req.user;
    let { stars, comment } = req.body;

    if (!orderId) {
      return res.status(400).json({
        message: "Order ID is required",
      });
    }
    orderId = parseInt(orderId);

    if (!stars) {
      return res.status(400).json({
        message: "Stars are required",
      });
    }

    stars = parseInt(stars);

    if (stars < 1 || stars > 5) {
      return res.status(400).json({
        message: "Stars must be between 1 and 5",
      });
    }
    const order = await prisma.orders.findUnique({
      where: { number: orderId, userid: userId },
    });
    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }
    if (order.rate) {
      return res.status(400).json({
        message: "Order is already rated",
      });
    }

    await prisma.orders.update({
      where: { number: orderId, userid: userId },
      data: { rate: stars, comment: comment },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { rateAvg: true, rateCounter: true },
    });
    const rateAVG = user.rateAvg;
    const rateCounter = user.rateCounter;
    if (rateCounter == 0) {
      await prisma.user.update({
        where: { id: userId },
        data: { rateAvg: stars, rateCounter: 1 },
      });
    } else {
      const newRate = (rateAVG * rateCounter + stars) / (rateCounter + 1);
      await prisma.user.update({
        where: { id: userId },
        data: { rateAvg: newRate, rateCounter: { increment: 1 } },
      });
    }

    res.status(200).json({
      message: "Order is rated successfully",
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const newPrentingOrder = async (req, res, next) => {
  try {
    const body = req.body;
    const bodyDetails = JSON.parse(body.details);
    const { methodOfDelivery, Address, notes } = body;
    const files = req.files;
    let filename;
    const { userId } = req.user;
    let cost = 0;

    if (!body || !files || !methodOfDelivery) {
      return res.status(400).json({
        message: "All inputs are required",
      });
    }

    if (methodOfDelivery !== "Home" && methodOfDelivery !== "Office") {
      return res.status(400).json({
        message: "Method of delivery must be 'Home' or 'Office'",
      });
    }

    if (methodOfDelivery == "Home" && !Address) {
      return res.status(400).json({
        message: "AddressId is required when methodOfDelivery is 'Home'",
      });
    }

    filename = files.otherDocs.map((file) => {
      return file.filename;
    });

    const employee = getRandomEmployeeEntry(onlineEmployees);

    const newOrder = await prisma.orders.create({
      data: {
        userid: userId,
        type: "printing",
        delivery: methodOfDelivery,
        paymentStatus: "no payment",
        status: "Under Review",
        address: Address || null,
        notes: notes || null,
        employeeId: employee ? employee[EMPID] : null,
      },
    });

    const colors = await prisma.printingCollors.findMany({
      select: { color: true, cost: true },
    });
    const colorNames = colors.map((color) => color.color);
    const covers = await prisma.printingCovers.findMany({
      select: { name: true, cost: true },
    });
    const coverNames = covers.map((cover) => cover.name);

    for (let i = 0; i < bodyDetails.length; i++) {
      if (
        !bodyDetails[i].color ||
        !bodyDetails[i].cover ||
        !bodyDetails[i].copies
      ) {
        return res.status(400).json({
          message: "All inputs are required",
        });
      }
      if (!colorNames.includes(bodyDetails[i].color)) {
        return res.status(400).json({
          message: "Color is not supported",
          supportedcolors: colorNames,
        });
      }
      if (!coverNames.includes(bodyDetails[i].cover)) {
        return res.status(400).json({
          message: "Cover is not supported",
          supportedcovers: coverNames,
        });
      }
      if (bodyDetails[i].copies < 1) {
        return res.status(400).json({
          message: "Copies must be greater than 0",
        });
      }
      // if (bodyDetails[i].pages < 1) {
      //   return res.status(400).json({
      //     message: "Pages must be greater than 0",
      //   });
      // }

      if (!filename[i]) {
        return res.status(400).json({
          message: "File is required",
        });
      }

      await prisma.printingDetails.create({
        data: {
          orderId: newOrder.number,
          file: filename[i],
          color: bodyDetails[i].color,
          cover: bodyDetails[i].cover,
          copies: bodyDetails[i].copies,
        },
      });

      // cost =
      //   cost +
      //   bodyDetails[i].copies *
      //     bodyDetails[i].pages *
      //     colors.find((color) => color.color == bodyDetails[i].color).cost +
      //   covers.find((cover) => cover.name == bodyDetails[i].cover).cost;
      // await prisma.orders.update({
      //   where: { number: newOrder.number },
      //   data: { cost: cost },
      // });
    }

    
    let userchat = await prisma.orderChat.findUnique({where:{userid:userId}}) ;
    if(!userchat) {
      userchat = await prisma.orderChat.create({data:{userid:userId}}) ;
    }

    const newmessage = await prisma.orderMessages.create({data:{message:`تم تقديم طلبك و جاري مراجعه ب رقم ${newOrder.number}` , chatid:userchat.id , sender:"employee"}}) ;
    

    res.status(201).json({
      message: "Order uploaded successfully!",
      ordernumber: newOrder.number
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
