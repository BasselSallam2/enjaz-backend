import express from "express"
const router = express.Router() ;

import {authenticateUser} from "../middleware/Authentication.js"
import {getallnotifications , readCoustmerNotification} from "../Controller/costumerNotificationController.js"

router.get('/coustmer/notification' , authenticateUser , getallnotifications) ;
router.post('/coustmer/notification/:notificationId' , authenticateUser , readCoustmerNotification) ;


export default router ;