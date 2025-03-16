
export type QuestionType = 'theory' | 'objective';

export interface PredictionSettings {
  questionType: QuestionType;
  numberOfQuestions: number;
}

export interface ObjectiveOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  text: string;
  probability: number;
  source: string;
  type: QuestionType;
  options?: ObjectiveOption[];
  answer?: string;
}

export interface Prediction {
  id: string;
  date: string;
  title: string;
  questions: Question[];
  settings: PredictionSettings;
}
