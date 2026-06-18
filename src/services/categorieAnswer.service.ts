import { CategorieAnswerRepository } from "../repositories/categorieAnswer.repository";
import {
  CategorieAnswer,
  CreateCategorieAnswerDTO,
  UpdateCategorieAnswerDTO,
} from "../models/categorieAnswer.model";
import { PaginatedResult } from "../models/paginate.model";

export class CategorieAnswerService {
  private readonly repository: CategorieAnswerRepository;

  constructor() {
    this.repository = new CategorieAnswerRepository();
  }

  async create(dto: CreateCategorieAnswerDTO): Promise<CategorieAnswer> {
    if (!dto.nome?.trim()) {
      throw new Error("O campo 'nome' é obrigatório");
    }

    return this.repository.create(dto);
  }

  async findAll(
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<CategorieAnswer>> {
    return this.repository.findAll(page, limit);
  }

  async findById(id: string): Promise<CategorieAnswer> {
    const item = await this.repository.findById(id);

    if (!item) {
      throw new Error("CategorieAnswer não encontrado");
    }

    return item;
  }

  async update(
    id: string,
    dto: UpdateCategorieAnswerDTO,
  ): Promise<CategorieAnswer> {
    await this.findById(id);

    const updated = await this.repository.update(id, dto);

    if (!updated) {
      throw new Error("Erro ao atualizar CategorieAnswer");
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);

    if (!deleted) {
      throw new Error("CategorieAnswer não encontrado");
    }
  }
}
