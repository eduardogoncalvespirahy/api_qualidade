import { Router } from "express";
import { ControlStatusController } from "../controllers/controlStatus.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";

const router = Router();
const controller = new ControlStatusController();

router.post("/", authMiddleware, roleMiddleware(["ADMIN", "LIDER", "INSPETOR"]), controller.create);
router.get("/:controlId", authMiddleware, roleMiddleware(["ADMIN", "LIDER", "INSPETOR"]), controller.findByControl);
router.get("/status/control/:controlId", authMiddleware, roleMiddleware(["ADMIN", "LIDER", "INSPETOR"]), controller.findStatusNamesByControl);
router.put("/:controlId/:statusId", authMiddleware, roleMiddleware(["ADMIN", "LIDER", "INSPETOR"]), controller.update);
router.delete("/:controlId/:statusId", authMiddleware, roleMiddleware(["ADMIN"]), controller.delete);

export default router;
