import { Router } from "express";
import { EmployeeController } from "../controllers/employee.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";

const router = Router();
const controller = new EmployeeController();

router.post("/", authMiddleware, roleMiddleware(["ADMIN"]), controller.create);
router.get("/", authMiddleware, roleMiddleware(["ADMIN", "LIDER", "INSPETOR"]), controller.findAll);
router.get("/:id", authMiddleware, roleMiddleware(["ADMIN", "LIDER", "INSPETOR"]), controller.findById);
router.get("/:registerNumber", authMiddleware, roleMiddleware(["ADMIN", "LIDER", "INSPETOR"]), controller.findByRegisterNumber);
router.put("/:id", authMiddleware, roleMiddleware(["ADMIN"]), controller.update);
router.delete("/:id", authMiddleware, roleMiddleware(["ADMIN"]), controller.delete);

export default router;
