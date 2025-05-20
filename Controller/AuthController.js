import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { z } from "zod";
import bcrypt from "bcryptjs";
dotenv.config();
import express from "express";
import SibApiV3Sdk from "sib-api-v3-sdk";


export const GoogleLoign = async (req, res, next) => {
  res.oidc.login({
    returnTo: "/api/save-profile",
    authorizationParams: {
      connection: "google-oauth2",
    },
  });
};

export const saveProfile = async (req, res, next) => {
  try {
    let newUser;
    let verfied = true;
    const Authuser = req.oidc.user;
    if (!Authuser) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = await prisma.user.findUnique({
      where: { AuthID: Authuser.sub },
    });

    if (!user) {
      newUser = await prisma.user.create({
        data: {
          email: Authuser.email,
          name: Authuser.name,
          AuthID: Authuser.sub,
          password: null,
        },
      });
      verfied = false;
    }

    if (user && user.phone == null) {
      verfied = false;
    }

    const JWTPayload = {
      userId: user?.id || newUser.id,
      username: user?.name || newUser.name,
      email: user?.email || newUser.email,
      verfied: verfied,
    };

    const JWTsecretKey = process.env.JWT_SECRET;
    const token = jwt.sign(JWTPayload, JWTsecretKey);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
    res
      .status(200)
      .json({ message: "Login successful", token: token, verfied: verfied });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const verifyUser = async (req, res, next) => {
  try {
    const { phone, countrycode } = req.body;
    const { userId } = req.params;

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        phone: phone,
        countrycode: countrycode,
      },
    });

    res.status(200).json({ message: "User is verified successfully" });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const signup = async (req, res, next) => {
  try {
    const { firstname, lastname, phone, email, countrycode } = req.body;
    const formatedemail = email.toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: formatedemail }, { phone: phone }],
      },
    });

    if (user) {
      return res.status(400).json({ error: "Email or phone is already taken" });
    }

    const verifiyCode = Math.floor(1000 + Math.random() * 9000)
      .toString()
      .padStart(4, "0");

    const newUser = await prisma.user.create({
      data: {
        name: `${firstname} ${lastname}`,
        phone: phone,
        countrycode: countrycode,
        email: formatedemail,
        verificationCode: verifiyCode,
      },
    });

    SibApiV3Sdk.ApiClient.instance.authentications["api-key"].apiKey =
    process.env.EMAIL_API;

    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    let htmlTable = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Welcome to Enjaz</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px; margin: 0;">
  <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <img src="https://i.imgur.com/oOC4daf.png" alt="Welcome to Enjaz" style="width: 100%; display: block;">
    <div style="padding: 30px;">
      <h2 style="color: #333;">Welcome to Enjaz! 🎉</h2>
      <p style="font-size: 16px; color: #555;">Thank you for signing up. We're excited to have you on board.</p>
      <p style="font-size: 16px; color: #555;">To verify your account, please enter the following 4-digit code in the app:</p>

      <div style="font-size: 32px; font-weight: bold; color: #1a73e8; text-align: center; margin: 20px 0;">
        <span style="letter-spacing: 10px;">${verifiyCode}</span>
      </div>

      <p style="font-size: 14px; color: #777;">If you didn't request this, you can ignore this message.</p>

      <p style="margin-top: 40px; font-size: 14px; color: #aaa;">— The Enjaz Team</p>
    </div>
  </div>
</body>
</html>
`;

    const sendSmtpEmail = {
      to: [
        {
          email: `${formatedemail}`, // Recipient email
          name: "New User", // Recipient name
        },
      ],
      sender: {
        email: "enjazapp098@gmail.com", // Verified sender email in Brevo
        name: `Enjaz No reply`, // Sender name
      },
      subject: `Verifiy your email in Enjaz app`,
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

    res
      .status(201)
      .json({ message: "User is created successfully", user: newUser.id });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { method, id } = req.body;
    let user;
    if (method == "PHONE") {
      user = await prisma.user.findUnique({
        where: { phone: id, isDeleted: false },
      });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
    } else if (method == "EMAIL") {
      const formatedemail = id.toLowerCase();
      user = await prisma.user.findUnique({
        where: { email: formatedemail, isDeleted: false },
      });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
    }

    if(user.isVerified == false){
      return res.status(400).json({ error: "User is not verified" });
    }

    const loginCode = Math.floor(1000 + Math.random() * 9000)
      .toString()
      .padStart(4, "0");
    const loginExpire = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { loginCode: loginCode, loginexpire: loginExpire },
    });

    SibApiV3Sdk.ApiClient.instance.authentications["api-key"].apiKey =
    process.env.EMAIL_API;

  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

  let htmlTable =  `<!DOCTYPE html>
  <html lang="en">
  <head>
  <meta charset="UTF-8">
  <title>Enjaz Login Code</title>
  </head>
  <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px; margin: 0;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <img src="https://i.imgur.com/oOC4daf.png" alt="Enjaz Login" style="width: 100%; display: block;">
      <div style="padding: 30px;">
        <h2 style="color: #333;">Your Enjaz Login Code 🔐</h2>
        <p style="font-size: 16px; color: #555;">We received a request to log in to your Enjaz account.</p>
        <p style="font-size: 16px; color: #555;">Please enter the following 4-digit code in the app to continue:</p>
  
        <div style="font-size: 32px; font-weight: bold; color: #1a73e8; text-align: center; margin: 20px 0;">
          <span style="letter-spacing: 10px;">${loginCode}</span>
        </div>
  
        <p style="font-size: 14px; color: #777;">If you did not try to log in, you can safely ignore this message.</p>
  
        <p style="margin-top: 40px; font-size: 14px; color: #aaa;">— The Enjaz Team</p>
      </div>
    </div>
  </body>
  </html>`;

  const sendSmtpEmail = {
    to: [
      {
        email: `${user.email}`, // Recipient email
        name: "New User", // Recipient name
      },
    ],
    sender: {
      email: "enjazapp098@gmail.com", // Verified sender email in Brevo
      name: `Enjaz No reply`, // Sender name
    },
    subject: `login OTP - Enjaz app`,
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

    res.status(200).json({
      message: "Login code has been sent successfully",
      userId: user.id,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const activationCode = async (req, res, next) => {
  try {
    const { code } = req.body;
    const { userId } = req.params;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (new Date() > user.loginexpire) {
      return res.status(400).json({ error: "Code is expired" });
    }

    if (code !== user.loginCode) {
      return res.status(400).json({ error: "Invalid code" });
    }

    const JWTPayload = {
      userId: user.id,
      username: user.name,
      email: user.email,
      verfied: true,
    };

    const JWTsecretKey = process.env.JWT_SECRET;
    const token = jwt.sign(JWTPayload, JWTsecretKey);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    res.status(200).json({ message: "Login successful", token: token });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const updateToken = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { token } = req.body;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, mobileToken: true },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (user.mobileToken == token) {
      return res.status(200).json({ error: "Token is already updated" });
    }
    await prisma.user.update({
      where: { id: userId },
      data: { mobileToken: token },
    });
    res.status(200).json({ message: "Token is updated successfully" });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const getToken = async (req, res, next) => {
  try {
    const { email } = req.params;
    const user = await prisma.user.findUnique({ where: { email: email } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json({ otp: user.loginCode });
  } catch (error) {
    console.log(error);
    next(error);
  }
};


export const signupVerify = async (req, res, next) => {
  try{
    const { userId } = req.params;
    const { code } = req.body;
    if(!code) {
      return res.status(400).json({ error: "Verification code is required" });
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if(user.isVerified == true){
      return res.status(400).json({ error: "User is already verified" });
    }


    if (user.verificationCode !== code) {
      return res.status(400).json({ error: "Invalid code" });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true, verificationCode: null },
    });
    res.status(200).json({ message: "User is verified successfully" });

  }
  catch(error){
    console.log(error);
    next(error);
  }
}

export const resendCode = async (req, res, next) => {
  try{
    const { userId } = req.params;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user ) {
      return res.status(404).json({ error: "User not found" });
    }

    if(user.isVerified == true){
      return res.status(400).json({ error: "User is already verified" });
    }

    const verifiyCode = Math.floor(1000 + Math.random() * 9000)
      .toString()
      .padStart(4, "0");

    await prisma.user.update({
      where: { id: userId },
      data: { verificationCode: verifiyCode },
    });

    SibApiV3Sdk.ApiClient.instance.authentications["api-key"].apiKey =
    process.env.EMAIL_API;

    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    
    let htmlTable = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Welcome to Enjaz</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px; margin: 0;">
  <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <img src="https://i.imgur.com/oOC4daf.png" alt="Welcome to Enjaz" style="width: 100%; display: block;">
    <div style="padding: 30px;">
      <h2 style="color: #333;">Welcome to Enjaz! 🎉</h2>
      <p style="font-size: 16px; color: #555;">Thank you for signing up. We're excited to have you on board.</p>
      <p style="font-size: 16px; color: #555;">To verify your account, please enter the following 4-digit code in the app:</p>

      <div style="font-size: 32px; font-weight: bold; color: #1a73e8; text-align: center; margin: 20px 0;">
        <span style="letter-spacing: 10px;">${verifiyCode}</span>
      </div>

      <p style="font-size: 14px; color: #777;">If you didn't request this, you can ignore this message.</p>

      <p style="margin-top: 40px; font-size: 14px; color: #aaa;">— The Enjaz Team</p>
    </div>
  </div>
</body>
</html>
`;

    const sendSmtpEmail = {
      to: [
        {
          email: `${user.email}`, // Recipient email
          name: "New User", // Recipient name
        },
      ],
      sender: {
        email: "enjazapp098@gmail.com", // Verified sender email in Brevo
        name: `Enjaz No reply`, // Sender name
      },
      subject: `Verifiy your email in Enjaz app`,
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

      res.status(200).json({message:"Code is resent succefully" , userid:user.id})


  }
  catch(error){
    console.log(error);
    next(error);
  }
}

export const GoogleIsverify = async (req , res ,next) => {
  try {
    const {userId} = req.user ;

    const user = await prisma.user.findUnique({where:{id:userId}}) ;
    if(!user){
      return res.status(404).json({ error: "User not found" });
    }
    if(!user.phone) {
      return res.status(400).json({ error: "User is not verified" });
    }
    res.status(200).json({message:"User is verified"}) ;

  }
  catch(error) {
    console.log(error) ;
    next(error) ;
  }
}
