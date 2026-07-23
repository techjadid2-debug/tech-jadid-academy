export type QuizSeed = {
  prompt: string;
  correct: string;
  wrong: [string, string, string];
  explanation: string;
};

export const q = (
  prompt: string,
  correct: string,
  wrong: [string, string, string],
  explanation = correct,
): QuizSeed => ({ prompt, correct, wrong, explanation });

export type QuizBank = Record<number, QuizSeed[]>;
