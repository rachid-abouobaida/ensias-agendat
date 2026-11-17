export type ModeType = 'P' | 'D' | 'NEANT';

export type PriorityType = 'low' | 'medium' | 'high';

export interface Session {
  id: string;
  semaine: string; // e.g. "S1", "S7"
  weekNum: number; // 1 to 14
  jour: string; // "Lundi", "Mardi", etc.
  dayIndex: number; // 0 for Lundi, 1 for Mardi, ..., 5 for Samedi
  horaire: string; // e.g. "17h00 à 18h50"
  startTime: string; // e.g. "17:00"
  endTime: string; // e.g. "18:50"
  moduleCode: string; // e.g. "M113"
  moduleTitle: string; // Clean short/standard title
  moduleRaw: string; // Full raw module line from CSV
  professeur: string;
  salle: string;
  mode: ModeType;
  groupNote?: string; // e.g. "SDSI", "GLI&IA et SDSI"
  isCancelled?: boolean;
  isCustom?: boolean; // added makeup session
  notes?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  moduleCode: string;
  sessionId?: string; // link to session
  semaine?: string; // e.g. "S7"
  dueDate?: string; // YYYY-MM-DD
  priority: PriorityType;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  semesterStartDate: string; // YYYY-MM-DD, default "2026-10-05"
  theme?: 'dark' | 'light' | 'system';
}

export interface ModuleSummary {
  code: string;
  title: string;
  color: {
    bg: string;
    text: string;
    border: string;
    badge: string;
    glow: string;
    accent: string;
  };
  totalSessions: number;
  completedSessions: number;
  totalTasks: number;
  completedTasks: number;
}

