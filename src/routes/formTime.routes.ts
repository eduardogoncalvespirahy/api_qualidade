import { Router } from "express";
import { FormTimeController } from "../controllers/formTime.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";

const router = Router();
const controller = new FormTimeController();

router.post("/", authMiddleware, roleMiddleware(["ADMIN", "LIDER"]), controller.create);
router.get("/", authMiddleware, roleMiddleware(["ADMIN", "LIDER", "INSPETOR"]), controller.findAll);
router.get("/:formId", authMiddleware, roleMiddleware(["ADMIN", "LIDER", "INSPETOR"]), controller.findByformId);
router.put("/:formId", authMiddleware, roleMiddleware(["ADMIN", "LIDER"]), controller.update);
router.delete("/:formId", authMiddleware, roleMiddleware(["ADMIN", "LIDER"]), controller.delete);

export default router;
