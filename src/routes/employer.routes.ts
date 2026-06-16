import { Router } from "express";
import { EmployerController } from "../controllers/employer.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { accessMiddleware } from "../middlewares/access.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";

const router = Router();
const controller = new EmployerController();

router.post("/", accessMiddleware, authMiddleware, roleMiddleware(['admin']), controller.create);
router.get("/", accessMiddleware, controller.findAll);
router.get("/:id", accessMiddleware, controller.findById);
router.put("/:id", accessMiddleware, authMiddleware, roleMiddleware(['admin']), controller.update);
router.delete("/:id", accessMiddleware, authMiddleware, roleMiddleware(['admin']), controller.delete);

export default router;
