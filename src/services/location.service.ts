import { LocationRepository } from "../repositories/location.repository";
import {
  Location,
  CreateLocationDTO,
  UpdateLocationDTO
} from "../models/location.model";
import { PaginatedResult } from "../models/paginate.model";

export class LocationService {
  private readonly repository: LocationRepository;

  constructor() {
    this.repository = new LocationRepository();
  }

  async create(dto: CreateLocationDTO): Promise<Location> {
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
  ): Promise<PaginatedResult<Location>> {
    return this.repository.findAll(page, limit);
  }

  async findById(id: string): Promise<Location> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new Error("Location não encontrado");
    }
    return item;
  }

  async update(id: string, dto: UpdateLocationDTO): Promise<Location> {
    await this.findById(id);
    const updated = await this.repository.update(id, dto);
    if (!updated) {
      throw new Error("Erro ao atualizar Location");
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new Error("Location não encontrado");
    }
  }
}
