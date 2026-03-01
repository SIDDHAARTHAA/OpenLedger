import { Router } from "express";
import authRoutes from "./auth.routes.js";
import user from "./user.routes.js";
import transaction from "./transaction.routes.js";
import asset from "./asset.routes.js";
import { requireAuth } from "src/middleware/auth.middleware.js";
import { bankWebhook, depositTransaction, withdrawTransaction } from "src/controller/transaction.controller.js";

const router = Router();

router.use("/auth", authRoutes);
router.post("/webhook/bank", bankWebhook);
router.post("/deposit", requireAuth, depositTransaction);
router.post("/withdraw", requireAuth, withdrawTransaction);
router.use("/user", requireAuth, user);
router.use("/assets", requireAuth, asset);
router.use("/transaction", requireAuth, transaction);

export default router;
