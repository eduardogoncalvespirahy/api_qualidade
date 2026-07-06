export interface Status {
  id: string;
  nome: string;
  status: number;
  dataCriacao: Date;
  dataAlteracao: Date;
}

export interface CreateStatusDTO {
  nome: string;
  status: number;
  dataCriacao: Date;
  dataAlteracao: Date;
}

export interface UpdateStatusDTO {
  nome: string;
  status: number;
  dataCriacao: Date;
  dataAlteracao: Date;
}
