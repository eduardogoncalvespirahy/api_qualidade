import { Router } from "express";
import { SyncLogController } from "../controllers/syncLog.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";

const router = Router();
const controller = new SyncLogController();

router.post("/", authMiddleware, roleMiddleware(["ADMIN"]), controller.create);
router.get("/", authMiddleware, roleMiddleware(["ADMIN"]), controller.findAll);
router.get("/:id", authMiddleware, roleMiddleware(["ADMIN"]), controller.findById);
router.delete("/:id", authMiddleware, roleMiddleware(["ADMIN"]), controller.delete);

export default router;
