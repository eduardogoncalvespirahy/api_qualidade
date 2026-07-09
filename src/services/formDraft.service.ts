import { FormDraftRepository } from "../repositories/formDraft.repository";
import {
  FormDraft,
  CreateFormDraftDTO,
  UpdateFormDraftDTO
} from "../models/formDraft.model";
import { PaginatedResult } from "../models/paginate.model";

export class FormDraftService {
  private readonly repository: FormDraftRepository;

  constructor() {
    this.repository = new FormDraftRepository();
  }

  async create(dto: CreateFormDraftDTO): Promise<FormDraft> {
    if (!dto.formId) {
      throw new Error("O campo 'formId' é obrigatório");
    }
    if (!dto.rascunhoData) {
      throw new Error("O campo 'rascunhoData' é obrigatório");
    }
    return this.repository.create(dto);
  }

  async findAll(
    page?: number,
    limit?: number
  ): Promise<PaginatedResult<FormDraft>> {
    return this.repository.findAll(page, limit);
  }

  async findById(id: string): Promise<FormDraft> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new Error("FormDraft não encontrado");
    }
    return item;
  }

  async update(id: string, dto: UpdateFormDraftDTO): Promise<FormDraft> {
    await this.findById(id);
    const updated = await this.repository.update(id, dto);
    if (!updated) {
      throw new Error("Erro ao atualizar FormDraft");
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new Error("FormDraft não encontrado");
    }
  }
}
