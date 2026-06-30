export interface Control {
  id: string;
  formId: string;
  userId: string;
  fileId: string;
  observacao: string | null;
  dataEmissao: Date;
  dataCriacao: Date;
  dataAlteracao: Date;
}

export interface CreateControlDTO {
  formId: string;
  userId: string;
  fileId: string;  
  observacao?: string | null;
  dataEmissao?: Date;
}

export interface UpdateControlDTO {
  formId?: string;
  userId: string;
  fileId: string;  
  observacao?: string | null;
  dataEmissao?: Date;  
}
