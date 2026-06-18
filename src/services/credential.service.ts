import bcrypt from "bcrypt";
import { CredentialRepository } from "../repositories/credential.repository";
import {
  Credential,
  CredentialResponse,
  CreateCredentialDTO,
  UpdateCredentialDTO
} from "../models/credential.model";
import { PaginatedResult } from "../models/paginate.model";

export class CredentialService {
  private readonly repository: CredentialRepository;

  constructor() {
    this.repository = new CredentialRepository();
  }

  private toResponse(c: Credential): CredentialResponse {
    return {
      id: c.id,
      userId: c.userId,
      systemId: c.systemId,
      status: c.status,
      dataUltimoLogin: c.dataUltimoLogin,
      dataCriacao: c.dataCriacao,
      dataAlteracao: c.dataAlteracao,
    };
  }

  async create(dto: CreateCredentialDTO): Promise<CredentialResponse> {
    if (!dto.userId) {
      throw new Error("O campo 'userId' é obrigatório");
    }
    if (!dto.systemId) {
      throw new Error("O campo 'systemId' é obrigatório");
    }
    if (!dto.senha) {
      throw new Error("O campo 'senha' é obrigatório");
    }

    const exists = await this.repository.findByUserAndSystem(dto.userId, dto.systemId);
    if (exists) {
      throw new Error("Credencial já existe para este usuário e sistema");
    }

    const senhaHash = await bcrypt.hash(dto.senha, 10);

    const created = await this.repository.create({
      userId: dto.userId,
      systemId: dto.systemId,
      status: dto.status,
      senhaHash,
    });

    return this.toResponse(created);
  }

  async findAll(
    page?: number,
    limit?: number
  ): Promise<PaginatedResult<CredentialResponse>> {
    const result = await this.repository.findAll(page, limit);
    return {
      ...result,
      data: result.data.map((c) => this.toResponse(c)),
    };
  }

  async findById(id: string): Promise<CredentialResponse> {
    const c = await this.repository.findById(id);
    if (!c) {
      throw new Error("Credencial não encontrada");
    }
    return this.toResponse(c);
  }

  async update(id: string, dto: UpdateCredentialDTO): Promise<CredentialResponse> {
    const current = await this.repository.findById(id);
    if (!current) {
      throw new Error("Credencial não encontrada");
    }

    const senhaHash = dto.senha ? await bcrypt.hash(dto.senha, 10) : undefined;

    const updated = await this.repository.update(id, {
      senhaHash,
      status: dto.status,
    });
    if (!updated) {
      throw new Error("Erro ao atualizar credencial");
    }
    return this.toResponse(updated);
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new Error("Credencial não encontrada");
    }
  }
}
