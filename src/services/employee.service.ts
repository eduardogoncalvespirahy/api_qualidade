import { EmployeeRepository } from "../repositories/employee.repository";
import {
  Employee,
  CreateEmployeeDTO,
  UpdateEmployeeDTO
} from "../models/employee.model";
import { PaginatedResult } from "../models/paginate.model";

export class EmployeeService {
  private readonly repository: EmployeeRepository;

  constructor() {
    this.repository = new EmployeeRepository();
  }

  async create(dto: CreateEmployeeDTO): Promise<Employee> {
    if (!dto.id) {
      throw new Error("O campo 'id' é obrigatório");
    }
    return this.repository.create(dto);
  }

  async findAll(
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResult<Employee>> {
    return this.repository.findAll(page, limit);
  }

  async findById(id: string): Promise<Employee> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new Error("Employee não encontrado");
    }
    return item;
  }

  async findByRegisterNumber(registerNumber: string): Promise<Employee> {
    const item = await this.repository.findByRegisterNumber(registerNumber);
    if (!item) {
      throw new Error("Employee não encontrado");
    }
    return item;
  }  

  async update(id: string, dto: UpdateEmployeeDTO): Promise<Employee> {
    await this.findById(id);
    const updated = await this.repository.update(id, dto);
    if (!updated) {
      throw new Error("Erro ao atualizar Employee");
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new Error("Employee não encontrado");
    }
  }
}
