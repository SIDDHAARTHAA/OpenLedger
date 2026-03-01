import { Router } from "express";
import { buyAsset, listAssetCatalog, listMyAssets } from "src/controller/asset.controller.js";

const router = Router();

router.get("/catalog", listAssetCatalog);
router.get("/my", listMyAssets);
router.post("/buy", buyAsset);

export default router;
