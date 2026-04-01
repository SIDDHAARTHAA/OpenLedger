import { Router } from "express";
import authRoutes from "./auth.routes.js";
import dashboard from "./dashboard.routes.js";
import record from "./record.routes.js";
import user from "./user.routes.js";
import { requireAuth } from "src/middleware/auth.middleware.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", requireAuth, user);
router.use("/records", requireAuth, record);
router.use("/dashboard", requireAuth, dashboard);

export default router;
