import { Router } from "express";
import authRoutes from "./auth.routes.js";
import user from "./user.routes.js";
import transaction from "./transaction.routes.js";
import { requireAuth } from "src/middleware/auth.middleware.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/user", requireAuth, user);
router.use("/transaction", requireAuth, transaction);

export default router;