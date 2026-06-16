export interface WorkstationGroup {
  id: string;
  name: string | null;
}

export interface CreateWorkstationGroupDTO {
  id: string;
  name?: string | null;
}

export interface UpdateWorkstationGroupDTO {
  name?: string | null;
}
