import { RepairerAnswerResultRepository } from "../repositories/repairerAnswerResult.repository";
import {
  RepairerAnswerResult,
  CreateRepairerAnswerResultDTO,
  UpdateRepairerAnswerResultDTO,
} from "../models/repairerAnswerResult.model";
import { PaginatedResult } from "../models/paginate.model";

export class RepairerAnswerResultService {
  private readonly repository: RepairerAnswerResultRepository;

  constructor() {
    this.repository = new RepairerAnswerResultRepository();
  }

  async create(
    dto: CreateRepairerAnswerResultDTO,
  ): Promise<RepairerAnswerResult> {
    if (!dto.answerResultId) {
      throw new Error("O campo 'answerResultId' é obrigatório");
    }

    if (!dto.userId) {
      throw new Error("O campo 'userId' é obrigatório");
    }

    return this.repository.create(dto);
  }

  async findAll(
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<RepairerAnswerResult>> {
    return this.repository.findAll(page, limit);
  }

  async findById(
    answerResultId: string,
    userId: string,
  ): Promise<RepairerAnswerResult> {
    if (!answerResultId) {
      throw new Error("O campo 'answerResultId' é obrigatório");
    }

    if (!userId) {
      throw new Error("O campo 'userId' é obrigatório");
    }

    const repairerAnswerResult = await this.repository.findById(
      answerResultId,
      userId,
    );

    if (!repairerAnswerResult) {
      throw new Error("repairerAnswerResult não encontrado");
    }

    return repairerAnswerResult;
  }

  async findByAnswerResultId(
    answerResultId: string,
  ): Promise<RepairerAnswerResult> {
    if (!answerResultId) {
      throw new Error("O campo 'answerResultId' é obrigatório");
    }

    const repairerAnswerResult =
      await this.repository.findByAnswerResultId(answerResultId);

    if (!repairerAnswerResult) {
      throw new Error("repairerAnswerResult não encontrado");
    }

    return repairerAnswerResult;
  }

  async findByUserId(userId: string): Promise<RepairerAnswerResult> {
    if (!userId) {
      throw new Error("O campo 'userId' é obrigatório");
    }

    const repairerAnswerResult = await this.repository.findByUserId(userId);

    if (!repairerAnswerResult) {
      throw new Error("repairerAnswerResult não encontrado");
    }

    return repairerAnswerResult;
  }

  async update(
    answerResultId: string,
    userId: string,
    dto: UpdateRepairerAnswerResultDTO,
  ): Promise<RepairerAnswerResult> {
    if (!answerResultId) {
      throw new Error("O campo 'answerResultId' é obrigatório");
    }

    if (!userId) {
      throw new Error("O campo 'userId' é obrigatório");
    }

    await this.findById(answerResultId, userId);

    const RepairerAnswerResult = await this.repository.update(
      answerResultId,
      userId,
      dto,
    );

    if (!RepairerAnswerResult) {
      throw new Error("Erro ao atualizar RepairerAnswerResult");
    }

    return RepairerAnswerResult;
  }

  async delete(answerResultId: string, userId: string): Promise<void> {
    if (!answerResultId) {
      throw new Error("O campo 'answerResultId' é obrigatório");
    }

    if (!userId) {
      throw new Error("O campo 'userId' é obrigatório");
    }

    const repairerAnswerResult = await this.repository.delete(
      answerResultId,
      userId,
    );

    if (!repairerAnswerResult) {
      throw new Error("RepairerAnswerResult não encontrado");
    }
  }
}
