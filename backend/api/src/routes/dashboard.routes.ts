import { Router } from "express";
import { getDashboardSummary, getDashboardTrends } from "src/controller/dashboard.controller.js";
import { requireRole } from "src/middleware/role.middleware.js";

const router = Router();

router.get("/summary", requireRole("VIEWER", "ANALYST", "ADMIN"), getDashboardSummary);
router.get("/trends", requireRole("VIEWER", "ANALYST", "ADMIN"), getDashboardTrends);

export default router;
