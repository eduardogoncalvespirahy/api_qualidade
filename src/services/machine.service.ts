import { MachineRepository } from "../repositories/machine.repository";
import {
  Machine,
  CreateMachineDTO,
  UpdateMachineDTO
} from "../models/machine.model";
import { PaginatedResult } from "../models/paginate.model";

export class MachineService {
  private readonly repository: MachineRepository;

  constructor() {
    this.repository = new MachineRepository();
  }

  async create(dto: CreateMachineDTO): Promise<Machine> {
    if (!dto.nome) {
      throw new Error("O campo 'nome' é obrigatório");
    }
    if (!dto.formId) {
      throw new Error("O campo 'formId' é obrigatório");
    }
    return this.repository.create(dto);
  }

  async findAll(
    page?: number,
    limit?: number
  ): Promise<PaginatedResult<Machine>> {
    return this.repository.findAll(page, limit);
  }

  async findById(id: string): Promise<Machine> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new Error("Machine não encontrado");
    }
    return item;
  }

  async update(id: string, dto: UpdateMachineDTO): Promise<Machine> {
    await this.findById(id);
    const updated = await this.repository.update(id, dto);
    if (!updated) {
      throw new Error("Erro ao atualizar Machine");
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new Error("Machine não encontrado");
    }
  }
}
