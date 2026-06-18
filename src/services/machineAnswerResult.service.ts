import { MachineAnswerResultRepository } from "../repositories/machineAnswerResult.repository";
import {
  MachineAnswerResult,
  CreateMachineAnswerResultDTO,
  UpdateMachineAnswerResultDTO,
} from "../models/machineAnswerResult.model";
import { PaginatedResult } from "../models/paginate.model";

export class MachineAnswerResultService {
  private readonly repository: MachineAnswerResultRepository;

  constructor() {
    this.repository = new MachineAnswerResultRepository();
  }

  async create(
    dto: CreateMachineAnswerResultDTO,
  ): Promise<MachineAnswerResult> {
    if (!dto.machineAnswerId) {
      throw new Error("O campo 'machineAnswerId' é obrigatório");
    }

    return this.repository.create(dto);
  }

  async findAll(
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<MachineAnswerResult>> {
    return this.repository.findAll(page, limit);
  }

  async findById(id: string): Promise<MachineAnswerResult> {
    const item = await this.repository.findById(id);

    if (!item) {
      throw new Error("MachineAnswerResult não encontrado");
    }

    return item;
  }

  async findByMachineAnswerId(
    machineAnswerId: string,
  ): Promise<MachineAnswerResult[]> {
    return this.repository.findByMachineAnswerId(machineAnswerId);
  }

  async update(
    id: string,
    dto: UpdateMachineAnswerResultDTO,
  ): Promise<MachineAnswerResult> {
    await this.findById(id);

    if (!dto.machineAnswerId) {
      throw new Error("O campo 'machineAnswerId' é obrigatório");
    }

    const updated = await this.repository.update(id, dto);

    if (!updated) {
      throw new Error("Erro ao atualizar MachineAnswerResult");
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);

    if (!deleted) {
      throw new Error("MachineAnswerResult não encontrado");
    }
  }
}
