import { FormRepository } from "../repositories/form.repository";
import {
  Form,
  CreateFormDTO,
  UpdateFormDTO
} from "../models/form.model";
import { PaginatedResult } from "../models/paginate.model";

export class FormService {
  private readonly repository: FormRepository;

  constructor() {
    this.repository = new FormRepository();
  }

  async create(dto: CreateFormDTO): Promise<Form> {
    if (!dto.nome) {
      throw new Error("O campo 'nome' é obrigatório");
    }
    if (!dto.sectionId) {
      throw new Error("O campo 'sectionId' é obrigatório");
    }
    return this.repository.create(dto);
  }

  async findAll(
    page?: number,
    limit?: number
  ): Promise<PaginatedResult<Form>> {
    return this.repository.findAll(page, limit);
  }

  async findById(id: string): Promise<Form> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new Error("Form não encontrado");
    }
    return item;
  }

  async update(id: string, dto: UpdateFormDTO): Promise<Form> {
    await this.findById(id);
    const updated = await this.repository.update(id, dto);
    if (!updated) {
      throw new Error("Erro ao atualizar Form");
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new Error("Form não encontrado");
    }
  }
}
