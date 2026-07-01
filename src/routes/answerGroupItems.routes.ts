import { Router } from "express";
import { AnswerGroupItemsController } from "../controllers/answerGroupItems.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";

const router = Router();
const controller = new AnswerGroupItemsController();

router.post("/", authMiddleware, roleMiddleware(['ADMIN','LIDER']), controller.create);
router.get("/", authMiddleware, roleMiddleware(['ADMIN','LIDER','INSPETOR']), controller.findAll);
router.get("/answerGroup/:answerGroupId/answer/:answerId", authMiddleware, roleMiddleware(['ADMIN','LIDER','INSPETOR']), controller.findById);
router.get("/answerGroup/:answerGroupId", authMiddleware, roleMiddleware(['ADMIN','LIDER','INSPETOR']), controller.findByAnswerGroupId);
router.get("/answer/:answerId", authMiddleware, roleMiddleware(['ADMIN','LIDER','INSPETOR']), controller.findByAnswerId);
router.put("/answerGroup/:answerGroupId/answer/:answerId", authMiddleware, roleMiddleware(['ADMIN','LIDER']), controller.update);
router.delete("/answerGroup/:answerGroupId/answer/:answerId", authMiddleware, roleMiddleware(['ADMIN','LIDER']), controller.delete);

export default router;
