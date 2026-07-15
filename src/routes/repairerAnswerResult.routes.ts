import { Router } from "express";
import { RepairerAnswerResultController } from "../controllers/repairerAnswerResult.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";

const router = Router();
const controller = new RepairerAnswerResultController();

router.post("/", authMiddleware, roleMiddleware(["ADMIN", "LIDER", "INSPETOR"]), controller.create);
router.get("/", authMiddleware, roleMiddleware(["ADMIN", "LIDER", "INSPETOR"]), controller.findAll);
router.get("/:answerResultId/:userId", authMiddleware, roleMiddleware(["ADMIN", "LIDER", "INSPETOR"]), controller.findById);
router.get("/answerResultId/:answerResultId", authMiddleware, roleMiddleware(["ADMIN", "LIDER", "INSPETOR"]), controller.findByAnswerResultId);
router.get("/userId/:userId", authMiddleware, roleMiddleware(["ADMIN", "LIDER", "INSPETOR"]), controller.findByUserId);
router.put("/:answerResultId/:userId", authMiddleware, roleMiddleware(["ADMIN", "LIDER", "INSPETOR"]), controller.update);
router.delete("/:answerResultId/:userId", authMiddleware, roleMiddleware(["ADMIN", "LIDER"]), controller.delete);

export default router;
