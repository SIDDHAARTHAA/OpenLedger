import { Router } from "express";
import { getMe } from "src/controller/user.controller.js";

const router = Router();

router.get("/me", getMe);

export default router;