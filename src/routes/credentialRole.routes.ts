import { Router } from "express";
import { CredentialRoleController } from "../controllers/credentialRole.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";

const router = Router();
const controller = new CredentialRoleController();

router.post("/", authMiddleware, roleMiddleware(["ADMIN"]), controller.create);
router.get("/:credentialId", authMiddleware, roleMiddleware(["ADMIN", "LIDER", "INSPETOR"]), controller.findByCredential);
router.get("/roles/credential/:credentialId", authMiddleware, roleMiddleware(["ADMIN", "LIDER", "INSPETOR"]), controller.findRoleNamesByCredential);
router.delete("/:credentialId/:roleId", authMiddleware, roleMiddleware(["ADMIN"]), controller.delete);

export default router;
