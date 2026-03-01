import { Router } from "express";
import { approveOrder, createOrder, registerWithdrawal, renderApprovalPage } from "../controller/bank.controller.js";

const router = Router();

router.post("/api/bank/create-order", createOrder);
router.post("/api/bank/withdraw", registerWithdrawal);
router.get("/bank/approve", renderApprovalPage);
router.post("/api/bank/approve", approveOrder);

export default router;
