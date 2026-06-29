export interface answerGroupItems {
  answerGroupId: string;
  answerId: string;
  ordem: number;
}

export interface CreateAnswerGroupItemsDTO {
  answerGroupId: string;
  answerId: string;
  ordem?: number;  
}

export interface UpdateAnswerGroupItemsDTO {
  answerGroupId: string;
  answerId: string;
  ordem?: number;  
}