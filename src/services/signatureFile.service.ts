import { SignatureFileRepository } from "../repositories/signatureFile.repository";
import {
  SignatureFile,
  CreateSignatureFileDTO,
  UpdateSignatureFileDTO,
} from "../models/signatureFile.model";
import { PaginatedResult } from "../models/paginate.model";

export class SignatureFileService {
  private readonly repository: SignatureFileRepository;

  constructor() {
    this.repository = new SignatureFileRepository();
  }

  async create(dto: CreateSignatureFileDTO): Promise<SignatureFile> {
    // nome é obrigatório
    if (!dto.nome) {
      throw new Error("O campo 'nome' é obrigatório");
    }

    return this.repository.create(dto);
  }

  async findAll(page?: number, limit?: number): Promise<PaginatedResult<SignatureFile>> {
    return this.repository.findAll(page, limit);
  }

  async findById(id: string): Promise<SignatureFile> {
    const item = await this.repository.findById(id);

    if (!item) {
      throw new Error("Arquivo não encontrado");
    }

    return item;
  }

  async update(id: string, dto: UpdateSignatureFileDTO): Promise<SignatureFile> {
    await this.findById(id);

    const updated = await this.repository.update(id, dto);

    if (!updated) {
      throw new Error("Erro ao atualizar arquivo");
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);

    if (!deleted) {
      throw new Error("Arquivo não encontrado");
    }
  }
}
