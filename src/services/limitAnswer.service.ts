import { LimitAnswerRepository } from "../repositories/limitAnswer.repository";
import {
  LimitAnswer,
  CreateLimitAnswerDTO,
  UpdateLimitAnswerDTO,
} from "../models/limitAnswer.model";
import { PaginatedResult } from "../models/paginate.model";

export class LimitAnswerService {
  private readonly repository: LimitAnswerRepository;

  constructor() {
    this.repository = new LimitAnswerRepository();
  }

  async create(dto: CreateLimitAnswerDTO): Promise<LimitAnswer> {
    if (!dto.answerId) {
      throw new Error("O campo 'answerId' é obrigatório");
    }

    return this.repository.create(dto);
  }

  async findAll(
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<LimitAnswer>> {
    return this.repository.findAll(page, limit);
  }

  async findById(id: string): Promise<LimitAnswer> {
    const item = await this.repository.findById(id);

    if (!item) {
      throw new Error("LimitAnswer não encontrado");
    }

    return item;
  }

  async findByAnswerId(answerId: string): Promise<LimitAnswer[]> {
    return this.repository.findByAnswerId(answerId);
  }

  async update(id: string, dto: UpdateLimitAnswerDTO): Promise<LimitAnswer> {
    await this.findById(id);

    if (!dto.answerId) {
      throw new Error("O campo 'answerId' é obrigatório");
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
      throw new Error("LimitAnswer não encontrado");
    }
  }
}
