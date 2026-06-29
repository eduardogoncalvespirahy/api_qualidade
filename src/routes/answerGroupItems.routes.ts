import { Router } from "express";
import { AnswerGroupItemsController } from "../controllers/answerGroupItems.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { accessMiddleware } from "../middlewares/access.middleware";

const router = Router();
const controller = new AnswerGroupItemsController();

router.post("/", accessMiddleware, authMiddleware, controller.create);
router.get("/", accessMiddleware, controller.findAll);
router.get("/answerGroup/:answerGroupId/answer/:answerId", accessMiddleware, controller.findById);
router.get("/answerGroup/:answerGroupId", accessMiddleware, controller.findByAnswerGroupId);
router.get("/answer/:answerId", accessMiddleware, controller.findByAnswerId);
router.put("/answerGroup/:answerGroupId/answer/:answerId", accessMiddleware, authMiddleware, controller.update);
router.delete("/answerGroup/:answerGroupId/answer/:answerId", accessMiddleware, authMiddleware, controller.delete);

export default router;
