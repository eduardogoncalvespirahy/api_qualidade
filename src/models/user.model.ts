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

export interface UserProfile {
  userId: string;
  userUsername: string;
  userEmail: string;
  userStatus: number;

  employeeId: string;
  employeeNome: string;
  employeeMatricula: string;
  employeeDataAdmissao: Date | string;

  employerId: string;

  locationId: string;
  locationName: string;

  departmentId: string;
  departmentNome: string;

  jobPositionId: string;
  jobPositionNome: string;

  workstationGroupId: string;
  workstationGroupNome: string;

  workshiftId: string;
  workshiftDescricao: string;

  costCenterId: string;
  costCenterNome: string;

  ultimaSincronizacao: Date | string | null;
}