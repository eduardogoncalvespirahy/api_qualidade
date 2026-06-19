import { Router } from "express";
import { AnswerResultController } from "../controllers/answerResult.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { accessMiddleware } from "../middlewares/access.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";

const router = Router();
const controller = new AnswerResultController();

router.post(
  "/",
  accessMiddleware,
  authMiddleware,
  roleMiddleware(["admin"]),
  controller.create,
);

router.get("/", accessMiddleware, authMiddleware, controller.findAll);

router.get(
  "/answer/:answerId",
  accessMiddleware,
  authMiddleware,
  controller.findByAnswerId,
);

router.get("/:id", accessMiddleware, authMiddleware, controller.findById);

router.delete(
  "/:id",
  accessMiddleware,
  authMiddleware,
  roleMiddleware(["admin"]),
  controller.delete,
);

export default router;
