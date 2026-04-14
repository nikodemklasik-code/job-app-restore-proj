export interface CoachReport {
  quotes: string[];
  score: number;
  star: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
  competencies: string[];
  strengthenFocus: string[];
  practiceNext: string[];
  disclaimer: string;
  goldenAnswer?: string;
}
