import { AnswerRepository } from "../repositories/answer.repository";
import {
  Answer,
  CreateAnswerDTO,
  UpdateAnswerDTO
} from "../models/answer.model";
import { PaginatedResult } from "../models/paginate.model";

export class AnswerService {
  private readonly repository: AnswerRepository;

  constructor() {
    this.repository = new AnswerRepository();
  }

  async create(dto: CreateAnswerDTO): Promise<Answer> {
    if (!dto.nome) {
      throw new Error("O campo 'nome' é obrigatório");
    }
    if (!dto.formId) {
      throw new Error("O campo 'formId' é obrigatório");
    }
    return this.repository.create(dto);
  }

  async findAll(
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResult<Answer>> {
    return this.repository.findAll(page, limit);
  }

  async findById(id: string): Promise<Answer> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new Error("Answer não encontrado");
    }
    return item;
  }

  async update(id: string, dto: UpdateAnswerDTO): Promise<Answer> {
    await this.findById(id);
    const updated = await this.repository.update(id, dto);
    if (!updated) {
      throw new Error("Erro ao atualizar Answer");
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new Error("Answer não encontrado");
    }
  }
}
