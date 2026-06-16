import { Router } from "express";
import { SyncLogController } from "../controllers/syncLog.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { accessMiddleware } from "../middlewares/access.middleware";

const router = Router();
const controller = new SyncLogController();

router.post("/", accessMiddleware, authMiddleware, controller.create);
router.get("/", accessMiddleware, authMiddleware, controller.findAll);
router.get("/:id", accessMiddleware, authMiddleware, controller.findById);
router.delete("/:id", accessMiddleware, authMiddleware, controller.delete);

export default router;
