export interface BreakMachine {
  id: string;
  machineId: string;
  horaInicio: Date;
  horaFim: Date;
  motivo: string | null;
  status: number;
  dataCriacao: Date;
  dataAlteracao: Date;
}

export interface CreateBreakMachineDTO {
  machineId: string;
  horaInicio: Date;
  horaFim: Date;
  motivo?: string | null;
  status?: number;
}

export interface UpdateBreakMachineDTO {
  machineId?: string;
  horaInicio: Date;
  horaFim: Date;  
  motivo?: string | null;
  status?: number;
}
