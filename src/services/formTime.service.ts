import { FormTimeRepository } from "../repositories/formTime.repository";
import {
  FormTime,
  CreateFormTimeDTO,
  UpdateFormTimeDTO,
} from "../models/formTime.model";
import { PaginatedResult } from "../models/paginate.model";

export class FormTimeService {
  private readonly repository: FormTimeRepository;

  constructor() {
    this.repository = new FormTimeRepository();
  }

  async create(dto: CreateFormTimeDTO): Promise<FormTime> {
    if (!dto.tempoExecucao) {
      throw new Error("O campo 'tempoExecucao' é obrigatório");
    }

    return this.repository.create(dto);
  }

  async findAll(page?: number, limit?: number): Promise<PaginatedResult<FormTime>> {
    return this.repository.findAll(page, limit);
  }

  async findById(id: string): Promise<FormTime> {
    const item = await this.repository.findById(id);

    if (!item) {
      throw new Error("FormTime não encontrado");
    }

    return item;
  }

  async update(id: string, dto: UpdateFormTimeDTO): Promise<FormTime> {
    await this.findById(id);

    const updated = await this.repository.update(id, dto);

    if (!updated) {
      throw new Error("Erro ao atualizar FormTime");
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);

    if (!deleted) {
      throw new Error("FormTime não encontrado");
    }
  }
}
