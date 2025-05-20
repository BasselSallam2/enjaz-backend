import express from "express"
const router = express.Router() ;

import {authenticateUser} from "../Middleware/Authentication.js"
import {getallnotifications , readEmployeeNotification , deleteAllNotifications} from "../Controller/EmployeeNotificationController.js"

router.delete('/employee/notification' , authenticateUser , deleteAllNotifications);
router.get('/employee/notification' , authenticateUser , getallnotifications) ;
router.post('/employee/notification/:notificationId' , authenticateUser , readEmployeeNotification) ;



export default router ;