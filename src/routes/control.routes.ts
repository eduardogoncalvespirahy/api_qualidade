import { Router } from "express";
import { ControlController } from "../controllers/control.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { accessMiddleware } from "../middlewares/access.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";

const router = Router();
const controller = new ControlController();

router.post(
  "/",
  accessMiddleware,
  authMiddleware,
  roleMiddleware(["admin"]),
  controller.create,
);

router.get("/", accessMiddleware, authMiddleware, controller.findAll);

router.get(
  "/form/:formId",
  accessMiddleware,
  authMiddleware,
  controller.findByFormId,
);

router.get(
  "/user/:userId",
  accessMiddleware,
  authMiddleware,
  controller.findByUserId,
);

router.get("/:id", accessMiddleware, authMiddleware, controller.findById);

router.put(
  "/:id",
  accessMiddleware,
  authMiddleware,
  roleMiddleware(["admin"]),
  controller.update,
);

router.delete(
  "/:id",
  accessMiddleware,
  authMiddleware,
  roleMiddleware(["admin"]),
  controller.delete,
);

export default router;
