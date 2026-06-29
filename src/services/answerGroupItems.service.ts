import { AnswerGroupItemsRepository } from "../repositories/answerGroupItems.repository";
import {
  answerGroupItems,
  CreateAnswerGroupItemsDTO,
  UpdateAnswerGroupItemsDTO,
} from "../models/answerGroupItems.model";
import { PaginatedResult } from "../models/paginate.model";

export class AnswerGroupItemsService {
  private readonly repository: AnswerGroupItemsRepository;

  constructor() {
    this.repository = new AnswerGroupItemsRepository();
  }

  async create(dto: CreateAnswerGroupItemsDTO): Promise<answerGroupItems> {
    if (!dto.answerGroupId) {
      throw new Error("O campo 'answerGroupId' é obrigatório");
    }
    if (!dto.answerId) {
      throw new Error("O campo 'answerId' é obrigatório");
    }
    return this.repository.create(dto);
  }

  async findById(
    answerGroupId: string,
    answerId: string,
  ): Promise<answerGroupItems> {
    const answerGroupItem = await this.repository.findById(
      answerGroupId,
      answerId,
    );
    if (!answerGroupItem) {
      throw new Error("AnswerGroupItem não encontrado");
    }
    return answerGroupItem;
  }

  async findByAnswerGroupId(answerGroupId: string): Promise<answerGroupItems> {
    const answerGroupItem =
      await this.repository.findByAnswerGroupId(answerGroupId);
    if (!answerGroupItem) {
      throw new Error("AnswerGroupItem(s) não encontrado(s)");
    }
    return answerGroupItem;
  }

  async findByAnswerId(answerId: string): Promise<answerGroupItems> {
    const answerGroupItem = await this.repository.findByAnswerId(answerId);
    if (!answerGroupItem) {
      throw new Error("AnswerGroupItem(s) não encontrado(s)");
    }
    return answerGroupItem;
  }

  async findAll(
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<answerGroupItems>> {
    return this.repository.findAll(page, limit);
  }

  async update(
    answerGroupId: string,
    answerId: string,
    dto: UpdateAnswerGroupItemsDTO,
  ): Promise<answerGroupItems> {
    await this.findById(answerGroupId, answerId);
    const updated = await this.repository.update(answerGroupId, answerId, dto);
    if (!updated) {
      throw new Error("Erro ao atualizar AnswerGroupItem");
    }
    return updated;
  }

  async delete(answerGroupId: string, answerId: string): Promise<void> {
    const deleted = await this.repository.delete(answerGroupId, answerId);
    if (!deleted) {
      throw new Error("AnswerGroupItem não encontrado");
    }
  }
}
