import { Router } from "express";
import { depositTransaction } from "src/controller/transaction.controller.js";
const router = Router();

router.post("/deposit", depositTransaction);

export default router;
