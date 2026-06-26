import { Router } from "express";
import { FaceAuthController } from "../controllers/faceAuth.controller";
import { FaceController } from "../controllers/face.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import multer from 'multer';

// Configura o multer para salvar a imagem na memória (cria o buffer)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = Router();
const faceAuth = new FaceAuthController();
const face = new FaceController();

// login por reconhecimento facial (público)
router.post("/auth/face", faceAuth.login);

// cadastro do rosto do usuário (protegido) — via foto do Senior ou imagem
router.post("/face/enroll/:userId", upload.single('file'), face.enroll);

export default router;
