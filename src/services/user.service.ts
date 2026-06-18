import { UserRepository } from "../repositories/user.repository";
import {
  User,
  CreateUserDTO,
  UpdateUserDTO
} from "../models/user.model";
import { PaginatedResult } from "../models/paginate.model";

export class UserService {
  private readonly repository: UserRepository;

  constructor() {
    this.repository = new UserRepository();
  }

  async create(dto: CreateUserDTO): Promise<User> {
    if (!dto.employeeId) {
      throw new Error("O campo 'employeeId' é obrigatório");
    }
    if (!dto.username) {
      throw new Error("O campo 'username' é obrigatório");
    }
    if (!dto.email) {
      throw new Error("O campo 'email' é obrigatório");
    }

    const existing = await this.repository.findByEmail(dto.email);
    if (existing) {
      throw new Error("Usuário já cadastrado");
    }

    return this.repository.create(dto);
  }

  async findAll(
    page?: number,
    limit?: number
  ): Promise<PaginatedResult<User>> {
    return this.repository.findAll(page, limit);
  }

  async findById(id: string): Promise<User> {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new Error("Usuário não encontrado");
    }
    return user;
  }

  async findByUsername(username: string): Promise<User> {
    const user = await this.repository.findByUsername(username);
    if (!user) {
      throw new Error("Usuário não encontrado");
    }
    return user;
  }

  async findByRegisterNumber(registerNumber: number): Promise<User> {
    const user = await this.repository.findByRegisterNumber(registerNumber);
    if (!user) {
      throw new Error("Usuário não encontrado");
    }
    return user;
  }  

  async update(id: string, dto: UpdateUserDTO): Promise<User> {
    await this.findById(id);
    const updated = await this.repository.update(id, dto);
    if (!updated) {
      throw new Error("Erro ao atualizar usuário");
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new Error("Usuário não encontrado");
    }
  }
}
