import { createEmptyCard, type Card } from "ts-fsrs";

/** Cột DB của srs_card ↔ Card của ts-fsrs. */
export type SrsColumns = {
  due: Date;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  learningSteps: number;
  reps: number;
  lapses: number;
  state: number;
  lastReview: Date | null;
};

export function cardToColumns(c: Card): SrsColumns {
  return {
    due: c.due,
    stability: c.stability,
    difficulty: c.difficulty,
    elapsedDays: c.elapsed_days,
    scheduledDays: c.scheduled_days,
    learningSteps: c.learning_steps,
    reps: c.reps,
    lapses: c.lapses,
    state: c.state,
    lastReview: c.last_review ?? null,
  };
}

export function columnsToCard(r: SrsColumns): Card {
  return {
    due: r.due,
    stability: r.stability,
    difficulty: r.difficulty,
    elapsed_days: r.elapsedDays,
    scheduled_days: r.scheduledDays,
    learning_steps: r.learningSteps,
    reps: r.reps,
    lapses: r.lapses,
    state: r.state,
    last_review: r.lastReview ?? undefined,
  };
}

/** Thẻ mới cho từ vừa thêm: đến hạn ngay. */
export const newCardColumns = (now = new Date()) => cardToColumns(createEmptyCard(now));
