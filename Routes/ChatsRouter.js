import express from "express";
const router = express.Router();
import {authenticateUser} from "../middleware/Authentication.js"
import {getSupportChat , getOrderChat} from "../Controller/ChatsController.js"

router.get('/chat/support/clitent' , authenticateUser , getSupportChat ) ;
router.get('/chat/order/clitent' , authenticateUser , getOrderChat ) ;




export default router ;