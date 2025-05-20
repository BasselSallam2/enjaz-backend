import express from "express";
const router = express.Router();
import {authenticateUser} from "../Middleware/Authentication.js";
import {clientTable , clientsOverview , deleteClient , editClient , bestClients , downloadClientDetails , clientInfo , clientStatistics , clientOrders , addClient} from "../Controller/clientsController.js";



// GET routes
router.get("/clients/best", bestClients);
router.get("/clients/overview", authenticateUser, clientsOverview);
router.get("/clients/download/:id", downloadClientDetails);
router.get("/clients/:id/statistcs", authenticateUser, clientStatistics);
router.get("/clients/:id/orders", authenticateUser, clientOrders);
router.get("/clients", authenticateUser, clientTable);
router.get("/clients/:id", authenticateUser, clientInfo);

// POST route
router.post("/clients", authenticateUser, addClient);

// PUT route
router.put("/clients/:id", authenticateUser, editClient);

// DELETE route
router.delete("/clients/:id", authenticateUser, deleteClient);



export default router ;