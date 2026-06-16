import { JobPositionRepository } from "../repositories/jobPosition.repository";
import {
  JobPosition,
  CreateJobPositionDTO,
  UpdateJobPositionDTO
} from "../models/jobPosition.model";
import { PaginatedResult } from "../models/paginate.model";

export class JobPositionService {
  private readonly repository: JobPositionRepository;

  constructor() {
    this.repository = new JobPositionRepository();
  }

  async create(dto: CreateJobPositionDTO): Promise<JobPosition> {
    if (!dto.id) {
      throw new Error("O campo 'id' é obrigatório");
    }
    return this.repository.create(dto);
  }

  async findAll(
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResult<JobPosition>> {
    return this.repository.findAll(page, limit);
  }

  async findById(id: string): Promise<JobPosition> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new Error("JobPosition não encontrado");
    }
    return item;
  }

  async update(id: string, dto: UpdateJobPositionDTO): Promise<JobPosition> {
    await this.findById(id);
    const updated = await this.repository.update(id, dto);
    if (!updated) {
      throw new Error("Erro ao atualizar JobPosition");
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new Error("JobPosition não encontrado");
    }
  }
}
