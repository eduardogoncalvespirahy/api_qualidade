import { WorkstationGroupRepository } from "../repositories/workstationGroup.repository";
import {
  WorkstationGroup,
  CreateWorkstationGroupDTO,
  UpdateWorkstationGroupDTO
} from "../models/workstationGroup.model";
import { PaginatedResult } from "../models/paginate.model";

export class WorkstationGroupService {
  private readonly repository: WorkstationGroupRepository;

  constructor() {
    this.repository = new WorkstationGroupRepository();
  }

  async create(dto: CreateWorkstationGroupDTO): Promise<WorkstationGroup> {
    if (!dto.id) {
      throw new Error("O campo 'id' é obrigatório");
    }
    return this.repository.create(dto);
  }

  async findAll(
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResult<WorkstationGroup>> {
    return this.repository.findAll(page, limit);
  }

  async findById(id: string): Promise<WorkstationGroup> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new Error("WorkstationGroup não encontrado");
    }
    return item;
  }

  async update(id: string, dto: UpdateWorkstationGroupDTO): Promise<WorkstationGroup> {
    await this.findById(id);
    const updated = await this.repository.update(id, dto);
    if (!updated) {
      throw new Error("Erro ao atualizar WorkstationGroup");
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new Error("WorkstationGroup não encontrado");
    }
  }
}
