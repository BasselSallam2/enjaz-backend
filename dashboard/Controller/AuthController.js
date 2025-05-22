import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
dotenv.config();
import express from "express";
import sgMail from "@sendgrid/mail";
import { title } from "process";


export const login = async (req , res , next) => {
    try {
        const {email , password} = req.body ;
        if(!email || !password) {
            return res.status(401).json({error : "Please fill all fields"})
        }
        console.log(req.body);

        const formatedemail = email.toLowerCase();
        const employee = await prisma.employee.findUnique({
            where : {email : formatedemail}
        })
        if(!employee) {
            return res.status(401).json({error : "Invalid email or password"})
        }
        const isMatch = await bcrypt.compare(password , employee.password)
        if(!isMatch) {
            return res.status(401).json({error : "Invalid email or password"})
        }
        const JWTPayload = {
            employeeId : employee.id ,
            employeename : employee.name ,
            employeeemail : employee.email ,
            title : employee.title ,
        }
       
        const JWTsecretKey = process.env.JWT_SECRET_DASHBOARD;
        const token = jwt.sign(JWTPayload , JWTsecretKey);
        res.cookie("token" , token , {
            httpOnly : true ,
            secure : process.env.NODE_ENV === "production",
        });
        res.status(200).json({message : "Login successful" , token : token , title:employee.title , employeeId: employee.id , employeename: employee.name});

    }
    catch(error) {
        next(error) ;

    }
}

export const register = async (req , res , next) => {
    try {
        const {email , password  , phone , name , department} = req.body ;
       
     

        if(!email || !password || !phone || !name || !department) {
            return res.status(401).json({error : "Please fill all fields" , required : ["email" , "password" , "phone" , "name" , "department"]});
        }

        if(department !== "translation" && department !== "printing") {
            return res.status(401).json({error : "Please select a valid department allowed departments are 'translation' and 'printing' only"})
        }

       

        const fromatedemail = email.toLowerCase() ;
        const user = await prisma.employee.findFirst({
            where: {
            OR: [
                { email: fromatedemail },
                { phone: phone }
            ]
            }
        });

        if(user) {
            return res.status(401).json({error : "User already exists cannot create user with same email or phone"})
        }

        const hashedPassword = await bcrypt.hash(password , 12) ;
        const newUser = await prisma.employee.create({
            data : {
                email : fromatedemail ,
                password : hashedPassword ,
                phone : phone ,
                name : name ,
                department : department ,
            }
        });
        res.status(201).json({message : "User created successfully" , userId : newUser.id});
    }

    catch(error) {
        console.log(error)
        next(error)
    }
}

export const DeleteEmployee = async (req , res , next) => {
    try {
        const {id} = req.params ;
        // const {title} = req.user ;

        // if(title !== "admin" && title !== "superadmin") {
        //     return res.status(401).json({error : "Unauthorized" , message : "employees not allowed to delete any user" })
        // }
        const user = await prisma.employee.findUnique({
            where : {id : id}
        })
        if(!user) {
            return res.status(401).json({error : "User not found"})
        }
        // if(user.title === "superadmin") {
        //     return res.status(401).json({error : `${title} Cannot delete superadmin`})
        // }
        // if((user.title === "admin" && title === "admin")) {
        //     return res.status(401).json({error : "admin cannot delete another admin"})
        // }
        await prisma.employee.update({
            where : {id : id} , data:{
                isDeleted : true ,
                email : `${user.email.split("@")[0]}-${Date.now()}@deleted`,
                phone : `${user.phone.split("@")[0]}-${Date.now()}@deleted`,
                name : `${user.name.split("@")[0]}-${Date.now()}@deleted`,
                password : `${user.password.split("@")[0]}-${Date.now()}@deleted`,
            }
        })
        res.status(200).json({message : "User deleted successfully"})
    }
    catch(error) {
        console.log(error)
        next(error)
    }
}

export const getAllEmployees = async (req , res , next) => {
    try {
        // const {title} = req.user ;
        // if(title !== "admin" && title !== "superadmin") {
        //     return res.status(401).json({error : "Unauthorized"})
        // }
        const employees = await prisma.employee.findMany({where : {isDeleted:false} ,select: {
            id : true ,
            email : true ,
            title : true ,
            phone : true ,
            name : true ,
        }}) ;
        if(!employees || employees.length === 0) {
            return res.status(401).json({error : "No employees found"})
        }
        
        res.status(200).json({employees : employees})
    }
    catch(error) {
        console.log(error)
        next(error)
    }
}

export const editEmployee = async (req , res , next) => {
    try {
        const {employeeId} = req.params ;
        const {email , password  , phone , name , department} = req.body ;

       

        if(!email || !phone || !name || !department) {
            return res.status(401).json({error : "Please fill all fields" , required : ["email" , "password" , "phone" , "name" , "department"]});
        }

        if(department !== "translation" && department !== "printing") {
            return res.status(401).json({error : "Please select a valid department allowed departments are 'translation' and 'printing' only"})
        }
       
       
        const employee = await prisma.employee.findUnique({
            where : {id : employeeId}
        })

        if(!employee) {
            return res.status(401).json({error : "User not found"})
        }
        let hashedPassword = employee.password ;
        if(password) {
            hashedPassword = await bcrypt.hash(password , 12) ;
        }

        const updatedEmployee = await prisma.employee.update({
            where : {id : employeeId} , data:{
                email : email.toLowerCase() ,
                password : hashedPassword ,
                phone : phone ,
                name : name ,
                department : department ,
            }
        })
        res.status(200).json({message : "User updated successfully"})
    }
    catch(error) {
        console.log(error)
        next(error)
    }
}