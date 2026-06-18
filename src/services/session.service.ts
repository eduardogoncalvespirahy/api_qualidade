import { SessionRepository } from "../repositories/session.repository";
import {
  Session,
  CreateSessionDTO
} from "../models/session.model";
import { PaginatedResult } from "../models/paginate.model";

export class SessionService {
  private readonly repository: SessionRepository;

  constructor() {
    this.repository = new SessionRepository();
  }

  async create(dto: CreateSessionDTO): Promise<Session> {
    if (!dto.credentialId || !dto.refreshtoken || !dto.expira) {
      throw new Error("Campos obrigatórios: credentialId, refreshtoken, expira");
    }
    return this.repository.create(dto);
  }

  async findAll(
    page?: number,
    limit?: number
  ): Promise<PaginatedResult<Session>> {
    return this.repository.findAll(page, limit);
  }

  async findById(id: string): Promise<Session> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new Error("Sessão não encontrada");
    }
    return item;
  }

  async revoke(id: string): Promise<Session> {
    const item = await this.repository.revoke(id);
    if (!item) {
      throw new Error("Sessão não encontrada");
    }
    return item;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new Error("Sessão não encontrada");
    }
  }
}
