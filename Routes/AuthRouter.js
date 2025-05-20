import express from "express";
const router = express.Router();
import pkg from 'express-openid-connect';
const { auth , requiresAuth } = pkg;
import dotenv from 'dotenv';
dotenv.config();

import {GoogleLoign , saveProfile , verifyUser , signup , login , activationCode , updateToken , getToken , signupVerify , resendCode , GoogleIsverify} from "../Controller/AuthController.js"
import {authenticateUser} from "../middleware/Authentication.js"


router.get('/login-google' , GoogleLoign) ;
router.get('/save-profile' , saveProfile ) ;
router.post('/user/:userId/verify' , verifyUser ) ;
router.post('/signup' , signup ) ;
router.post('/login-account' , login) ;
router.post('/login-account/:userId/code' , activationCode) ; 
router.post('/login/token' , authenticateUser ,  updateToken) ;
router.get('/token/:email' , getToken  ) ;
router.post('/verify/:userId'  ,  signupVerify) ;
router.post('/verify/resend/:userId' ,  resendCode) ;
router.get('/google/isverify' , authenticateUser , GoogleIsverify ) ;


export default router;