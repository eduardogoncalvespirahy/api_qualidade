import { Router } from "express";
import { FormGroupsController } from "../controllers/formGroups.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";

const router = Router();
const controller = new FormGroupsController();

router.post("/", authMiddleware, roleMiddleware(['ADMIN','LIDER']), controller.create);
router.get("/", authMiddleware, roleMiddleware(['ADMIN','LIDER','INSPETOR']), controller.findAll);
router.get("/:id", authMiddleware, roleMiddleware(['ADMIN','LIDER','INSPETOR']), controller.findById);
router.put("/:id", authMiddleware, roleMiddleware(['ADMIN','LIDER']), controller.update);
router.delete("/:id", authMiddleware, roleMiddleware(['ADMIN','LIDER']), controller.delete);

export default router;
