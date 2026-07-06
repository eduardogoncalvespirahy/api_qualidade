import { Router } from "express";
import { AnswerResultController } from "../controllers/answerResult.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";

const router = Router();
const controller = new AnswerResultController();

router.post("/", authMiddleware, roleMiddleware(["ADMIN", "LIDER", "INSPETOR"]), controller.create);
router.get("/", authMiddleware, roleMiddleware(["ADMIN", "LIDER", "INSPETOR"]), controller.findAll);
router.get("/control/:controlId", authMiddleware, roleMiddleware(["ADMIN", "LIDER", "INSPETOR"]), controller.findControlIdAll);
router.get("/answer/:answerId", authMiddleware, roleMiddleware(["ADMIN", "LIDER", "INSPETOR"]), controller.findByAnswerId);
router.get("/:id", authMiddleware, roleMiddleware(["ADMIN", "LIDER", "INSPETOR"]), controller.findById);
router.delete("/:id",authMiddleware, roleMiddleware(["ADMIN", "LIDER"]), controller.delete);

export default router;
