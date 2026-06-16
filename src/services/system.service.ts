import { SystemRepository } from "../repositories/system.repository";
import {
  System,
  CreateSystemDTO,
  UpdateSystemDTO
} from "../models/system.model";
import { PaginatedResult } from "../models/paginate.model";

export class SystemService {
  private readonly repository: SystemRepository;

  constructor() {
    this.repository = new SystemRepository();
  }

  async create(dto: CreateSystemDTO): Promise<System> {
    if (!dto.nome) {
      throw new Error("O campo 'nome' é obrigatório");
    }
    return this.repository.create(dto);
  }

  async findAll(
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResult<System>> {
    return this.repository.findAll(page, limit);
  }

  async findById(id: string): Promise<System> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new Error("System não encontrado");
    }
    return item;
  }

  async update(id: string, dto: UpdateSystemDTO): Promise<System> {
    await this.findById(id);
    const updated = await this.repository.update(id, dto);
    if (!updated) {
      throw new Error("Erro ao atualizar System");
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new Error("System não encontrado");
    }
  }
}
