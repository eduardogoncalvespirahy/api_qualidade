import { Router } from "express";
import { CredentialRoleController } from "../controllers/credentialRole.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { accessMiddleware } from "../middlewares/access.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";

const router = Router();
const controller = new CredentialRoleController();

router.post("/", accessMiddleware, authMiddleware, roleMiddleware(['admin']), controller.create);
router.get("/:credentialId", accessMiddleware, authMiddleware, controller.findByCredential);
router.get("/roles/credential/:credentialId", accessMiddleware, authMiddleware, controller.findRoleNamesByCredential);
router.delete("/:credentialId/:roleId", accessMiddleware, authMiddleware, roleMiddleware(['admin']), controller.delete);

export default router;
