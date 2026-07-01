import { Router } from "express";
import { SessionController } from "../controllers/session.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";

const router = Router();
const controller = new SessionController();

router.post("/", authMiddleware, roleMiddleware(["ADMIN"]), controller.create);
router.get("/", authMiddleware, roleMiddleware(["ADMIN"]), controller.findAll);
router.get("/:id", authMiddleware, roleMiddleware(["ADMIN"]), controller.findById);
router.patch("/:id/revoke", authMiddleware, roleMiddleware(["ADMIN"]), controller.revoke);
router.delete("/:id", authMiddleware, roleMiddleware(["ADMIN"]), controller.delete);

export default router;
