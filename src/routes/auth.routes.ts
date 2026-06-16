import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";

const router = Router();
const Auth = new AuthController();

router.post("/login", Auth.login);

export default router;