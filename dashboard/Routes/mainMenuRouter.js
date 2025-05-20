import express from "express";
const router = express.Router();
import {authenticateUser} from "../Middleware/Authentication.js" ;
import {overview , lastOrders , deleteOrder , getRevenue , topClinets , urgentOrders} from "../Controller/mainMenuController.js"

router.get('/home/overview' , authenticateUser ,overview ) ;
router.get('/home/lastorders' , authenticateUser , lastOrders ) ;
router.delete('/home/order/:id' , authenticateUser , deleteOrder ) ;
router.get('/home/revenue' ,authenticateUser , getRevenue) ;
router.get('/home/topclients' , authenticateUser , topClinets) ;
router.get('/home/urgent' , authenticateUser , urgentOrders) ;







export default router ;

