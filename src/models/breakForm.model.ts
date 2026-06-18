export interface BreakForm {
  id: string;
  formId: string;
  horaInicio: Date;
  horaFim: Date;
  motivo: string | null;
  status: number;
  dataCriacao: Date;
  dataAlteracao: Date;
}

export interface CreateBreakFormDTO {
  formId: string;
  horaInicio: Date;
  horaFim: Date;
  motivo?: string | null;
  status?: number;
}

export interface UpdateBreakFormDTO {
  formId?: string;
  horaInicio: Date;
  horaFim: Date;  
  motivo?: string | null;
  status?: number;
}
