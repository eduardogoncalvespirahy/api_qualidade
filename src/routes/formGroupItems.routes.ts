import { Router } from "express";
import { FormGroupItemsController } from "../controllers/formGroupItems.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";

const router = Router();
const controller = new FormGroupItemsController();

router.post("/", authMiddleware, roleMiddleware(['ADMIN','LIDER']), controller.create);
router.get("/", authMiddleware, roleMiddleware(['ADMIN','LIDER','INSPETOR']), controller.findAll);
router.get("/formGroup/:formGroupId/form/:formId", authMiddleware, roleMiddleware(['ADMIN','LIDER','INSPETOR']), controller.findById);
router.get("/formGroup/:formGroupId", authMiddleware, roleMiddleware(['ADMIN','LIDER','INSPETOR']), controller.findByFormGroupId);
router.get("/form/:formId", authMiddleware, roleMiddleware(['ADMIN','LIDER','INSPETOR']), controller.findByFormId);
router.put("/formGroup/:formGroupId/form/:formId", authMiddleware, roleMiddleware(['ADMIN','LIDER']), controller.update);
router.delete("/formGroup/:formGroupId/form/:formId", authMiddleware, roleMiddleware(['ADMIN','LIDER']), controller.delete);

export default router;
