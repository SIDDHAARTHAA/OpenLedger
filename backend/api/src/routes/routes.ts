import { Router } from "express";
import { getOpenApiSpec } from "src/controller/docs.controller.js";
import authRoutes from "./auth.routes.js";
import dashboard from "./dashboard.routes.js";
import docs from "./docs.routes.js";
import record from "./record.routes.js";
import user from "./user.routes.js";
import { requireAuth } from "src/middleware/auth.middleware.js";

const router = Router();

router.get("/docs.json", getOpenApiSpec);
router.use("/docs", docs);
router.use("/auth", authRoutes);
router.use("/users", requireAuth, user);
router.use("/records", requireAuth, record);
router.use("/dashboard", requireAuth, dashboard);

export default router;
