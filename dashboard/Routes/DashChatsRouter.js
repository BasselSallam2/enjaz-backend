import express from "express";
const router = express.Router();

import {authenticateUser} from "../Middleware/Authentication.js"
import {getChats , getChatMessages , getOrderChats , getOrdersChatMessages , readChat} from "../Controller/DashChatsController.js"

router.get('/chat/support' , authenticateUser , getChats ) ;
router.get('/chat/order' , authenticateUser , getOrderChats ) ;
router.get('/chat/support/:chatId' , authenticateUser , getChatMessages) ;
router.get('/chat/order/:chatId' , authenticateUser , getOrdersChatMessages) ;
router.post('/chat/read/:chatId' , authenticateUser , readChat) ;
export default router ;