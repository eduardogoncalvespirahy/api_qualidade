import { FormGroupItemsRepository } from "../repositories/formGroupItems.repository";
import {
  formGroupItems,
  CreateFormGroupItemsDTO,
  UpdateFormGroupItemsDTO,
} from "../models/formGroupItems.model";
import { PaginatedResult } from "../models/paginate.model";

export class FormGroupItemsService {
  private readonly repository: FormGroupItemsRepository;

  constructor() {
    this.repository = new FormGroupItemsRepository();
  }

  async create(dto: CreateFormGroupItemsDTO): Promise<formGroupItems> {
    if (!dto.formGroupId) {
      throw new Error("O campo 'formGroupId' é obrigatório");
    }
    if (!dto.formId) {
      throw new Error("O campo 'formId' é obrigatório");
    }
    if (!dto.ordem) {
      throw new Error("O campo 'ordem' é obrigatório");
    }
    return this.repository.create(dto);
  }

  async findById(formGroupId: string, formId: string): Promise<formGroupItems> {
    const formGroupItem = await this.repository.findById(formGroupId, formId);
    if (!formGroupItem) {
      throw new Error("FormGroupItem não encontrado");
    }
    return formGroupItem;
  }

  async findByFormGroupId(formGroupId: string): Promise<formGroupItems> {
    const formGroupItem = await this.repository.findByformGroupId(formGroupId);
    if (!formGroupItem) {
      throw new Error("FormGroupItem(s) não encontrado(s)");
    }
    return formGroupItem;
  }

  async findByformId(formId: string): Promise<formGroupItems> {
    const formGroupItem = await this.repository.findByformId(formId);
    if (!formGroupItem) {
      throw new Error("FormGroupItem(s) não encontrado(s)");
    }
    return formGroupItem;
  }

  async findAll(
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<formGroupItems>> {
    return this.repository.findAll(page, limit);
  }

  async update(
    formGroupId: string,
    formId: string,
    dto: UpdateFormGroupItemsDTO,
  ): Promise<formGroupItems> {
    await this.findById(formGroupId, formId);
    const updated = await this.repository.update(formGroupId, formId, dto);
    if (!updated) {
      throw new Error("Erro ao atualizar FormGroupItem");
    }
    return updated;
  }

  async delete(formGroupId: string, formId: string): Promise<void> {
    const deleted = await this.repository.delete(formGroupId, formId);
    if (!deleted) {
      throw new Error("FormGroupItem não encontrado");
    }
  }
}
