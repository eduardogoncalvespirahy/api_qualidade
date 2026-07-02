import { CredentialLocationRepository } from "../repositories/credentialLocation.repository";
import {
  CredentialLocation,
  CreateCredentialLocationDTO,
} from "../models/credentialLocation.model";

export class CredentialLocationService {
  private readonly repository: CredentialLocationRepository;

  constructor() {
    this.repository = new CredentialLocationRepository();
  }

  async create(dto: CreateCredentialLocationDTO): Promise<CredentialLocation> {
    const { credentialId, locationId } = dto;
    if (!credentialId) {
      throw new Error("O campo 'credentialId' é obrigatório");
    }
    if (!locationId) {
      throw new Error("O campo 'locationId' é obrigatório");
    }
    return this.repository.create(dto.credentialId, dto.locationId);
  }

  async findByCredential(credentialId: string): Promise<CredentialLocation[]> {
    if (!credentialId) {
      throw new Error("O campo 'credentialId' é obrigatório");
    }
    return this.repository.findByCredential(credentialId);
  }

  async findLocationNamesByCredential(credentialId: string): Promise<string[]> {
    if (!credentialId) {
      throw new Error("O campo 'credentialId' é obrigatório");
    }
    return this.repository.findLocationNamesByCredential(credentialId);
  }

  async delete(credentialId: string, locationId: string): Promise<void> {
    if (!credentialId) {
      throw new Error("O campo 'credentialId' é obrigatório");
    }
    if (!locationId) {
      throw new Error("O campo 'locationId' é obrigatório");
    }
    const removed = await this.repository.delete(credentialId, locationId);
    if (!removed) {
      throw new Error("Vínculo não encontrado");
    }
  }
}
