import { DepartmentRepository } from "../repositories/department.repository";
import {
  Department,
  CreateDepartmentDTO,
  UpdateDepartmentDTO
} from "../models/department.model";
import { PaginatedResult } from "../models/paginate.model";

export class DepartmentService {
  private readonly repository: DepartmentRepository;

  constructor() {
    this.repository = new DepartmentRepository();
  }

  async create(dto: CreateDepartmentDTO): Promise<Department> {
    if (!dto.id) {
      throw new Error("O campo 'id' é obrigatório");
    }
    return this.repository.create(dto);
  }

  async findAll(
    page?: number,
    limit?: number
  ): Promise<PaginatedResult<Department>> {
    return this.repository.findAll(page, limit);
  }

  async findById(id: string): Promise<Department> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new Error("Department não encontrado");
    }
    return item;
  }

  async update(id: string, dto: UpdateDepartmentDTO): Promise<Department> {
    await this.findById(id);
    const updated = await this.repository.update(id, dto);
    if (!updated) {
      throw new Error("Erro ao atualizar Department");
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new Error("Department não encontrado");
    }
  }
}
