import { ControlRepository } from "../repositories/control.repository";
import {
  Control,
  CreateControlDTO,
  UpdateControlDTO,
} from "../models/control.model";
import { PaginatedResult } from "../models/paginate.model";

export class ControlService {
  private readonly repository: ControlRepository;

  constructor() {
    this.repository = new ControlRepository();
  }

  async create(dto: CreateControlDTO): Promise<Control> {
    if (!dto.formId) {
      throw new Error("O campo 'formId' é obrigatório");
    }

    if (!dto.userId) {
      throw new Error("O campo 'userId' é obrigatório");
    }

    return this.repository.create(dto);
  }

  async findAll(
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<Control>> {
    return this.repository.findAll(page, limit);
  }

  async findById(id: string): Promise<Control> {
    const item = await this.repository.findById(id);

    if (!item) {
      throw new Error("Control não encontrado");
    }

    return item;
  }

  async findByFormId(formId: string): Promise<Control[]> {
    return this.repository.findByFormId(formId);
  }

  async findByUserId(userId: string): Promise<Control[]> {
    return this.repository.findByUserId(userId);
  }

  async update(id: string, dto: UpdateControlDTO): Promise<Control> {
    await this.findById(id);

    if (!dto.userId) {
      throw new Error("O campo 'userId' é obrigatório");
    }

    const updated = await this.repository.update(id, dto);

    if (!updated) {
      throw new Error("Erro ao atualizar Control");
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);

    if (!deleted) {
      throw new Error("Control não encontrado");
    }
  }
}
