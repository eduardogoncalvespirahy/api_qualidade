export interface Department {
  id: string;
  name: string | null;
}

export interface CreateDepartmentDTO {
  id: string;
  name?: string | null;
}

export interface UpdateDepartmentDTO {
  name?: string | null;
}
