import { Router } from "express";
import { approveOrder, createOrder, renderApprovalPage } from "../controller/bank.controller.js";

const router = Router();

router.post("/api/bank/create-order", createOrder);
router.get("/bank/approve", renderApprovalPage);
router.post("/api/bank/approve", approveOrder);

export default router;
