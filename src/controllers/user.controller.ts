import { Request, Response } from "express";
import { UserService } from "../services/user.service";

export class UserController {
  private readonly service: UserService;

  constructor() {
    this.service = new UserService();
  }

  create = async (req: Request, res: Response): Promise<Response> => {
    try {
      const user = await this.service.create(req.body);
      return res.status(201).json(user);
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error ? error.message : "Erro ao criar usuário",
      });
    }
  };

  findAll = async (req: Request, res: Response): Promise<Response> => {
    try {
      const page = Number(req.query.page) || undefined;
      const limit = Number(req.query.limit) || undefined;
      const users = await this.service.findAll(page, limit);
      return res.status(200).json(users);
    } catch (error) {
      return res.status(500).json({
        message:
          error instanceof Error ? error.message : "Erro ao listar usuários",
      });
    }
  };

  findAllUserProfile = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
    try {
      const page = Number(req.query.page) || undefined;
      const limit = Number(req.query.limit) || undefined;
      const users = await this.service.findAllUserProfile(page, limit);
      return res.status(200).json(users);
    } catch (error) {
      return res.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : "Erro ao listar perfil de usuários",
      });
    }
  };

  findById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = req.params.id as string;
      const user = await this.service.findById(id);
      return res.status(200).json(user);
    } catch (error) {
      return res.status(404).json({
        message:
          error instanceof Error ? error.message : "Usuário não encontrado",
      });
    }
  };

  findByIdUserProfile = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
    try {
      const id = req.params.id as string;
      const user = await this.service.findByIdUserProfile(id);
      return res.status(200).json(user);
    } catch (error) {
      return res.status(404).json({
        message:
          error instanceof Error ? error.message : "Usuário não encontrado",
      });
    }
  };

  findByRegisterNumber = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
    try {
      const rawRegisterNumber = req.params.registerNumber;

      if (Array.isArray(rawRegisterNumber)) {
        return res.status(400).json({ message: "Número de registro inválido" });
      }

      const registerNumber = Number(rawRegisterNumber);

      if (!Number.isInteger(registerNumber)) {
        return res.status(400).json({ message: "Número de registro inválido" });
      }

      const user = await this.service.findByRegisterNumber(registerNumber);
      return res.status(200).json(user);
    } catch (error) {
      return res.status(404).json({
        message:
          error instanceof Error ? error.message : "Usuário não encontrado",
      });
    }
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = req.params.id as string;
      const user = await this.service.update(id, req.body);
      return res.status(200).json(user);
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error ? error.message : "Erro ao atualizar usuário",
      });
    }
  };

  delete = async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = req.params.id as string;
      await this.service.delete(id);
      return res.status(204).send();
    } catch (error) {
      return res.status(404).json({
        message:
          error instanceof Error ? error.message : "Usuário não encontrado",
      });
    }
  };
}
