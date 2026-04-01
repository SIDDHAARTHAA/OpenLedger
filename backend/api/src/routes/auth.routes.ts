import { Router } from "express";
import { authGoogleCallback, authGoogleStart, emailLogin, emailSignup, logout } from "src/controller/auth.controller.js";

const router = Router();

router.get("/google", authGoogleStart);
router.get("/google/callback", authGoogleCallback);
router.post("/signup", emailSignup);
router.post("/login", emailLogin);
router.post("/logout", logout);

export default router;
