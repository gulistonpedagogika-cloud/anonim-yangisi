export type QuestionType = 'rating' | 'single' | 'multiple';

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[]; // For single and multiple choice
}

export interface Survey {
  id: string;
  title: string;
  code: string;
  questions: Question[];
  createdAt: number;
}

export interface Response {
  id: string;
  surveyId: string;
  answers: {
    questionId: string;
    value: number | string | string[]; // number for rating, string for single, string[] for multiple
  }[];
  submittedAt: number;
}
