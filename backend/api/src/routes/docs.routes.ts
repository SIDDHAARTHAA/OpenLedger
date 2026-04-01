import { Router } from "express";
import { getDocsPage } from "src/controller/docs.controller.js";

const router = Router();

router.get("/", getDocsPage);

export default router;
