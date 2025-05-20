import express from "express";
const router = express.Router();
import {authenticateUser} from "../Middleware/Authentication.js";
import {getEmployeesNumber , getEmployess , getEmployee} from "../Controller/EmployeesController.js";

router.get('/employees/number' , authenticateUser , getEmployeesNumber);
router.get('/employees/allemployees' , authenticateUser , getEmployess);
router.get('/employees/:employeeId' , authenticateUser , getEmployee);


export default router;