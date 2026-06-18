import { SectionRepository } from "../repositories/section.repository";
import {
  Section,
  CreateSectionDTO,
  UpdateSectionDTO
} from "../models/section.model";
import { PaginatedResult } from "../models/paginate.model";

export class SectionService {
  private readonly repository: SectionRepository;

  constructor() {
    this.repository = new SectionRepository();
  }

  async create(dto: CreateSectionDTO): Promise<Section> {
    if (!dto.nome) {
      throw new Error("O campo 'nome' é obrigatório");
    }
    if (!dto.employerId) {
      throw new Error("O campo 'employerId' é obrigatório");
    }
    return this.repository.create(dto);
  }

  async findAll(
    page?: number,
    limit?: number
  ): Promise<PaginatedResult<Section>> {
    return this.repository.findAll(page, limit);
  }

  async findById(id: string): Promise<Section> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new Error("Section não encontrado");
    }
    return item;
  }

  async update(id: string, dto: UpdateSectionDTO): Promise<Section> {
    await this.findById(id);
    const updated = await this.repository.update(id, dto);
    if (!updated) {
      throw new Error("Erro ao atualizar Section");
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new Error("Section não encontrado");
    }
  }
}
