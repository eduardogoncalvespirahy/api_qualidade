import { Router } from "express";
import { BreakMachineController } from "../controllers/breakMachine.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { accessMiddleware } from "../middlewares/access.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";

const router = Router();
const controller = new BreakMachineController();

router.post(
  "/",
  accessMiddleware,
  authMiddleware,
  roleMiddleware(["admin"]),
  controller.create,
);

router.get("/", accessMiddleware, authMiddleware, controller.findAll);

router.get(
  "/machine/:machineId",
  accessMiddleware,
  authMiddleware,
  controller.findByMachineId,
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
