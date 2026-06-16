import { Request, Response } from "express";
import { EmployeeService } from "../services/employee.service";

export class EmployeeController {
  private readonly service: EmployeeService;

  constructor() {
    this.service = new EmployeeService();
  }

  create = async (req: Request, res: Response): Promise<Response> => {
    try {
      const item = await this.service.create(req.body);
      return res.status(201).json(item);
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : "Erro ao criar Employee",
      });
    }
  };

  findAll = async (req: Request, res: Response): Promise<Response> => {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
      const result = await this.service.findAll(page, limit);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        message: error instanceof Error ? error.message : "Erro ao listar registros",
      });
    }
  };

  findById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = req.params.id as string;
      const item = await this.service.findById(id);
      return res.status(200).json(item);
    } catch (error) {
      return res.status(404).json({
        message: error instanceof Error ? error.message : "Employee não encontrado",
      });
    }
  };

  findByRegisterNumber = async (req: Request, res: Response): Promise<Response> => {
    try {
      const registerNumber = req.params.registerNumber as string;
      const item = await this.service.findByRegisterNumber(registerNumber);
      return res.status(200).json(item);
    } catch (error) {
      return res.status(404).json({
        message: error instanceof Error ? error.message : "Employee não encontrado",
      });
    }
  };  

  update = async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = req.params.id as string;
      const item = await this.service.update(id, req.body);
      return res.status(200).json(item);
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : "Erro ao atualizar registro",
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
        message: error instanceof Error ? error.message : "Employee não encontrado",
      });
    }
  };
}
