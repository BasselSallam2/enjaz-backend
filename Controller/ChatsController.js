import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { z } from "zod";
import bcrypt from "bcryptjs";
dotenv.config();
import express from "express";
import SibApiV3Sdk from "sib-api-v3-sdk";


export const getSupportChat = async (req , res , next) => {
    try {
        const {userId} = req.user ;
        const chatId = await prisma.user.findUnique({where:{id:userId} , select:{SupportChat:true}}) ;
        if(!chatId) {
            return res.status(200).json([]) ;
        }

        if(!chatId.SupportChat) {
            return res.status(200).json([]) ;
        }

        const chats = await prisma.supportMessages.findMany({where:{chatid:chatId.SupportChat.id} , orderBy:{createdAt:"asc"}}) ;
        if(!chats) {
            return res.status(404).json({message:"could not found messages"}) ;
        }
        let results = chats.map((chat) => {
            return {
                sender:chat.sender ,
                message:chat.message ,
                time: chat.createdAt
            }
        })
        res.status(200).json(results) ;

    }
    catch(error) {
        console.log(error) ;
        next(error);
    }
}




export const getOrderChat = async (req , res , next) => {
    try {
        const {userId} = req.user ;
        const chatId = await prisma.user.findUnique({where:{id:userId} , select:{OrderChat:true}}) ;
        if(!chatId.OrderChat) {
            return res.status(200).json([]) ;
        }
        const chats = await prisma.orderMessages.findMany({where:{chatid:chatId.OrderChat.id} , orderBy:{createdAt:"asc"}}) ;
        if(!chats) {
            return res.status(404).json({message:"could not found messages"}) ;
        }
        let results = chats.map((chat) => {
            return {
                sender:chat.sender ,
                message:chat.message ,
                time: chat.createdAt
            }
        })
        res.status(200).json(results) ;

    }
    catch(error) {
        console.log(error) ;
        next(error);
    }
}