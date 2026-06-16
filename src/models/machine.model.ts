export interface Machine {
  id: string;
  formId: string;
  nome: string;
  descricao: string | null;
  status: number;
  dataCriacao: Date;
  dataAlteracao: Date;
}

export interface CreateMachineDTO {
  formId: string;
  nome: string;
  descricao?: string | null;
  status?: number;
}

export interface UpdateMachineDTO {
  formId?: string;
  nome?: string;
  descricao?: string | null;
  status?: number;
}
