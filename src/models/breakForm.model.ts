export interface BreakForm {
  id: string;
  formId: string;
  horaInicio: Date;
  horaFim: Date | null;
  motivo: string;
  status: number;
  dataCriacao: Date;
  dataAlteracao: Date;
}

export interface CreateBreakFormDTO {
  formId: string;
  horaInicio: Date;
  horaFim: Date | null;
  motivo?: string;
  status?: number;
}

export interface UpdateBreakFormDTO {
  formId?: string;
  horaInicio?: Date;
  horaFim?: Date | null;  
  motivo?: string;
  status?: number;
}
