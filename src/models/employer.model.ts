export interface Employer {
  id: string;
  tradingName: string | null;
}

export interface CreateEmployerDTO {
  id: string;
  tradingName?: string | null;
}

export interface UpdateEmployerDTO {
  tradingName?: string | null;
}
