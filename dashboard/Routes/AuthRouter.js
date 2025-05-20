import express from "express";
const router = express.Router();
import {authenticateUser} from "../Middleware/Authentication.js";
import {login , register , DeleteEmployee ,getAllEmployees , editEmployee} from "../Controller/AuthController.js";

router.post("/register" , authenticateUser , register) ;
router.post("/login" , login) ;
router.delete("/emplouee/delete/:id" , authenticateUser , DeleteEmployee) ;
router.get("/employees" , authenticateUser , getAllEmployees) ;
router.put("/employees/edit/:employeeId" , authenticateUser , editEmployee) ;





export default router ;