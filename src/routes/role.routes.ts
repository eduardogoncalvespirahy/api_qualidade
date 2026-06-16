import { Router } from "express";
import { RoleController } from "../controllers/role.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { accessMiddleware } from "../middlewares/access.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";

const router = Router();
const controller = new RoleController();

router.post("/", accessMiddleware, authMiddleware, roleMiddleware(['admin']), controller.create);
router.get("/", accessMiddleware, authMiddleware, controller.findAll);
router.get("/:id", accessMiddleware, authMiddleware, controller.findById);
router.put("/:id", accessMiddleware, authMiddleware, roleMiddleware(['admin']), controller.update);
router.delete("/:id", accessMiddleware, authMiddleware, roleMiddleware(['admin']), controller.delete);

export default router;
