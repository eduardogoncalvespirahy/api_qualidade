export interface FormGroups {
  id: string;
  sectionId: string;
  nome: string;
  descricao: string | null;
  status: number;
  dataCriacao: Date;
  dataAlteracao: Date;
}

export interface CreateFormGroupsDTO {
  sectionId?: string;
  nome?: string;
  descricao?: string | null;
  status?: number;
}

export interface UpdateFormGroupsDTO {
  sectionId?: string;
  nome?: string;
  descricao?: string | null;
  status?: number;
}
