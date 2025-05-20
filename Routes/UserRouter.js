import express from "express";
const router = express.Router();
import pkg from 'express-openid-connect';
const { auth , requiresAuth } = pkg;
import dotenv from 'dotenv';
dotenv.config();
import multer from "multer"
import path from 'path';
import { fileURLToPath } from 'url';

import {getUserName , changephone , emailchangerequest , emailchangecode , changeemail , userDelete , contactus} from "../Controller/UserController.js"
import {authenticateUser} from "../middleware/Authentication.js"

router.get('/user', authenticateUser , getUserName );
router.put('/user/changephone', authenticateUser , changephone );
router.post('/user/chgnageemail' , authenticateUser ,changeemail );
router.post('/user/chgnageemail/request' , authenticateUser ,emailchangerequest );
router.post('/user/chgnageemail/code' , authenticateUser ,emailchangecode );
router.delete("/user/delete" , authenticateUser ,userDelete ) ;
router.post("/contactus" , contactus) ;



export default router; 