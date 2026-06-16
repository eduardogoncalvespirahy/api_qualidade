export interface CostCenter {
  id: string;
  name: string | null;
}

export interface CreateCostCenterDTO {
  id: string;
  name?: string | null;
}

export interface UpdateCostCenterDTO {
  name?: string | null;
}
