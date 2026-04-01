import { Router } from "express";
import {
  createRecord,
  deleteRecord,
  getRecordById,
  listRecords,
  updateRecord,
} from "src/controller/record.controller.js";
import { requireRole } from "src/middleware/role.middleware.js";

const router = Router();

router.get("/", requireRole("ADMIN", "ANALYST"), listRecords);
router.get("/:recordId", requireRole("ADMIN", "ANALYST"), getRecordById);
router.post("/", requireRole("ADMIN"), createRecord);
router.patch("/:recordId", requireRole("ADMIN"), updateRecord);
router.delete("/:recordId", requireRole("ADMIN"), deleteRecord);

export default router;
