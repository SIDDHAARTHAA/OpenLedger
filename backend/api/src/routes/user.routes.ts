import { Router } from "express";
import { getBalance, getMe } from "src/controller/user.controller.js";

const router = Router();

router.get("/me", getMe);
router.get("/balance", getBalance);

export default router;