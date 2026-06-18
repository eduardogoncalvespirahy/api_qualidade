export interface MachineAnswer {
  id: string;
  machineId: string;
  nome: string;
  descricao: string | null;
  status: number;
  dataCriacao: Date;
  dataAlteracao: Date;
}

export interface CreateMachineAnswerDTO {
  machineId: string;
  nome: string;
  descricao?: string | null;
  status?: number;
}

export interface UpdateMachineAnswerDTO {
  machineId?: string;
  nome?: string;
  descricao?: string | null;
  status?: number;
}
