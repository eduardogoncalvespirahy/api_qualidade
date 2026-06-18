import { WorkshiftRepository } from "../repositories/workshift.repository";
import {
  Workshift,
  CreateWorkshiftDTO,
  UpdateWorkshiftDTO
} from "../models/workshift.model";
import { PaginatedResult } from "../models/paginate.model";

export class WorkshiftService {
  private readonly repository: WorkshiftRepository;

  constructor() {
    this.repository = new WorkshiftRepository();
  }

  async create(dto: CreateWorkshiftDTO): Promise<Workshift> {
    if (!dto.id) {
      throw new Error("O campo 'id' é obrigatório");
    }
    return this.repository.create(dto);
  }

  async findAll(
    page?: number,
    limit?: number
  ): Promise<PaginatedResult<Workshift>> {
    return this.repository.findAll(page, limit);
  }

  async findById(id: string): Promise<Workshift> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new Error("Workshift não encontrado");
    }
    return item;
  }

  async update(id: string, dto: UpdateWorkshiftDTO): Promise<Workshift> {
    await this.findById(id);
    const updated = await this.repository.update(id, dto);
    if (!updated) {
      throw new Error("Erro ao atualizar Workshift");
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new Error("Workshift não encontrado");
    }
  }
}
