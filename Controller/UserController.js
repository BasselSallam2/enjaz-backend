import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { z } from "zod";
import bcrypt from "bcryptjs";
dotenv.config();
import express from "express";
import SibApiV3Sdk from "sib-api-v3-sdk";

export const getUserName = async (req, res, next) => {
  try {
    const { userId } = req.user;
 
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({
      firstname: user.name.split(" ")[0],
      lastname: user.name.split(" ")[1],
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const changephone = async (req, res, next) => {
  try {
    const { userId } = req.user;

  

    const { phone, countrycode } = req.body;

    if (!phone || !countrycode) {
      return res
        .status(400)
        .json({ message: "Phone number and country code are required" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true, countrycode: true },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    await prisma.user.update({
      where: { id: userId },
      data: { phone, countrycode },
    });
    return res
      .status(200)
      .json({ message: "Phone number updated successfully" });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const emailchangerequest = async (req, res, next) => {
  try {
    const { userId } = req.user;

    let { email } = req.body;
   
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    let formatedemail = email.toLowerCase() ;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    formatedemail = email.toLowerCase();
    const isexict = await prisma.user.findUnique({where: { email: formatedemail }});
    if(isexict) {
      return res.status(400).json({ message: "Email already exists" });
    }
    const emailchangecode = Math.floor(1000 + Math.random() * 9000)
      .toString()
      .padStart(4, "0");
    const emailchangeexpire = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await prisma.user.update({
      where: { id: userId },
      data: {
        chabgeemailCode: emailchangecode,
        changeemailexpire: emailchangeexpire,
      },
    });
    //send email
    res.status(200).json({ message: "Email change code sent successfully" });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const emailchangecode = async (req, res, next) => {
  try {
    const { userId } = req.user;

    const { code } = req.body;
 
    if (!code) {
      return res.status(400).json({ message: "Email change code is required" });
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { chabgeemailCode: true, changeemailexpire: true },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.chabgeemailCode !== code) {
      return res.status(400).json({ message: "Invalid email change code" });
    }

    if (user.changeemailexpire < new Date()) {
      return res.status(400).json({ message: "Email change code expired" });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        chabgeemailCode: null,
        changeemailexpire: null,
        changeemailpermession: true,
      },
    });
    return res
      .status(200)
      .json({ message: "Email change code verified successfully" });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const changeemail = async (req, res, next) => {
  try {
    const { userId } = req.user;

    const { email } = req.body;
   
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, changeemailpermession: true },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!user.changeemailpermession) {
      return res
        .status(400)
        .json({ message: "Email change permission not granted" });
    }
    const formatedemail = email.toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email: formatedemail },
    });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }
    await prisma.user.update({
      where: { id: userId },
      data: { email: formatedemail, changeemailpermession: false },
    });
    return res.status(200).json({ message: "Email changed successfully" });
  }
  catch(error) {
    console.error(error);
    next(error);
  }
}


export const userDelete = async (req, res, next) => {
  try {
    const { userId } = req.user;

    const now = new Date() ;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true, Isactive: true , email: true , phone: true },
    });
    await prisma.user.update({ where: { id: userId } , data: { Isactive: false , email: user.email + now , phone: user.phone + "_" + now } });
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    next(error);
  }
}

export const contactus = async (req , res ,next) => {
  try{
    const { name, phone, email, title, message } = req.body;

    SibApiV3Sdk.ApiClient.instance.authentications["api-key"].apiKey =
      process.env.BREVO_API ;

    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    let htmlTable = `<!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <title>Contact Us Message</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px; margin: 0;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <div style="padding: 30px;">
        <h2 style="color: #333;">New Contact Us Message</h2>
        <p style="font-size: 16px; color: #555;">You have received a new message from a user through the Contact Us form:</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <tr>
          <td style="font-weight: bold; padding: 8px; border: 1px solid #ddd;">Name:</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${name}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; padding: 8px; border: 1px solid #ddd;">Phone:</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${phone}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; padding: 8px; border: 1px solid #ddd;">Email:</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${email}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; padding: 8px; border: 1px solid #ddd;">Title:</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${title}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; padding: 8px; border: 1px solid #ddd;">Message:</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${message}</td>
        </tr>
        </table>
        <p style="margin-top: 40px; font-size: 14px; color: #aaa;">— The Enjaz Team</p>
      </div>
      </div>
    </body>
    </html>`;
    
      const sendSmtpEmail = {
        to: [
          {
            email: `technical-support@inno-code.com`, // Recipient email
            name: "Contact us", // Recipient name
          },
        ],
        sender: {
          email: "enjazapp098@gmail.com", // Verified sender email in Brevo
          name: `Enjaz No reply`, // Sender name
        },
        subject: `contactUs - ${title}`,
        htmlContent: htmlTable, // our dynamically created table as content
      };
    
      
  apiInstance
  .sendTransacEmail(sendSmtpEmail)
  .then(function (data) {
    console.log("Email sent successfully:", data);
  })
  .catch(function (error) {
    console.error("Error sending email:", error);
    res.status(400).send({ error: "Error sending email", details: error });
  });

      return res.status(200).json({ message: "Email sent successfully" });
 

  }
  catch(error) {
    console.log(error) ;
    next(error) ;
  }
}