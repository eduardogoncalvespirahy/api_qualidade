import { RepairerMachineAnswerResultRepository } from "../repositories/repairerMachineAnswerResult.repository";
import {
  RepairerMachineAnswerResult,
  CreateRepairerMachineAnswerResultDTO,
  UpdateRepairerMachineAnswerResultDTO,
} from "../models/repairerMachineAnswerResult.model";
import { PaginatedResult } from "../models/paginate.model";

export class RepairerMachineAnswerResultService {
  private readonly repository: RepairerMachineAnswerResultRepository;

  constructor() {
    this.repository = new RepairerMachineAnswerResultRepository();
  }

  async create(
    dto: CreateRepairerMachineAnswerResultDTO,
  ): Promise<RepairerMachineAnswerResult> {
    if (!dto.machineAnswerResultId) {
      throw new Error("O campo 'machineAnswerResultId' é obrigatório");
    }

    if (!dto.userId) {
      throw new Error("O campo 'userId' é obrigatório");
    }

    return this.repository.create(dto);
  }

  async findAll(
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<RepairerMachineAnswerResult>> {
    return this.repository.findAll(page, limit);
  }

  async findById(
    machineAnswerResultId: string,
    userId: string,
  ): Promise<RepairerMachineAnswerResult> {
    if (!machineAnswerResultId) {
      throw new Error("O campo 'machineAnswerResultId' é obrigatório");
    }

    if (!userId) {
      throw new Error("O campo 'userId' é obrigatório");
    }

    const repairerMachineAnswerResult = await this.repository.findById(
      machineAnswerResultId,
      userId,
    );

    if (!repairerMachineAnswerResult) {
      throw new Error("repairerMachineAnswerResult não encontrado");
    }

    return repairerMachineAnswerResult;
  }

  async findByMachineAnswerResultId(
    machineAnswerResultId: string,
  ): Promise<RepairerMachineAnswerResult> {
    if (!machineAnswerResultId) {
      throw new Error("O campo 'machineAnswerResultId' é obrigatório");
    }

    const repairerMachineAnswerResult =
      await this.repository.findByMachineAnswerResultId(machineAnswerResultId);

    if (!repairerMachineAnswerResult) {
      throw new Error("repairerMachineAnswerResult não encontrado");
    }

    return repairerMachineAnswerResult;
  }

  async findByUserId(userId: string): Promise<RepairerMachineAnswerResult> {
    if (!userId) {
      throw new Error("O campo 'userId' é obrigatório");
    }

    const repairerMachineAnswerResult =
      await this.repository.findByUserId(userId);

    if (!repairerMachineAnswerResult) {
      throw new Error("repairerMachineAnswerResult não encontrado");
    }

    return repairerMachineAnswerResult;
  }

  async update(
    machineAnswerResultId: string,
    userId: string,
    dto: UpdateRepairerMachineAnswerResultDTO,
  ): Promise<RepairerMachineAnswerResult> {
    if (!machineAnswerResultId) {
      throw new Error("O campo 'machineAnswerResultId' é obrigatório");
    }

    if (!userId) {
      throw new Error("O campo 'userId' é obrigatório");
    }

    await this.findById(machineAnswerResultId, userId);

    const RepairerMachineAnswerResult = await this.repository.update(
      machineAnswerResultId,
      userId,
      dto,
    );

    if (!RepairerMachineAnswerResult) {
      throw new Error("Erro ao atualizar RepairerMachineAnswerResult");
    }

    return RepairerMachineAnswerResult;
  }

  async delete(machineAnswerResultId: string, userId: string): Promise<void> {
    if (!machineAnswerResultId) {
      throw new Error("O campo 'machineAnswerResultId' é obrigatório");
    }

    if (!userId) {
      throw new Error("O campo 'userId' é obrigatório");
    }

    const repairerMachineAnswerResult = await this.repository.delete(
      machineAnswerResultId,
      userId,
    );

    if (!repairerMachineAnswerResult) {
      throw new Error("RepairerMachineAnswerResult não encontrado");
    }
  }
}
