import express from "express";
const router = express.Router();
import {authenticateUser} from "../Middleware/Authentication.js";
import { getCosts , newLanguge , newColor , newCover , editLanguge , editColor , editCover , getcolor , getLanguge , getCover} from "../Controller/costsController.js";

router.get("/costs", authenticateUser, getCosts);
router.post("/languge", authenticateUser, newLanguge);
router.get("/languge", getLanguge);
router.put("/languge/:id", authenticateUser, editLanguge);
router.post("/color", authenticateUser, newColor);
router.get("/color", getcolor);
router.put("/color/:id", authenticateUser, editColor);
router.post("/cover", authenticateUser, newCover);
router.get("/cover", getCover);
router.put("/cover/:id", authenticateUser, editCover);

export default router ;