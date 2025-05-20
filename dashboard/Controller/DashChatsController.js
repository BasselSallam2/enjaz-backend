import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
dotenv.config();
import express from "express";
import sgMail from "@sendgrid/mail";


export const getChats = async (req , res , next) => {
    try{
        const {userId} = req.user ;
        const chats = await prisma.supportChat.findMany({where:{lockedId:userId} , select:{id:true , userid:true , User:true , isread:true , SupportMessages:{orderBy:{createdAt:"desc"}}}}) ;
        if(!chats) {
            return res.status(200).json([])
        }

        const result = chats.map((chat) => {
            return {
                chatId: chat.id ,
                userId: chat.userid,
                userName: chat.User.name ,
                isRead: chat.isread ,
                clientemail:chat.User.email,
                lastmessage: chat.SupportMessages[0].message,
                lastmessagetime: chat.SupportMessages[0].createdAt
            }
        });
        res.status(200).json(result) ;

    }
    catch(error) {
        console.log(error) ;
        next(error) ;
    }
}



export const getOrderChats = async (req , res , next) => {
    try{
        const {userId} = req.user ;
        const chats = await prisma.orderChat.findMany({where:{lockedId:userId} , select:{id:true , userid:true , User:true , isread:true , OrderMessages:{orderBy:{createdAt:"desc"}}}}) ;
        if(!chats) {
            return res.status(200).json([])
        }

        const result = chats.map((chat) => {
            return {
                chatId: chat.id ,
                userId: chat.userid,
                userName: chat.User.name ,
                isRead: chat.isread ,
                clientemail:chat.User.email,
                lastmessage: chat.OrderMessages[0].message,
                lastmessagetime: chat.OrderMessages[0].createdAt
            }
        });
        res.status(200).json(result) ;

    }
    catch(error) {
        console.log(error) ;
        next(error) ;
    }
}

export const getChatMessages = async (req , res ,next) =>{
    try{
        const {chatId} = req.params ;

        if(!chatId) {
            return res.status(404).json({message:"chatId params is empty"}) ;
        }

        const chats = await prisma.supportMessages.findMany({where:{chatid:chatId} , select:{message:true , sender:true , createdAt:true ,SupportChat:{include:{User:true}}} ,orderBy:{createdAt:"asc"}}) ;
        if(!chats) {
            return res.status(404).json({ message: "No chats found for the provided chatId" });
        }

        const result = chats.map((chat) => {
            return {
                message: chat.message ,
                sender: chat.sender ,
                time: chat.createdAt
            }
        });

        res.status(200).json(result) ;


    }
    catch(error) {
        console.log(error) ;
        next(error) ;
    }
}

export const getOrdersChatMessages = async (req , res ,next) =>{
    try{
        const {chatId} = req.params ;

        if(!chatId) {
            return res.status(404).json({message:"chatId params is empty"}) ;
        }

        const chats = await prisma.orderMessages.findMany({where:{chatid:chatId} , select:{message:true , sender:true , createdAt:true ,OrderChat:{include:{User:true}}} ,orderBy:{createdAt:"asc"}}) ;
        if(!chats) {
            return res.status(404).json({ message: "No chats found for the provided chatId" });
        }

        const result = chats.map((chat) => {
            return {
                message: chat.message ,
                sender: chat.sender ,
                time: chat.createdAt
            }
        });

        res.status(200).json(result) ;


    }
    catch(error) {
        console.log(error) ;
        next(error) ;
    }
}

export const readChat = async (req , res , next) => {
    try{
        const {chatId} = req.params ;

        let chat = await prisma.supportChat.findUnique({where:{id:chatId}}) ;
        let type = "Support" ;

        if(!chat) {
            chat = await prisma.orderChat.findUnique({where:{id:chatId}}) ;
            type = "Order" ;
        }
        
        if(!chat) {
            return res.status(404).json({ message: "Chat not found" });
        }

        if(type === "Support") {
            await prisma.supportChat.update({where:{id:chatId} , data:{isread:true}}) ;
        }
        
        if(type === "Order") {
            await prisma.orderChat.update({where:{id:chatId} , data:{isread:true}});
        }

        res.status(200).json({ message: "Chat marked as read" });

    }
    catch(error) {
        console.log(error) ;
        next(error);
    }
}