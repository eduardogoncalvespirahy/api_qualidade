import { CredentialRoleRepository } from "../repositories/credentialRole.repository";
import {
  CredentialRole,
  CreateCredentialRoleDTO
} from "../models/credentialRole.model";

export class CredentialRoleService {
  private readonly repository: CredentialRoleRepository;

  constructor() {
    this.repository = new CredentialRoleRepository();
  }

  async create(dto: CreateCredentialRoleDTO): Promise<CredentialRole> {
    if (!dto.credentialId || !dto.roleId) {
      throw new Error("Os campos 'credentialId' e 'roleId' são obrigatórios");
    }
    return this.repository.create(dto.credentialId, dto.roleId);
  }

  async findByCredential(credentialId: string): Promise<CredentialRole[]> {
    return this.repository.findByCredential(credentialId);
  }

  async delete(credentialId: string, roleId: string): Promise<void> {
    const removed = await this.repository.delete(credentialId, roleId);
    if (!removed) {
      throw new Error("Vínculo não encontrado");
    }
  }
}
