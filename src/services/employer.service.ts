import { EmployerRepository } from "../repositories/employer.repository";
import {
  Employer,
  CreateEmployerDTO,
  UpdateEmployerDTO
} from "../models/employer.model";
import { PaginatedResult } from "../models/paginate.model";

export class EmployerService {
  private readonly repository: EmployerRepository;

  constructor() {
    this.repository = new EmployerRepository();
  }

  async create(dto: CreateEmployerDTO): Promise<Employer> {
    if (!dto.id) {
      throw new Error("O campo 'id' é obrigatório");
    }
    return this.repository.create(dto);
  }

  async findAll(
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResult<Employer>> {
    return this.repository.findAll(page, limit);
  }

  async findById(id: string): Promise<Employer> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new Error("Employer não encontrado");
    }
    return item;
  }

  async update(id: string, dto: UpdateEmployerDTO): Promise<Employer> {
    await this.findById(id);
    const updated = await this.repository.update(id, dto);
    if (!updated) {
      throw new Error("Erro ao atualizar Employer");
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new Error("Employer não encontrado");
    }
  }
}
