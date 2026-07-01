import { CredentialRoleRepository } from "../repositories/credentialRole.repository";
import {
  CredentialRole,
  CreateCredentialRoleDTO,
} from "../models/credentialRole.model";

export class CredentialRoleService {
  private readonly repository: CredentialRoleRepository;

  constructor() {
    this.repository = new CredentialRoleRepository();
  }

  async create(dto: CreateCredentialRoleDTO): Promise<CredentialRole> {
    const { credentialId, roleId } = dto;
    if (!credentialId) {
      throw new Error("O campo 'credentialId' é obrigatório");
    }
    if (!roleId) {
      throw new Error("O campo 'roleId' é obrigatório");
    }
    return this.repository.create(dto.credentialId, dto.roleId);
  }

  async findByCredential(credentialId: string): Promise<CredentialRole[]> {
    if (!credentialId) {
      throw new Error("O campo 'credentialId' é obrigatório");
    }
    return this.repository.findByCredential(credentialId);
  }

  async findRoleNamesByCredential(credentialId: string): Promise<string[]> {
    if (!credentialId) {
      throw new Error("O campo 'credentialId' é obrigatório");
    }
    return this.repository.findRoleNamesByCredential(credentialId);
  }

  async delete(credentialId: string, roleId: string): Promise<void> {
    if (!credentialId) {
      throw new Error("O campo 'credentialId' é obrigatório");
    }
    if (!roleId) {
      throw new Error("O campo 'roleId' é obrigatório");
    }
    const removed = await this.repository.delete(credentialId, roleId);
    if (!removed) {
      throw new Error("Vínculo não encontrado");
    }
  }
}
