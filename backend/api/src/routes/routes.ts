import { Router } from "express";
import authRoutes from "./auth.routes.js"
import user from "./user.routes.js"

const router = Router();

router.use("/auth", authRoutes);
router.use("/user", user)

export default router;