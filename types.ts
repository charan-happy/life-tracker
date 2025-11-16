
export type View = 'Dashboard' | 'Ideas' | 'Daily' | 'Weekly' | 'Monthly' | 'Yearly' | 'Habits';

export interface Idea {
  id: string;
  text: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  text: string;
  completed: boolean;
}

export interface LearningLink {
    id: string;
    url: string;
    description: string;
}

export interface ReviewEntry {
    id: string;
    text: string;
}

export interface TimeFrameData {
  goals: Goal[];
  achievements: ReviewEntry[];
  challenges: ReviewEntry[];
  reflections: ReviewEntry[];
  learnings: ReviewEntry[];
  people: ReviewEntry[];
  learningLinks: LearningLink[];
}

export type Period = 'Weekly' | 'Monthly' | 'Yearly';

export interface Habit {
    id: string;
    name: string;
    // e.g., for a weekly view, an array of 7 booleans
    progress: boolean[]; 
    goal: number; // e.g., 5 times a week
}

export type ReviewCategory = 'achievements' | 'challenges' | 'reflections' | 'learnings' | 'people';

export interface DailyTaskHistoryEntry {
  date: string; // YYYY-MM-DD
  progress?: string;
  status: 'open' | 'done';
}

export interface DailyTask {
  id: string;
  title: string;
  createdAt: string; // ISO
  status: 'open' | 'done';
  history: DailyTaskHistoryEntry[];
}
