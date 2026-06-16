import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { accessMiddleware } from "../middlewares/access.middleware";

const router = Router();
const User = new UserController();

router.post("/", accessMiddleware, authMiddleware, User.create);
router.get("/", accessMiddleware, authMiddleware, User.findAll);
router.get("/:id", accessMiddleware, authMiddleware, User.findById);
router.put("/:id", accessMiddleware, authMiddleware, User.update);
router.delete("/:id", accessMiddleware, authMiddleware, User.delete);

export default router;
