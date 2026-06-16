import { Router } from "express";
import { SessionController } from "../controllers/session.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { accessMiddleware } from "../middlewares/access.middleware";

const router = Router();
const controller = new SessionController();

router.post("/", accessMiddleware, authMiddleware, controller.create);
router.get("/", accessMiddleware, authMiddleware, controller.findAll);
router.get("/:id", accessMiddleware, authMiddleware, controller.findById);
router.patch("/:id/revoke", accessMiddleware, authMiddleware, controller.revoke);
router.delete("/:id", accessMiddleware, authMiddleware, controller.delete);

export default router;
