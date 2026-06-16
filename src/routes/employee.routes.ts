import { Router } from "express";
import { EmployeeController } from "../controllers/employee.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { accessMiddleware } from "../middlewares/access.middleware";

const router = Router();
const controller = new EmployeeController();

router.post("/", accessMiddleware, authMiddleware, controller.create);
router.get("/", accessMiddleware, authMiddleware, controller.findAll);
router.get("/:id", accessMiddleware, authMiddleware, controller.findById);
router.get("/:registerNumber", accessMiddleware, authMiddleware, controller.findByRegisterNumber);
router.put("/:id", accessMiddleware, authMiddleware, controller.update);
router.delete("/:id", accessMiddleware, authMiddleware, controller.delete);

export default router;
