import { Router } from "express";
import { CredentialLocationController } from "../controllers/credentialLocation.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";

const router = Router();
const controller = new CredentialLocationController();

router.post("/", authMiddleware, roleMiddleware(["ADMIN"]), controller.create);
router.get("/:credentialId", authMiddleware, roleMiddleware(["ADMIN", "LIDER", "INSPETOR"]), controller.findByCredential);
router.get("/locations/credential/:credentialId", authMiddleware, roleMiddleware(["ADMIN", "LIDER", "INSPETOR"]), controller.findLocationNamesByCredential);
router.delete("/:credentialId/:locationId", authMiddleware, roleMiddleware(["ADMIN"]), controller.delete);

export default router;
