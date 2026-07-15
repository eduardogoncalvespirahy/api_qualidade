import { Router } from "express";
import { RepairerMachineAnswerResultController } from "../controllers/repairerMachineAnswerResult.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";

const router = Router();
const controller = new RepairerMachineAnswerResultController();

router.post("/", authMiddleware, roleMiddleware(["ADMIN", "LIDER", "INSPETOR"]), controller.create);
router.get("/", authMiddleware, roleMiddleware(["ADMIN", "LIDER", "INSPETOR"]), controller.findAll);
router.get("/:machineAnswerResultId/:userId", authMiddleware, roleMiddleware(["ADMIN", "LIDER", "INSPETOR"]), controller.findById);
router.get("/machineAnswerResultId/:machineAnswerResultId", authMiddleware, roleMiddleware(["ADMIN", "LIDER", "INSPETOR"]), controller.findByMachineAnswerResultId);
router.get("/userId/:userId", authMiddleware, roleMiddleware(["ADMIN", "LIDER", "INSPETOR"]), controller.findByUserId);
router.put("/:machineAnswerResultId/:userId", authMiddleware, roleMiddleware(["ADMIN", "LIDER", "INSPETOR"]), controller.update);
router.delete("/:machineAnswerResultId/:userId", authMiddleware, roleMiddleware(["ADMIN", "LIDER"]), controller.delete);

export default router;
