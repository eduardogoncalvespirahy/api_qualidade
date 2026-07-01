import { Request, Response } from "express";
import { CredentialRoleService } from "../services/credentialRole.service";

export class CredentialRoleController {
  private readonly service: CredentialRoleService;

  constructor() {
    this.service = new CredentialRoleService();
  }

  create = async (req: Request, res: Response): Promise<Response> => {
    try {
      const item = await this.service.create(req.body);
      return res.status(201).json(item);
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error ? error.message : "Erro ao vincular role",
      });
    }
  };

  findByCredential = async (req: Request, res: Response): Promise<Response> => {
    try {
      const credentialId = req.params.credentialId as string;
      const items = await this.service.findByCredential(credentialId);
      return res.status(200).json(items);
    } catch (error) {
      return res.status(500).json({
        message:
          error instanceof Error ? error.message : "Erro ao listar vínculos",
      });
    }
  };

  findRoleNamesByCredential = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
    try {
      const credentialId = req.params.credentialId as string;
      const roleNames =
        await this.service.findRoleNamesByCredential(credentialId);
      return res.status(200).json(roleNames);
    } catch (error) {
      return res.status(500).json({
        message:
          error instanceof Error ? error.message : "Erro ao listar vínculos",
      });
    }
  };

  delete = async (req: Request, res: Response): Promise<Response> => {
    try {
      const credentialId = req.params.credentialId as string;
      const roleId = req.params.roleId as string;
      await this.service.delete(credentialId, roleId);
      return res.status(204).send();
    } catch (error) {
      return res.status(404).json({
        message:
          error instanceof Error ? error.message : "Vínculo não encontrado",
      });
    }
  };
}
