import { FormGroupsRepository } from "../repositories/formGroups.repository";
import {
  FormGroups,
  CreateFormGroupsDTO,
  UpdateFormGroupsDTO,
} from "../models/formGroups.model";
import { PaginatedResult } from "../models/paginate.model";

export class FormGroupsService {
  private readonly repository: FormGroupsRepository;

  constructor() {
    this.repository = new FormGroupsRepository();
  }

  async create(dto: CreateFormGroupsDTO): Promise<FormGroups> {
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
    limit?: number,
  ): Promise<PaginatedResult<FormGroups>> {
    return this.repository.findAll(page, limit);
  }

  async findById(id: string): Promise<FormGroups> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new Error("FormGroups não encontrado");
    }
    return item;
  }

  async update(id: string, dto: UpdateFormGroupsDTO): Promise<FormGroups> {
    await this.findById(id);
    const updated = await this.repository.update(id, dto);
    if (!updated) {
      throw new Error("Erro ao atualizar FormGroups");
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new Error("FormGroups não encontrado");
    }
  }
}
