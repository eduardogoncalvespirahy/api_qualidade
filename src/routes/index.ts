import express from "express";

import authRoutes from "./auth.routes";
import usersRoutes from "./user.routes";
import systemRoutes from "./system.routes";
import roleRoutes from "./role.routes";
import locationRoutes from "./location.routes";
import credentialRoutes from "./credential.routes";
import credentialRoleRoutes from "./credentialRole.routes";
import credentialLocationRoutes from "./credentialLocation.routes";
import sessionRoutes from "./session.routes";
import FileRoutes from "./file.routes";

import employeeRoutes from "./employee.routes";
import employerRoutes from "./employer.routes";
import departmentRoutes from "./department.routes";
import jobPositionRoutes from "./jobPosition.routes";
import costCenterRoutes from "./costCenter.routes";
import workshiftRoutes from "./workshift.routes";
import workstationGroupRoutes from "./workstationGroup.routes";
import syncLogRoutes from "./syncLog.routes";

import sectionRoutes from "./section.routes";
import formRoutes from "./form.routes";
import answerRoutes from "./answer.routes";
import machineRoutes from "./machine.routes";
import controlRoutes from "./control.routes";
import statusRoutes from "./status.routes";
import controlStatusRoutes from "./controlStatus.routes";
import formGroupsRoutes from "./formGroups.routes";
import formGroupItemsRoutes from "./formGroupItems.routes";
import answerGroupsRoutes from "./answerGroups.routes";
import answerGroupItemsRoutes from "./answerGroupItems.routes";
import answerResultRoutes from "./answerResult.routes";
import breakFormRoutes from "./breakForm.routes";
import breakMachineRoutes from "./breakMachine.routes";
import categorieAnswerRoutes from "./categorieAnswer.routes";
import limitAnswerRoutes from "./limitAnswer.routes";
import machineAnswerRoutes from "./machineAnswer.routes";
import machineAnswerResultRoutes from "./machineAnswerResult.routes";
import formTimeRoutes from "./formTime.routes";
import formDraftRoutes from "./formDraft.routes";
import repairerAnswerResultRoutes from "./repairerAnswerResult.routes";
import repairerMachineAnswerResultRoutes from "./repairerMachineAnswerResult.routes";

const router = express.Router();

//___________________UNICO___________________
router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/systems", systemRoutes);
router.use("/roles", roleRoutes);
router.use("/locations", locationRoutes);
router.use("/credentials", credentialRoutes);
router.use("/credentials-roles", credentialRoleRoutes);
router.use("/credentials-locations", credentialLocationRoutes);
router.use("/sessions", sessionRoutes);
router.use("/files", FileRoutes);

//----------------Senior----------------
router.use("/employees", employeeRoutes);
router.use("/employers", employerRoutes);
router.use("/departments", departmentRoutes);
router.use("/job-positions", jobPositionRoutes);
router.use("/cost-centers", costCenterRoutes);
router.use("/workshifts", workshiftRoutes);
router.use("/workstation-groups", workstationGroupRoutes);
router.use("/sync-logs", syncLogRoutes);

//___________________QUALIDADE___________________
router.use("/sections", sectionRoutes);
router.use("/forms", formRoutes);
router.use("/answers", answerRoutes);
router.use("/machines", machineRoutes);
router.use("/controls", controlRoutes);
router.use("/status", statusRoutes);
router.use("/control-status", controlStatusRoutes);
router.use("/form-groups", formGroupsRoutes);
router.use("/form-group-items", formGroupItemsRoutes);
router.use("/answer-groups", answerGroupsRoutes);
router.use("/answer-group-items", answerGroupItemsRoutes);
router.use("/answer-result", answerResultRoutes);
router.use("/breaks-forms", breakFormRoutes);
router.use("/breaks-machines", breakMachineRoutes);
router.use("/categories-answers", categorieAnswerRoutes);
router.use("/limits-answers", limitAnswerRoutes);
router.use("/machine-answers", machineAnswerRoutes);
router.use("/machine-answer-result", machineAnswerResultRoutes);
router.use("/form-time", formTimeRoutes);
router.use("/form-drafts", formDraftRoutes);
router.use("/repairer-answer-result", repairerAnswerResultRoutes);
router.use("/repairer-machine-answer-result", repairerMachineAnswerResultRoutes);

export default router;
