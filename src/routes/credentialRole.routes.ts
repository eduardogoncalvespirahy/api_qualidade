import { Router } from "express";
import { CredentialRoleController } from "../controllers/credentialRole.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { accessMiddleware } from "../middlewares/access.middleware";

const router = Router();
const controller = new CredentialRoleController();

router.post("/", accessMiddleware, authMiddleware, controller.create);
router.get("/:credentialId", accessMiddleware, authMiddleware, controller.findByCredential);
router.delete("/:credentialId/:roleId", accessMiddleware, authMiddleware, controller.delete);

export default router;
