import { CostCenterRepository } from "../repositories/costCenter.repository";
import {
  CostCenter,
  CreateCostCenterDTO,
  UpdateCostCenterDTO
} from "../models/costCenter.model";
import { PaginatedResult } from "../models/paginate.model";

export class CostCenterService {
  private readonly repository: CostCenterRepository;

  constructor() {
    this.repository = new CostCenterRepository();
  }

  async create(dto: CreateCostCenterDTO): Promise<CostCenter> {
    if (!dto.id) {
      throw new Error("O campo 'id' é obrigatório");
    }
    return this.repository.create(dto);
  }

  async findAll(
    page?: number,
    limit?: number
  ): Promise<PaginatedResult<CostCenter>> {
    return this.repository.findAll(page, limit);
  }

  async findById(id: string): Promise<CostCenter> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new Error("CostCenter não encontrado");
    }
    return item;
  }

  async update(id: string, dto: UpdateCostCenterDTO): Promise<CostCenter> {
    await this.findById(id);
    const updated = await this.repository.update(id, dto);
    if (!updated) {
      throw new Error("Erro ao atualizar CostCenter");
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new Error("CostCenter não encontrado");
    }
  }
}
