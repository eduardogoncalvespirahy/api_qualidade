import { Router } from "express";
import { EmployeeController } from "../controllers/employee.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { accessMiddleware } from "../middlewares/access.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";

const router = Router();
const controller = new EmployeeController();

router.post("/", accessMiddleware, authMiddleware, roleMiddleware(['admin']), controller.create);
router.get("/", accessMiddleware, authMiddleware, controller.findAll);
router.get("/:id", accessMiddleware, authMiddleware, controller.findById);
router.get("/:registerNumber", accessMiddleware, authMiddleware, controller.findByRegisterNumber);
router.put("/:id", accessMiddleware, authMiddleware, roleMiddleware(['admin']), controller.update);
router.delete("/:id", accessMiddleware, authMiddleware, roleMiddleware(['admin']), controller.delete);

export default router;
