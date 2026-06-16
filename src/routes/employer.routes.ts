import { Router } from "express";
import { EmployerController } from "../controllers/employer.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { accessMiddleware } from "../middlewares/access.middleware";

const router = Router();
const controller = new EmployerController();

router.post("/", accessMiddleware, authMiddleware, controller.create);
router.get("/", accessMiddleware, controller.findAll);
router.get("/:id", accessMiddleware, controller.findById);
router.put("/:id", accessMiddleware, authMiddleware, controller.update);
router.delete("/:id", accessMiddleware, authMiddleware, controller.delete);

export default router;
