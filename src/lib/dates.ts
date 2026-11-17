import { DAY_OFFSETS, DAYS_ORDER, DEFAULT_SEMESTER_START, MODULE_METADATA, DEFAULT_MODULE_COLOR } from './constants';
import { Session, Task, ModuleSummary } from '@/types';

/**
 * Parse YYYY-MM-DD into a UTC/local safe Date
 */
export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Add days to a Date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Get date for a specific week number (1-14) and day name ("Lundi"...)
 */
export function getDateForWeekAndDay(
  weekNum: number,
  dayName: string,
  startDateStr: string = DEFAULT_SEMESTER_START
): Date {
  const startDate = parseDate(startDateStr);
  const weekOffset = (weekNum - 1) * 7;
  const dayOffset = DAY_OFFSETS[dayName] ?? 0;
  return addDays(startDate, weekOffset + dayOffset);
}

/**
 * Format date range for a week: e.g. "16 Nov - 21 Nov 2026"
 */
export function getWeekDateRange(
  weekNum: number,
  startDateStr: string = DEFAULT_SEMESTER_START
): { start: Date; end: Date; label: string } {
  const monday = getDateForWeekAndDay(weekNum, 'Lundi', startDateStr);
  const saturday = getDateForWeekAndDay(weekNum, 'Samedi', startDateStr);

  const startDay = monday.getDate();
  const startMonth = monday.toLocaleDateString('fr-FR', { month: 'short' });
  const endDay = saturday.getDate();
  const endMonth = saturday.toLocaleDateString('fr-FR', { month: 'short' });
  const year = saturday.getFullYear();

  let label = '';
  if (startMonth === endMonth) {
    label = `${startDay} - ${endDay} ${startMonth} ${year}`;
  } else {
    label = `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
  }

  return { start: monday, end: saturday, label };
}

/**
 * Determine current week number (1 to 14) based on a target date (default: now)
 */
export function getCurrentWeekNumber(
  currentDate: Date = new Date(),
  startDateStr: string = DEFAULT_SEMESTER_START
): { weekNum: number; weekStr: string; isBefore: boolean; isAfter: boolean } {
  const startDate = parseDate(startDateStr);
  const currentMidnight = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate()
  );

  const diffMs = currentMidnight.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { weekNum: 1, weekStr: 'S1', isBefore: true, isAfter: false };
  }

  const computedWeek = Math.floor(diffDays / 7) + 1;

  if (computedWeek > 14) {
    return { weekNum: 14, weekStr: 'S14', isBefore: false, isAfter: true };
  }

  return {
    weekNum: computedWeek,
    weekStr: `S${computedWeek}`,
    isBefore: false,
    isAfter: false,
  };
}

/**
 * Get current day name in French: e.g. "Lundi", "Mardi", ...
 */
export function getCurrentDayName(currentDate: Date = new Date()): string {
  const day = currentDate.getDay(); // 0 is Dimanche, 1 is Lundi, ...
  const map: Record<number, string> = {
    1: 'Lundi',
    2: 'Mardi',
    3: 'Mercredi',
    4: 'Jeudi',
    5: 'Vendredi',
    6: 'Samedi',
    0: 'Dimanche',
  };
  return map[day] || 'Lundi';
}

/**
 * Parse time slot "17h00 à 18h50" -> { startH: 17, startM: 0, endH: 18, endM: 50, startTime: "17:00", endTime: "18:50" }
 */
export function parseHoraire(horaire: string): {
  startH: number;
  startM: number;
  endH: number;
  endM: number;
  startTime: string;
  endTime: string;
} {
  // Regex to extract hours and minutes
  const match = horaire.match(/(\d{1,2})h(\d{2})\s*(?:à|-)\s*(\d{1,2})h(\d{2})/i);
  if (match) {
    const startH = parseInt(match[1], 10);
    const startM = parseInt(match[2], 10);
    const endH = parseInt(match[3], 10);
    const endM = parseInt(match[4], 10);
    return {
      startH,
      startM,
      endH,
      endM,
      startTime: `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`,
      endTime: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
    };
  }
  return {
    startH: 8,
    startM: 30,
    endH: 10,
    endM: 20,
    startTime: '08:30',
    endTime: '10:20',
  };
}

/**
 * Get concrete start and end Date objects for a session in the semester
 */
export function getSessionAbsoluteDates(
  session: Session,
  startDateStr: string = DEFAULT_SEMESTER_START
): { start: Date; end: Date } {
  const dayDate = getDateForWeekAndDay(session.weekNum, session.jour, startDateStr);
  const time = parseHoraire(session.horaire);

  const start = new Date(dayDate);
  start.setHours(time.startH, time.startM, 0, 0);

  const end = new Date(dayDate);
  end.setHours(time.endH, time.endM, 0, 0);

  return { start, end };
}

export interface SessionHeroStatus {
  session: Session;
  isOngoing: boolean;
  startDate: Date;
  endDate: Date;
  timeRemainingText: string;
  startsInMinutes: number;
}

/**
 * Find current or next session
 */
export function getHeroSession(
  sessions: Session[],
  now: Date = new Date(),
  startDateStr: string = DEFAULT_SEMESTER_START
): SessionHeroStatus | null {
  const activeSessions = sessions.filter((s) => !s.isCancelled);
  if (!activeSessions.length) return null;

  const mapped = activeSessions.map((session) => {
    const { start, end } = getSessionAbsoluteDates(session, startDateStr);
    return {
      session,
      start,
      end,
    };
  });

  const nowMs = now.getTime();

  // 1. Check if there's an ongoing session
  const ongoing = mapped.find(
    (item) => nowMs >= item.start.getTime() && nowMs <= item.end.getTime()
  );

  if (ongoing) {
    const remainingMs = ongoing.end.getTime() - nowMs;
    const remainingMins = Math.max(1, Math.round(remainingMs / 60000));
    const hours = Math.floor(remainingMins / 60);
    const mins = remainingMins % 60;
    const timeRemainingText =
      hours > 0 ? `Finit dans ${hours}h ${mins}m` : `Finit dans ${mins} min`;

    return {
      session: ongoing.session,
      isOngoing: true,
      startDate: ongoing.start,
      endDate: ongoing.end,
      timeRemainingText,
      startsInMinutes: 0,
    };
  }

  // 2. Otherwise find next upcoming session
  const upcoming = mapped
    .filter((item) => item.start.getTime() > nowMs)
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  if (upcoming.length > 0) {
    const next = upcoming[0];
    const diffMs = next.start.getTime() - nowMs;
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    let timeRemainingText = '';
    if (diffMins < 60) {
      timeRemainingText = `Dans ${diffMins} min`;
    } else if (diffHours < 24) {
      const remMins = diffMins % 60;
      timeRemainingText = `Dans ${diffHours}h ${remMins > 0 ? remMins + 'm' : ''}`;
    } else if (diffDays === 1) {
      timeRemainingText = `Demain à ${next.session.startTime}`;
    } else {
      const dayName = next.session.jour;
      timeRemainingText = `${dayName} à ${next.session.startTime}`;
    }

    return {
      session: next.session,
      isOngoing: false,
      startDate: next.start,
      endDate: next.end,
      timeRemainingText,
      startsInMinutes: diffMins,
    };
  }

  // If all sessions in the semester are in the past, return the last one
  const last = mapped.sort((a, b) => b.start.getTime() - a.start.getTime())[0];
  return {
    session: last.session,
    isOngoing: false,
    startDate: last.start,
    endDate: last.end,
    timeRemainingText: 'Semestre terminé',
    startsInMinutes: -1,
  };
}

/**
 * Compute module summaries (progress and metrics)
 */
export function computeModuleSummaries(
  sessions: Session[],
  tasks: Task[],
  semesterStartDate: string = DEFAULT_SEMESTER_START
): ModuleSummary[] {
  const activeSessions = sessions.filter((s) => !s.isCancelled);
  const now = new Date();
  const codes = ['M111', 'M112', 'M113', 'M114', 'M115', 'M117'];

  return codes.map((code) => {
    const meta = MODULE_METADATA[code];
    const moduleSessions = activeSessions.filter((s) => s.moduleCode === code);
    const moduleTasks = tasks.filter((t) => t.moduleCode === code);

    let completedSessions = 0;
    moduleSessions.forEach((s) => {
      const timeParsed = parseHoraire(s.horaire);
      const [year, month, day] = semesterStartDate.split('-').map(Number);
      const startD = new Date(year, month - 1, day);
      startD.setDate(startD.getDate() + (s.weekNum - 1) * 7 + s.dayIndex);
      startD.setHours(timeParsed.endH, timeParsed.endM, 0, 0);

      if (startD.getTime() < now.getTime()) {
        completedSessions++;
      }
    });

    const completedTasks = moduleTasks.filter((t) => t.completed).length;

    return {
      code,
      title: meta?.title || code,
      color: meta?.color || DEFAULT_MODULE_COLOR,
      totalSessions: moduleSessions.length,
      completedSessions,
      totalTasks: moduleTasks.length,
      completedTasks,
    };
  });
}

