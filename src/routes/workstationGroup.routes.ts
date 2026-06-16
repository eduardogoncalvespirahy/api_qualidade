import { Router } from "express";
import { WorkstationGroupController } from "../controllers/workstationGroup.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { accessMiddleware } from "../middlewares/access.middleware";

const router = Router();
const controller = new WorkstationGroupController();

router.post("/", accessMiddleware, authMiddleware, controller.create);
router.get("/", accessMiddleware, authMiddleware, controller.findAll);
router.get("/:id", accessMiddleware, authMiddleware, controller.findById);
router.put("/:id", accessMiddleware, authMiddleware, controller.update);
router.delete("/:id", accessMiddleware, authMiddleware, controller.delete);

export default router;
