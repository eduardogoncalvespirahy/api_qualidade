import { MachineAnswerRepository } from "../repositories/machineAnswer.repository";
import {
  MachineAnswer,
  CreateMachineAnswerDTO,
  UpdateMachineAnswerDTO,
} from "../models/machineAnswer.model";
import { PaginatedResult } from "../models/paginate.model";

export class MachineAnswerService {
  private readonly repository: MachineAnswerRepository;

  constructor() {
    this.repository = new MachineAnswerRepository();
  }

  async create(dto: CreateMachineAnswerDTO): Promise<MachineAnswer> {
    if (!dto.machineId) {
      throw new Error("O campo 'machineId' é obrigatório");
    }

    if (!dto.nome?.trim()) {
      throw new Error("O campo 'nome' é obrigatório");
    }

    return this.repository.create(dto);
  }

  async findAll(
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<MachineAnswer>> {
    return this.repository.findAll(page, limit);
  }

  async findById(id: string): Promise<MachineAnswer> {
    const item = await this.repository.findById(id);

    if (!item) {
      throw new Error("MachineAnswer não encontrado");
    }

    return item;
  }

  async findByMachineId(machineId: string): Promise<MachineAnswer[]> {
    return this.repository.findByMachineId(machineId);
  }

  async update(
    id: string,
    dto: UpdateMachineAnswerDTO,
  ): Promise<MachineAnswer> {
    await this.findById(id);

    const updated = await this.repository.update(id, dto);

    if (!updated) {
      throw new Error("Erro ao atualizar MachineAnswer");
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);

    if (!deleted) {
      throw new Error("MachineAnswer não encontrado");
    }
  }
}
