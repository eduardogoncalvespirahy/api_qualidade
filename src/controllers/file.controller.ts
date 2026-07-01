import { Request, Response } from "express";
import { FileService } from "../services/file.service";
import { CreateFileDTO } from "../models/file.model";

export class FileController {
  private readonly service: FileService;

  constructor() {
    this.service = new FileService();
  }

  // POST /files — recebe o arquivo via multer e monta o DTO
  create = async (req: Request, res: Response): Promise<Response> => {
    try {
      const dto: CreateFileDTO = {
        // se veio arquivo pelo multer, usa os dados dele; senão usa o body
        nome: req.file?.originalname ?? req.body.nome,
        nomeOriginal: req.file?.originalname ?? req.body.nomeOriginal,
        extensao: req.file?.originalname?.split(".").pop() ?? req.body.extensao,
        mimeType: req.file?.mimetype ?? req.body.mimeType,
        tamanho: req.file?.size ?? req.body.tamanho,
        // guarda o conteudo em base64 se veio buffer, senão usa o que virou do body
        conteudo: req.file?.buffer
          ? req.file.buffer.toString("base64")
          : req.body.conteudo,
        hash: req.body.hash,
        status: req.body.status,
      };

      const item = await this.service.create(dto);
      return res.status(201).json(item);
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error ? error.message : "Erro ao criar arquivo",
      });
    }
  };

  findAll = async (req: Request, res: Response): Promise<Response> => {
    try {
      const page = Number(req.query.page) || undefined;
      const limit = Number(req.query.limit) || undefined;

      const result = await this.service.findAll(page, limit);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        message:
          error instanceof Error ? error.message : "Erro ao listar arquivos",
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
        message:
          error instanceof Error ? error.message : "Arquivo não encontrado",
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
        message:
          error instanceof Error ? error.message : "Erro ao atualizar arquivo",
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
          error instanceof Error ? error.message : "Arquivo não encontrado",
      });
    }
  };
}
