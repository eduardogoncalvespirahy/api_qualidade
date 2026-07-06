import { StatusRepository } from "../repositories/status.repository";
import {
  Status,
  CreateStatusDTO,
  UpdateStatusDTO,
} from "../models/status.model";
import { PaginatedResult } from "../models/paginate.model";

export class StatusService {
  private readonly repository: StatusRepository;

  constructor() {
    this.repository = new StatusRepository();
  }

  async create(dto: CreateStatusDTO): Promise<Status> {
    if (!dto.nome.trim()) {
      throw new Error("O campo 'nome' é obrigatório");
    }
    return this.repository.create(dto);
  }

  async findAll(
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<Status>> {
    return this.repository.findAll(page, limit);
  }

  async findById(id: string): Promise<Status> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new Error("Status não encontrado");
    }
    return item;
  }

  async update(id: string, dto: UpdateStatusDTO): Promise<Status> {
    await this.findById(id);
    const updated = await this.repository.update(id, dto);
    if (!updated) {
      throw new Error("Erro ao atualizar Status");
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new Error("Status não encontrado");
    }
  }
}
