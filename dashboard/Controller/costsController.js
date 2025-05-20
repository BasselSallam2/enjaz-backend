import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
dotenv.config();
import express from "express";
import sgMail from "@sendgrid/mail";


export const getCosts = async (req, res , next) => {
    try{
        const printngcover = await prisma.printingCovers.findMany();
        const printingcolors = await prisma.printingCollors.findMany();
        const langugescosts = await prisma.languge.findMany();

       const result = {
            printngcover,
            printingcolors,
            langugescosts
        };
        res.status(200).json(result);

    }
    catch(error){
        console.log(error);
        next(error);
    }
}




export const getCover = async (req, res , next) => {
    try{
        const printngcover = await prisma.printingCovers.findMany();


       const result = {
            printngcover,
        };
        res.status(200).json(result);

    }
    catch(error){
        console.log(error);
        next(error);
    }
}


export const getLanguge = async (req, res , next) => {
    try{
        
        const langugescosts = await prisma.languge.findMany();

       const result = {
            langugescosts
        };
        res.status(200).json(result);

    }
    catch(error){
        console.log(error);
        next(error);
    }
}

export const getcolor = async (req, res , next) => {
    try{
      
        const printingcolors = await prisma.printingCollors.findMany();
       

       const result = {
            printingcolors,
            
        };
        res.status(200).json(result);

    }
    catch(error){
        console.log(error);
        next(error);
    }
}

export const newLanguge = async (req , res , next) => { 
    try{
        let {languge , arabiclanguge , cost} = req.body;
        if(!languge || !arabiclanguge || !cost){
            return res.status(400).json({message:"Please provide all values"});
        }
        cost = parseFloat(cost);
        const langugeExists = await prisma.languge.findFirst({
            where: {
            OR: [
                { name: languge },
                { Arabicname: arabiclanguge }
            ]
            }
        });
        if(langugeExists){
            return res.status(400).json({message:"This languge already exists"});
        }

        const newlanguge = await prisma.languge.create({
            data:{
                name:languge,
                Arabicname:arabiclanguge,
                cost:cost
            }
        });
        res.status(201).json({message:"New languge created successfully", newlanguge});
    }
    catch(error){
        console.log(error);
        next(error);
    }
}



export const editLanguge = async (req , res , next) => { 
    try{
        let {languge , arabiclanguge , cost} = req.body;
        const {id} = req.params;
        if(!languge || !arabiclanguge || !cost){
            return res.status(400).json({message:"Please provide all values"});
        }
        cost = parseFloat(cost);

        const thelanguge = await prisma.languge.findUnique({
            where:{
                id:id
            }
        });
        if(!thelanguge){
            return res.status(404).json({message:"This languge does not exist"});
        }

        const langugeExists = await prisma.languge.findFirst({
            where: {
            id: {
                not: id
            },
            OR: [
                { name: languge },
                { Arabicname: arabiclanguge }
            ]
            }
        });

        if(langugeExists){
            return res.status(400).json({message:"This languge already exists"});
        }

        const editLanguge = await prisma.languge.update({where:{id:id},
            data:{
                name:languge,
                Arabicname:arabiclanguge,
                cost:cost
            }
        });
        res.status(201).json({message:"languge updated successfully", editLanguge});
    }
    catch(error){
        console.log(error);
        next(error);
    }
}


export const newColor = async (req , res , next) => { 
    try{
        let {color , arabiccolor , cost} = req.body;
        if(!color || !arabiccolor || !cost){
            return res.status(400).json({message:"Please provide all values"});
        }
        cost = parseFloat(cost);
        const colorexicts = await prisma.printingCollors.findFirst({
            where: {
            OR: [
                { color: color },
                { ArabicColor: arabiccolor }
            ]
            }
        });
        if(colorexicts){
            return res.status(400).json({message:"This color already exists"});
        }

        const newcolor = await prisma.printingCollors.create({
            data:{
                color:color,
                ArabicColor:arabiccolor,
                cost:cost
            }
        });
        res.status(201).json({message:"New color created successfully", newColor});
    }
    catch(error){
        console.log(error);
        next(error);
    }
}

export const editColor = async (req , res , next) => { 
    try{
        let {color , arabiccolor , cost} = req.body;
        const {id} = req.params;
        if(!color || !arabiccolor || !cost){
            return res.status(400).json({message:"Please provide all values"});
        }
        cost = parseFloat(cost);

        const thecolor = await prisma.printingCollors.findUnique({
            where:{
                id:id
            }
        });
        if(!thecolor){
            return res.status(404).json({message:"This color does not exist"});
        }

        const colorexicts = await prisma.printingCollors.findFirst({
            where: {
            id: {
                not: id
            },
            OR: [
                { color: color },
                { ArabicColor: arabiccolor }
            ]
            }
        });

        if(colorexicts){
            return res.status(400).json({message:"This color already exists"});
        }

        const editColor = await prisma.printingCollors.update({where:{id:id},
            data:{
                color:color,
                ArabicColor:arabiccolor,
                cost:cost
            }
        });
        res.status(201).json({message:"color updated successfully", editColor});
    }
    catch(error){
        console.log(error);
        next(error);
    }
}

export const newCover = async (req , res , next) => { 
    try{
        let {cover , arabiccover , cost} = req.body;
        if(!cover || !arabiccover || !cost){
            return res.status(400).json({message:"Please provide all values"});
        }
        cost = parseFloat(cost);
        const coverexicts = await prisma.printingCovers.findFirst({
            where: {
            OR: [
                { name: cover },
                { arabicname: arabiccover }
            ]
            }
        });
        if(coverexicts){
            return res.status(400).json({message:"This cover already exists"});
        }

        const newCover = await prisma.printingCovers.create({
            data:{
                name:cover,
                arabicname:arabiccover,
                cost:cost
            }
        });
        res.status(201).json({message:"New cover created successfully", newCover});
    }
    catch(error){
        console.log(error);
        next(error);
    }
}

export const editCover = async (req , res , next) => { 
    try{
        let {cover , arabiccover , cost} = req.body;
        const {id} = req.params;
        if(!cover || !arabiccover || !cost){
            return res.status(400).json({message:"Please provide all values"});
        }
        cost = parseFloat(cost);

        const thecover = await prisma.printingCovers.findUnique({
            where:{
                id:id
            }
        });
        if(!thecover){
            return res.status(404).json({message:"This cover does not exist"});
        }

        const coverexicts = await prisma.printingCovers.findFirst({
            where: {
            id: {
                not: id
            },
            OR: [
                { name: cover },
                { arabicname: arabiccover }
            ]
            }
        });

        if(coverexicts){
            return res.status(400).json({message:"This cover already exists"});
        }

        const editCover = await prisma.printingCovers.update({where:{id:id},
            data:{
                name:cover,
                arabicname:arabiccover,
                cost:cost
            }
        });
        res.status(201).json({message:"cover updated successfully", editCover});
    }
    catch(error){
        console.log(error);
        next(error);
    }
}

