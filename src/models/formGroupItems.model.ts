export interface formGroupItems {
  formGroupId: string;
  formId: string;
  ordem: number;
}

export interface CreateFormGroupItemsDTO {
  formGroupId: string;
  formId: string;
  ordem?: number;  
}

export interface UpdateFormGroupItemsDTO {
  formGroupId: string;
  formId: string;
  ordem?: number;  
}