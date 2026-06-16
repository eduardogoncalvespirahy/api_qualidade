export interface Workshift {
  id: string;
  description: string | null;
}

export interface CreateWorkshiftDTO {
  id: string;
  description?: string | null;
}

export interface UpdateWorkshiftDTO {
  description?: string | null;
}
