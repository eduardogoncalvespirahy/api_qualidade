import { AnswerResultRepository } from "../repositories/answerResult.repository";
import {
  AnswerResult,
  CreateAnswerResultDTO,
} from "../models/answerResult.model";
import { PaginatedResult } from "../models/paginate.model";

export class AnswerResultService {
  private readonly repository: AnswerResultRepository;

  constructor() {
    this.repository = new AnswerResultRepository();
  }

  async create(dto: CreateAnswerResultDTO): Promise<AnswerResult> {
    if (!dto.AnswerId) {
      throw new Error("O campo 'AnswerId' é obrigatório");
    }

    if (!dto.resposta) {
      throw new Error("O campo 'resposta' é obrigatório");
    }

    return this.repository.create(dto);
  }

  async findAll(
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<AnswerResult>> {
    return this.repository.findAll(page, limit);
  }

  async findById(id: string): Promise<AnswerResult> {
    const item = await this.repository.findById(id);

    if (!item) {
      throw new Error("AnswerResult não encontrado");
    }

    return item;
  }

  async findByAnswerId(answerId: string): Promise<AnswerResult[]> {
    return this.repository.findByAnswerId(answerId);
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);

    if (!deleted) {
      throw new Error("AnswerResult não encontrado");
    }
  }
}
