import { FileRepository } from "../repositories/file.repository";
import {
  File,
  CreateFileDTO,
  UpdateFileDTO,
} from "../models/file.model";
import { PaginatedResult } from "../models/paginate.model";

export class FileService {
  private readonly repository: FileRepository;

  constructor() {
    this.repository = new FileRepository();
  }

  async create(dto: CreateFileDTO): Promise<File> {
    // nome é obrigatório
    if (!dto.nome) {
      throw new Error("O campo 'nome' é obrigatório");
    }

    return this.repository.create(dto);
  }

  async findAll(page?: number, limit?: number): Promise<PaginatedResult<File>> {
    return this.repository.findAll(page, limit);
  }

  async findById(id: string): Promise<File> {
    const item = await this.repository.findById(id);

    if (!item) {
      throw new Error("Arquivo não encontrado");
    }

    return item;
  }

  async update(id: string, dto: UpdateFileDTO): Promise<File> {
    await this.findById(id);

    const updated = await this.repository.update(id, dto);

    if (!updated) {
      throw new Error("Erro ao atualizar arquivo");
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);

    if (!deleted) {
      throw new Error("Arquivo não encontrado");
    }
  }
}
