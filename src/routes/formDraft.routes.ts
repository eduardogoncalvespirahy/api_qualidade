import { Router } from "express";
import { FormDraftController } from "../controllers/formDraft.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";

const router = Router();
const controller = new FormDraftController();

router.post("/", authMiddleware, roleMiddleware(['ADMIN','LIDER','INSPETOR']), controller.create);
router.get("/", authMiddleware, roleMiddleware(['ADMIN','LIDER','INSPETOR']), controller.findAll);
router.get("/:id", authMiddleware, roleMiddleware(['ADMIN','LIDER','INSPETOR']), controller.findById);
router.put("/:id", authMiddleware, roleMiddleware(['ADMIN','LIDER', 'INSPETOR']), controller.update);
router.delete("/:id", authMiddleware, roleMiddleware(['ADMIN','LIDER', 'INSPETOR']), controller.delete);

export default router;
