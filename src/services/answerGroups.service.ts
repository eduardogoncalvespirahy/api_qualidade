import { AnswerGroupsRepository } from "../repositories/answerGroups.repository";
import {
  AnswerGroups,
  CreateAnswerGroupsDTO,
  UpdateAnswerGroupsDTO,
} from "../models/answerGroups.model";
import { PaginatedResult } from "../models/paginate.model";

export class AnswerGroupsService {
  private readonly repository: AnswerGroupsRepository;

  constructor() {
    this.repository = new AnswerGroupsRepository();
  }

  async create(dto: CreateAnswerGroupsDTO): Promise<AnswerGroups> {
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
    limit?: number,
  ): Promise<PaginatedResult<AnswerGroups>> {
    return this.repository.findAll(page, limit);
  }

  async findById(id: string): Promise<AnswerGroups> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new Error("AnswerGroups não encontrado");
    }
    return item;
  }

  async update(id: string, dto: UpdateAnswerGroupsDTO): Promise<AnswerGroups> {
    await this.findById(id);
    const updated = await this.repository.update(id, dto);
    if (!updated) {
      throw new Error("Erro ao atualizar AnswerGroups");
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new Error("AnswerGroups não encontrado");
    }
  }
}
