import { Router } from "express";
import { FaceAuthController } from "../controllers/faceAuth.controller";
import { FaceController } from "../controllers/face.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();
const faceAuth = new FaceAuthController();
const face = new FaceController();

// login por reconhecimento facial (público)
router.post("/auth/face", faceAuth.login);

// cadastro do rosto do usuário (protegido) — via foto do Senior ou imagem
router.post("/face/enroll/:userId", face.enroll);

export default router;
