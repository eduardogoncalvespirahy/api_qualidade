import { RoleRepository } from "../repositories/role.repository";
import {
  Role,
  CreateRoleDTO,
  UpdateRoleDTO
} from "../models/role.model";
import { PaginatedResult } from "../models/paginate.model";

export class RoleService {
  private readonly repository: RoleRepository;

  constructor() {
    this.repository = new RoleRepository();
  }

  async create(dto: CreateRoleDTO): Promise<Role> {
    if (!dto.nome) {
      throw new Error("O campo 'nome' é obrigatório");
    }
    if (!dto.systemId) {
      throw new Error("O campo 'systemId' é obrigatório");
    }
    return this.repository.create(dto);
  }

  async findAll(
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResult<Role>> {
    return this.repository.findAll(page, limit);
  }

  async findById(id: string): Promise<Role> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new Error("Role não encontrado");
    }
    return item;
  }

  async update(id: string, dto: UpdateRoleDTO): Promise<Role> {
    await this.findById(id);
    const updated = await this.repository.update(id, dto);
    if (!updated) {
      throw new Error("Erro ao atualizar Role");
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new Error("Role não encontrado");
    }
  }
}
