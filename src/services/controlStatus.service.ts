import { ControlStatusRepository } from "../repositories/controlStatus.repository";
import {
  ControlStatus,
  CreateControlStatusDTO,
} from "../models/controlStatus.model";

export class ControlStatusService {
  private readonly repository: ControlStatusRepository;

  constructor() {
    this.repository = new ControlStatusRepository();
  }

  async create(dto: CreateControlStatusDTO): Promise<ControlStatus> {
    const { controlId, statusId } = dto;
    if (!controlId) {
      throw new Error("O campo 'controlId' é obrigatório");
    }
    if (!statusId) {
      throw new Error("O campo 'statusId' é obrigatório");
    }
    return this.repository.create(dto.controlId, dto.statusId);
  }

  async findByControl(controlId: string): Promise<ControlStatus[]> {
    if (!controlId) {
      throw new Error("O campo 'controlId' é obrigatório");
    }
    return this.repository.findByControl(controlId);
  }

  async findStatusNamesByControl(controlId: string): Promise<string[]> {
    if (!controlId) {
      throw new Error("O campo 'controlId' é obrigatório");
    }
    return this.repository.findstatusNamesByControl(controlId);
  }

  async update(controlId: string, statusId: string): Promise<ControlStatus> {
    if (!controlId) {
      throw new Error("O campo 'controlId' é obrigatório");
    }
    if (!statusId) {
      throw new Error("O campo 'statusId' é obrigatório");
    }

    const updated = await this.repository.update(controlId, statusId);
    if (!updated) {
      throw new Error("Erro ao atualizar vínculo");
    }
    return updated;
  }

  async delete(controlId: string, statusId: string): Promise<void> {
    if (!controlId) {
      throw new Error("O campo 'controlId' é obrigatório");
    }
    if (!statusId) {
      throw new Error("O campo 'statusId' é obrigatório");
    }
    const removed = await this.repository.delete(controlId, statusId);
    if (!removed) {
      throw new Error("Vínculo não encontrado");
    }
  }
}
