import { LimitMachineAnswerRepository } from "../repositories/limitMachineAnswer.repository";
import {
  LimitMachineAnswer,
  CreateLimitMachineAnswerDTO,
  UpdateLimitMachineAnswerDTO,
} from "../models/limitMachineAnswer.model";
import { PaginatedResult } from "../models/paginate.model";

export class LimitMachineAnswerService {
  private readonly repository: LimitMachineAnswerRepository;

  constructor() {
    this.repository = new LimitMachineAnswerRepository();
  }

  async create(dto: CreateLimitMachineAnswerDTO): Promise<LimitMachineAnswer> {
    if (!dto.machineId) {
      throw new Error("O campo 'machineId' é obrigatório");
    }

    return this.repository.create(dto);
  }

  async findAll(
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<LimitMachineAnswer>> {
    return this.repository.findAll(page, limit);
  }

  async findById(id: string): Promise<LimitMachineAnswer> {
    const item = await this.repository.findById(id);

    if (!item) {
      throw new Error("LimitMachineAnswer não encontrado");
    }

    return item;
  }

  async findByAnswerId(machineId: string): Promise<LimitMachineAnswer[]> {
    return this.repository.findByAnswerId(machineId);
  }

  async update(id: string, dto: UpdateLimitMachineAnswerDTO): Promise<LimitMachineAnswer> {
    await this.findById(id);

    if (!dto.machineId) {
      throw new Error("O campo 'machineId' é obrigatório");
    }

    const updated = await this.repository.update(id, dto);

    if (!updated) {
      throw new Error("Erro ao atualizar LimitAnswer");
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);

    if (!deleted) {
      throw new Error("LimitMachineAnswer não encontrado");
    }
  }
}
