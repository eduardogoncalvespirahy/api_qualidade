export interface FormTime {
  formId?: string;
  tempoExecucao: number;
  tempoTolerancia?: number;
  tempoAntecependem?:number;
}

export interface CreateFormTimeDTO {
  formId?: string;
  tempoExecucao: number;
  tempoTolerancia?: number;
  tempoAntecependem?:number;
}

export interface UpdateFormTimeDTO {
  formId?: string;
  tempoExecucao: number;
  tempoTolerancia?: number;
  tempoAntecependem?:number;
}
