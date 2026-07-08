export interface BreakMachine {
  id: string;
  machineId: string;
  horaInicio?: Date;
  horaFim: Date | null;
  motivo: string;
  status: number;
  dataCriacao: Date;
  dataAlteracao: Date;
}

export interface CreateBreakMachineDTO {
  machineId: string;
  horaInicio?: Date;
  horaFim: Date | null;
  motivo?: string;
  status?: number;
}

export interface UpdateBreakMachineDTO {
  machineId?: string;
  horaInicio?: Date ;
  horaFim?: Date | null;  
  motivo?: string;
  status?: number;
}
