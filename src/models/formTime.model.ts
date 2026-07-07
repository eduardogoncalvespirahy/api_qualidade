export interface FormTime {
  formId: string;
  tempoExecucao: string;
  tempoTolerancia: string;
  tempoAntecedencia: string;
  dataCriacao: Date;
  dataAlteracao: Date;
}

export interface CreateFormTimeDTO {
  formId: string;
  tempoExecucao: string;
  tempoTolerancia: string;
  tempoAntecedencia?: string;
}

export interface UpdateFormTimeDTO {
  tempoExecucao?: string;
  tempoTolerancia?: string;
  tempoAntecedencia?: string;
}