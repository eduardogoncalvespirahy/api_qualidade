import { BreakFormRepository } from "../repositories/breakForm.repository";
import {
  BreakForm,
  CreateBreakFormDTO,
  UpdateBreakFormDTO,
} from "../models/breakForm.model";
import { PaginatedResult } from "../models/paginate.model";

export class BreakFormService {
  private readonly repository: BreakFormRepository;

  constructor() {
    this.repository = new BreakFormRepository();
  }

  async create(dto: CreateBreakFormDTO): Promise<BreakForm> {
    if (!dto.formId) {
      throw new Error("O campo 'formId' é obrigatório");
    }

    if (!dto.horaInicio) {
      throw new Error("O campo 'horaInicio' é obrigatório");
    }

    if (!dto.horaFim) {
      throw new Error("O campo 'horaFim' é obrigatório");
    }

    return this.repository.create(dto);
  }

  async findAll(
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<BreakForm>> {
    return this.repository.findAll(page, limit);
  }

  async findById(id: string): Promise<BreakForm> {
    const item = await this.repository.findById(id);

    if (!item) {
      throw new Error("BreakForm não encontrado");
    }

    return item;
  }

  async findByFormId(formId: string): Promise<BreakForm[]> {
    return this.repository.findByFormId(formId);
  }

  async update(id: string, dto: UpdateBreakFormDTO): Promise<BreakForm> {
    await this.findById(id);

    const updated = await this.repository.update(id, dto);

    if (!updated) {
      throw new Error("Erro ao atualizar BreakForm");
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);

    if (!deleted) {
      throw new Error("BreakForm não encontrado");
    }
  }
}
