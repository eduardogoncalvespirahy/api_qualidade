import { BreakMachineRepository } from "../repositories/breakMachine.repository";
import {
  BreakMachine,
  CreateBreakMachineDTO,
  UpdateBreakMachineDTO,
} from "../models/breakMachine.model";
import { PaginatedResult } from "../models/paginate.model";

export class BreakMachineService {
  private readonly repository: BreakMachineRepository;

  constructor() {
    this.repository = new BreakMachineRepository();
  }

  async create(dto: CreateBreakMachineDTO): Promise<BreakMachine> {
    if (!dto.machineId) {
      throw new Error("O campo 'machineId' é obrigatório");
    }

    if (!dto.horaInicio) {
      throw new Error("O campo 'horaInicio' é obrigatório");
    }

    return this.repository.create(dto);
  }

  async findAll(
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<BreakMachine>> {
    return this.repository.findAll(page, limit);
  }

  async findById(id: string): Promise<BreakMachine> {
    const item = await this.repository.findById(id);

    if (!item) {
      throw new Error("BreakMachine não encontrado");
    }

    return item;
  }

  async findByMachineId(machineId: string): Promise<BreakMachine[]> {
    return this.repository.findByMachineId(machineId);
  }

  async update(id: string, dto: UpdateBreakMachineDTO): Promise<BreakMachine> {
    await this.findById(id);

    const updated = await this.repository.update(id, dto);

    if (!updated) {
      throw new Error("Erro ao atualizar BreakMachine");
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);

    if (!deleted) {
      throw new Error("BreakMachine não encontrado");
    }
  }
}
