import { Router } from "express";
import {
  depositTransaction,
  getTransactions,
  withdrawTransaction,
} from "src/controller/transaction.controller.js";
const router = Router();

router.get("/", getTransactions);
router.post("/deposit", depositTransaction);
router.post("/withdraw", withdrawTransaction);

export default router;
