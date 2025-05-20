import express from "express";
const router = express.Router();
import {authenticateUser} from "../Middleware/Authentication.js";
import {ordersStatistics , ordersRate , currentOrders , updateOrder , getOrder , downloadOrders} from "../Controller/OrdersController.js";

router.get('/orders/statistics' , authenticateUser , ordersStatistics) ;
router.get('/orders/rate' , authenticateUser , ordersRate) ;
router.get('/orders/current' , authenticateUser , currentOrders) ;
router.put('/order/update/:orderId' , authenticateUser , updateOrder) ;
router.get('/order/:orderId' , authenticateUser , getOrder ) ;
router.get('/order/download/:orderId' , downloadOrders )

export default router;