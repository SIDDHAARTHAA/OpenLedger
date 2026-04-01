import { Router } from "express";
import { createUser, getMe, listUsers, updateUser } from "src/controller/user.controller.js";
import { requireRole } from "src/middleware/role.middleware.js";

const router = Router();

router.get("/me", getMe);
router.get("/", requireRole("ADMIN"), listUsers);
router.post("/", requireRole("ADMIN"), createUser);
router.patch("/:userId", requireRole("ADMIN"), updateUser);

export default router;
