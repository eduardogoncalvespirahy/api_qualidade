export interface JobPosition {
  id: string;
  name: string | null;
}

export interface CreateJobPositionDTO {
  id: string;
  name?: string | null;
}

export interface UpdateJobPositionDTO {
  name?: string | null;
}
