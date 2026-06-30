import { Router } from "express";
import multer from "multer";
import { SignatureFileController } from "../controllers/signatureFile.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { accessMiddleware } from "../middlewares/access.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";

// multer na memória igual o face, não salva em disco
const upload = multer({ storage: multer.memoryStorage() });

const router = Router();
const controller = new SignatureFileController();

// aceita upload de arquivo ou JSON puro
router.post(   "/",    authMiddleware, accessMiddleware, roleMiddleware(["admin"]), upload.single("file"), controller.create);
router.get(    "/",    authMiddleware, accessMiddleware, controller.findAll);
router.get(    "/:id", authMiddleware, accessMiddleware, controller.findById);
router.put(    "/:id", authMiddleware, accessMiddleware, roleMiddleware(["admin"]), controller.update);
router.delete( "/:id", authMiddleware, accessMiddleware, roleMiddleware(["admin"]), controller.delete);

export default router;
