export interface User {
  id: string;
  employeeId: string;
  username: string;
  email: string;
  status: number;
  dataCriacao: Date;
  dataAlteracao: Date;
}

export interface CreateUserDTO {
  employeeId: string;
  username: string;
  email: string; 
  status?: number;
}

export interface UpdateUserDTO {
  employeeId?: string;
  username?: string;
  email?: string;  
  status?: number;
}
