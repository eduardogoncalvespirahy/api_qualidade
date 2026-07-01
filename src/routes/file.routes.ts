import { Router } from "express";
import multer from "multer";
import { FileController } from "../controllers/file.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";

// multer na memória igual o face, não salva em disco
const upload = multer({ storage: multer.memoryStorage() });

const router = Router();
const controller = new FileController();

// aceita upload de arquivo ou JSON puro
router.post("/", authMiddleware, roleMiddleware(["ADMIN", "LIDER", "INSPETOR"]), upload.single("file"), controller.create);
router.get("/", authMiddleware, roleMiddleware(["ADMIN", "LIDER", "INSPETOR"]), controller.findAll);
router.get("/:id", authMiddleware, roleMiddleware(["ADMIN", "LIDER", "INSPETOR"]), controller.findById);
router.put("/:id", authMiddleware, roleMiddleware(["ADMIN"]), controller.update);
router.delete("/:id", authMiddleware, roleMiddleware(["ADMIN"]), controller.delete);

export default router;
