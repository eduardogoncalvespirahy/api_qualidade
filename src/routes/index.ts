import express from "express";

import authRoutes from "./auth.routes";
import usersRoutes from "./user.routes";

// Domínio de qualidade
import systemRoutes from "./system.routes";
import roleRoutes from "./role.routes";
import sectionRoutes from "./section.routes";
import formRoutes from "./form.routes";
import locationRoutes from "./location.routes";
import answerRoutes from "./answer.routes";
import machineRoutes from "./machine.routes";

// Autenticação / autorização
import credentialRoutes from "./credential.routes";
import credentialRoleRoutes from "./credentialRole.routes";
import sessionRoutes from "./session.routes";

// Tabelas de catálogo / lookup (Senior)
import employeeRoutes from "./employee.routes";
import employerRoutes from "./employer.routes";
import departmentRoutes from "./department.routes";
import jobPositionRoutes from "./jobPosition.routes";
import costCenterRoutes from "./costCenter.routes";
import workshiftRoutes from "./workshift.routes";
import workstationGroupRoutes from "./workstationGroup.routes";
import syncLogRoutes from "./syncLog.routes";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);

router.use("/systems", systemRoutes);
router.use("/roles", roleRoutes);
router.use("/sections", sectionRoutes);
router.use("/forms", formRoutes);
router.use("/locations", locationRoutes);
router.use("/answers", answerRoutes);
router.use("/machines", machineRoutes);

router.use("/credentials", credentialRoutes);
router.use("/credentials-roles", credentialRoleRoutes);
router.use("/sessions", sessionRoutes);

router.use("/employees", employeeRoutes);
router.use("/employers", employerRoutes);
router.use("/departments", departmentRoutes);
router.use("/job-positions", jobPositionRoutes);
router.use("/cost-centers", costCenterRoutes);
router.use("/workshifts", workshiftRoutes);
router.use("/workstation-groups", workstationGroupRoutes);
router.use("/sync-logs", syncLogRoutes);

export default router;
