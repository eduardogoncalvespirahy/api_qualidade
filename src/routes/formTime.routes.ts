import { Router } from "express";
import { FormTimeController } from "../controllers/formTime.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { accessMiddleware } from "../middlewares/access.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";

const router = Router();
const controller = new FormTimeController();

router.post(   "/",    authMiddleware, accessMiddleware, roleMiddleware(["admin"]), controller.create);
router.get(    "/",    authMiddleware, accessMiddleware, controller.findAll);
router.get(    "/:id", authMiddleware, accessMiddleware, controller.findById);
router.put(    "/:id", authMiddleware, accessMiddleware, roleMiddleware(["admin"]), controller.update);
router.delete( "/:id", authMiddleware, accessMiddleware, roleMiddleware(["admin"]), controller.delete);

export default router;
