import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  AppSettings,
  ModeType,
  ModuleSummary,
  PriorityType,
  Session,
  Task,
} from '@/types';
import {
  DEFAULT_SEMESTER_START,
  DAY_OFFSETS,
  MODULE_METADATA,
  DEFAULT_MODULE_COLOR,
} from './constants';
import { parseHoraire } from './dates';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'agenda_db.json');
const CSV_FILE = path.join(DATA_DIR, 'emploi_du_temps_SDSI_S1_S14.csv');

interface DatabaseSchema {
  sessions: Session[];
  tasks: Task[];
  settings: AppSettings;
  /** SHA-256 hash of the CSV content used to detect changes */
  csvHash?: string;
}

/**
 * Clean string and strip BOM
 */
function cleanString(str: string): string {
  return str.replace(/^\uFEFF/, '').trim();
}

/**
 * Compute SHA-256 hash of content for change detection
 */
function computeHash(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Extract module code and clean title
 */
function parseModuleInfo(rawModule: string): {
  moduleCode: string;
  moduleTitle: string;
  groupNote?: string;
} {
  const matchCode = rawModule.match(/(M11\d)/i);
  const moduleCode = matchCode ? matchCode[1].toUpperCase() : 'M111';

  // Extract group notes if present: e.g. "(GLI&IA et SDSI)" or "(SDSI)"
  let groupNote: string | undefined;
  const matchGroup = rawModule.match(/\((.*?)\)/);
  if (matchGroup) {
    groupNote = matchGroup[1].trim();
  }

  // Clean title directly from CSV string
  const strippedTitle = rawModule.replace(/^M11\d\s*/i, '').replace(/\(.*?\)/, '').trim();
  const moduleTitle = strippedTitle || MODULE_METADATA[moduleCode]?.title || rawModule;

  return { moduleCode, moduleTitle, groupNote };
}

/**
 * Parse CSV file into Session objects
 */
export function parseScheduleCsv(csvContent: string): Session[] {
  const cleanContent = cleanString(csvContent);
  const lines = cleanContent.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length <= 1) return [];

  const sessions: Session[] = [];
  const idCounters: Record<string, number> = {};

  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(';').map((c) => c.trim());
    if (cols.length < 7) continue;

    const [semaineRaw, jour, horaire, moduleRaw, professeur, salle, modeRaw] = cols;
    const weekNumMatch = semaineRaw.match(/\d+/);
    const weekNum = weekNumMatch ? parseInt(weekNumMatch[0], 10) : 1;
    const semaine = `S${weekNum}`;

    const { moduleCode, moduleTitle, groupNote } = parseModuleInfo(moduleRaw);
    const timeParsed = parseHoraire(horaire);

    const mode: ModeType =
      modeRaw === 'P' || modeRaw === 'D' ? (modeRaw as ModeType) : 'NEANT';

    const dayIndex = DAY_OFFSETS[jour] ?? 0;

    // Build unique ID
    const baseId = `${semaine}-${jour.toLowerCase()}-${timeParsed.startTime.replace(':', '')}-${moduleCode.toLowerCase()}`;
    idCounters[baseId] = (idCounters[baseId] || 0) + 1;
    const id = `${baseId}-${idCounters[baseId]}`;

    sessions.push({
      id,
      semaine,
      weekNum,
      jour,
      dayIndex,
      horaire,
      startTime: timeParsed.startTime,
      endTime: timeParsed.endTime,
      moduleCode,
      moduleTitle,
      moduleRaw,
      professeur,
      salle,
      mode,
      groupNote,
      isCancelled: false,
      isCustom: false,
    });
  }

  return sessions;
}

/**
 * Read raw CSV from disk
 */
export function readOriginalCsv(): string {
  if (!fs.existsSync(CSV_FILE)) {
    throw new Error(`CSV file not found at ${CSV_FILE}`);
  }
  return fs.readFileSync(CSV_FILE, 'utf8');
}

/**
 * Atomic write to JSON file
 */
function writeDbFile(data: DatabaseSchema): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tempFile, DB_FILE);
}

/**
 * Reconcile CSV-sourced sessions with user modifications from the DB.
 * - CSV sessions are the canonical source of truth for schedule data
 * - User modifications (isCancelled) are preserved by matching session IDs
 * - Custom sessions (isCustom) added by the user are kept as-is
 */
function reconcileSessions(
  csvSessions: Session[],
  dbSessions: Session[]
): Session[] {
  // Build a lookup of user modifications from the DB
  const dbModifications = new Map<string, { isCancelled: boolean }>();
  const customSessions: Session[] = [];

  for (const dbSession of dbSessions) {
    if (dbSession.isCustom) {
      // Custom sessions are user-created, keep them entirely
      customSessions.push(dbSession);
    } else if (dbSession.isCancelled) {
      // Track cancelled status by session ID
      dbModifications.set(dbSession.id, { isCancelled: true });
    }
  }

  // Apply user modifications to CSV sessions
  const reconciledCsvSessions = csvSessions.map((csvSession) => {
    const modification = dbModifications.get(csvSession.id);
    if (modification) {
      return { ...csvSession, isCancelled: modification.isCancelled };
    }
    return csvSession;
  });

  // Append custom sessions after CSV sessions
  return [...reconciledCsvSessions, ...customSessions];
}

/**
 * Load database with strict CSV-first data integrity.
 * 
 * STRATEGY: The CSV file is always the single source of truth for schedule data.
 * On every load:
 * 1. Parse the CSV fresh
 * 2. Compute its hash to detect changes
 * 3. If the DB exists, reconcile user modifications (cancelled, custom sessions)
 * 4. Always write back the reconciled data to keep DB in sync
 * 
 * This guarantees the UI always reflects the latest CSV content.
 */
export function getDatabase(): DatabaseSchema {
  const csvContent = readOriginalCsv();
  const csvHash = computeHash(csvContent);
  const csvSessions = parseScheduleCsv(csvContent);

  // Try to load existing DB for user modifications and tasks
  let existingDb: DatabaseSchema | null = null;
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf8');
      const data = JSON.parse(content) as DatabaseSchema;
      if (data && Array.isArray(data.sessions)) {
        existingDb = data;
      }
    } catch (err) {
      console.error('Error reading DB_FILE, re-seeding from CSV:', err);
    }
  }

  // If DB exists and CSV hasn't changed, return existing data
  // (sessions are already in sync since we wrote them from CSV)
  if (existingDb && existingDb.csvHash === csvHash) {
    return existingDb;
  }

  // CSV changed or DB doesn't exist: reconcile and write
  console.log(
    existingDb
      ? `CSV change detected (hash mismatch). Re-syncing ${csvSessions.length} sessions from CSV source of truth.`
      : `Initializing database from CSV with ${csvSessions.length} sessions.`
  );

  const reconciledSessions = existingDb
    ? reconcileSessions(csvSessions, existingDb.sessions)
    : csvSessions;

  const db: DatabaseSchema = {
    sessions: reconciledSessions,
    tasks: existingDb?.tasks || [],
    settings: existingDb?.settings || {
      semesterStartDate: DEFAULT_SEMESTER_START,
      theme: 'dark',
    },
    csvHash,
  };

  writeDbFile(db);
  return db;
}

/**
 * Reset database from original CSV (force full re-sync, discarding user session modifications)
 */
export function resetDatabaseFromCsv(): DatabaseSchema {
  const csvContent = readOriginalCsv();
  const csvHash = computeHash(csvContent);
  const sessions = parseScheduleCsv(csvContent);

  const currentDb = fs.existsSync(DB_FILE)
    ? (JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) as DatabaseSchema)
    : null;

  const newDb: DatabaseSchema = {
    sessions,
    tasks: currentDb?.tasks || [],
    settings: currentDb?.settings || {
      semesterStartDate: DEFAULT_SEMESTER_START,
      theme: 'dark',
    },
    csvHash,
  };

  writeDbFile(newDb);
  return newDb;
}

/**
 * Export sessions to CSV format matching original structure
 */
export function exportSessionsToCsv(sessions: Session[]): string {
  const header = 'Semaine;Jour;Horaire;Module;Professeur;Salle;Mode';
  const rows = sessions
    .filter((s) => !s.isCancelled)
    .sort((a, b) => {
      if (a.weekNum !== b.weekNum) return a.weekNum - b.weekNum;
      if (a.dayIndex !== b.dayIndex) return a.dayIndex - b.dayIndex;
      return a.startTime.localeCompare(b.startTime);
    })
    .map((s) => {
      const moduleStr = s.moduleRaw || `${s.moduleCode} ${s.moduleTitle}`;
      return `${s.semaine};${s.jour};${s.horaire};${moduleStr};${s.professeur};${s.salle};${s.mode}`;
    });

  return [header, ...rows].join('\n');
}

// -------------------------------------------------------------
// CRUD Operations
// -------------------------------------------------------------

export function getAllSessions(): Session[] {
  const db = getDatabase();
  return db.sessions;
}

export function saveSession(session: Session): Session {
  const db = getDatabase();
  const index = db.sessions.findIndex((s) => s.id === session.id);

  if (index >= 0) {
    db.sessions[index] = { ...db.sessions[index], ...session };
  } else {
    db.sessions.push(session);
  }

  writeDbFile(db);
  return session;
}

export function deleteSession(id: string): boolean {
  const db = getDatabase();
  const index = db.sessions.findIndex((s) => s.id === id);
  if (index >= 0) {
    // If it's a custom session, remove it; if it's standard, mark cancelled
    if (db.sessions[index].isCustom) {
      db.sessions.splice(index, 1);
    } else {
      db.sessions[index].isCancelled = true;
    }
    writeDbFile(db);
    return true;
  }
  return false;
}

export function getAllTasks(): Task[] {
  const db = getDatabase();
  return db.tasks;
}

export function saveTask(task: Task): Task {
  const db = getDatabase();
  const index = db.tasks.findIndex((t) => t.id === task.id);

  const now = new Date().toISOString();
  if (index >= 0) {
    db.tasks[index] = {
      ...db.tasks[index],
      ...task,
      updatedAt: now,
    };
  } else {
    const newTask = {
      ...task,
      id: task.id || `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now,
    };
    db.tasks.push(newTask);
    writeDbFile(db);
    return newTask;
  }

  writeDbFile(db);
  return db.tasks[index];
}

export function deleteTask(id: string): boolean {
  const db = getDatabase();
  const initialLen = db.tasks.length;
  db.tasks = db.tasks.filter((t) => t.id !== id);
  if (db.tasks.length !== initialLen) {
    writeDbFile(db);
    return true;
  }
  return false;
}

export function getSettings(): AppSettings {
  const db = getDatabase();
  return db.settings || { semesterStartDate: DEFAULT_SEMESTER_START, theme: 'dark' };
}

export function updateSettings(settings: Partial<AppSettings>): AppSettings {
  const db = getDatabase();
  db.settings = { ...db.settings, ...settings };
  writeDbFile(db);
  return db.settings;
}

export function getModuleSummaries(): ModuleSummary[] {
  const db = getDatabase();
  const sessions = db.sessions.filter((s) => !s.isCancelled);
  const tasks = db.tasks;

  const now = new Date();
  const startDate = db.settings?.semesterStartDate || DEFAULT_SEMESTER_START;

  const codes = ['M111', 'M112', 'M113', 'M114', 'M115', 'M117'];

  return codes.map((code) => {
    const meta = MODULE_METADATA[code];
    const moduleSessions = sessions.filter((s) => s.moduleCode === code);
    const moduleTasks = tasks.filter((t) => t.moduleCode === code);

    // Count how many sessions are already in the past
    let completedSessions = 0;
    moduleSessions.forEach((s) => {
      const timeParsed = parseHoraire(s.horaire);
      const [year, month, day] = startDate.split('-').map(Number);
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
