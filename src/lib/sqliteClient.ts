'use client';

import { AppSettings, Session, Task } from '@/types';
import { DEFAULT_SEMESTER_START } from './constants';

// We dynamically import sql.js on the client to avoid SSR issues
type SqlJsDatabase = any;
type SqlJsStatic = any;

let SQL: SqlJsStatic | null = null;
let db: SqlJsDatabase | null = null;
let isInitializing = false;
let initPromise: Promise<boolean> | null = null;

const IDB_NAME = 'sdsi_agenda_pwa_db';
const IDB_STORE = 'sqlite_store';
const IDB_KEY = 'sqlite_binary';

/**
 * Open or create IndexedDB instance for SQLite binary storage
 */
function openIndexedDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB indisponible'));
    }
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      const idb = request.result;
      if (!idb.objectStoreNames.contains(IDB_STORE)) {
        idb.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Persist SQLite binary into IndexedDB
 */
async function saveBinaryToIndexedDb(binary: Uint8Array): Promise<void> {
  try {
    const idb = await openIndexedDb();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put(binary, IDB_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Erreur sauvegarde IndexedDB, fallback localStorage:', err);
    try {
      if (typeof window !== 'undefined' && binary.length < 4 * 1024 * 1024) {
        // Fallback base64 for small databases if IDB fails
        let binaryStr = '';
        const len = binary.byteLength;
        for (let i = 0; i < len; i++) {
          binaryStr += String.fromCharCode(binary[i]);
        }
        localStorage.setItem('sdsi_sqlite_binary_b64', btoa(binaryStr));
      }
    } catch (lsErr) {
      console.warn('Fallback localStorage a échoué:', lsErr);
    }
  }
}

/**
 * Load SQLite binary from IndexedDB
 */
async function loadBinaryFromIndexedDb(): Promise<Uint8Array | null> {
  try {
    const idb = await openIndexedDb();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(IDB_KEY);
      req.onsuccess = () => {
        if (req.result instanceof Uint8Array) {
          resolve(req.result);
        } else if (req.result) {
          resolve(new Uint8Array(req.result));
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Try localStorage fallback
    try {
      if (typeof window !== 'undefined') {
        const b64 = localStorage.getItem('sdsi_sqlite_binary_b64');
        if (b64) {
          const binaryStr = atob(b64);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          return bytes;
        }
      }
    } catch {}
    return null;
  }
}

/**
 * Commit current in-memory SQLite state to IndexedDB storage
 */
export async function commitSqliteDb(): Promise<void> {
  if (!db) return;
  try {
    const binary = db.export();
    await saveBinaryToIndexedDb(binary);
  } catch (err) {
    console.error('Erreur export/sauvegarde base SQLite:', err);
  }
}

/**
 * Create tables in SQLite if they do not exist
 */
function createSchema(database: SqlJsDatabase): void {
  database.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      semaine TEXT,
      weekNum INTEGER,
      jour TEXT,
      dayIndex INTEGER,
      horaire TEXT,
      startTime TEXT,
      endTime TEXT,
      moduleCode TEXT,
      moduleTitle TEXT,
      moduleRaw TEXT,
      professeur TEXT,
      salle TEXT,
      mode TEXT,
      groupNote TEXT,
      isCancelled INTEGER DEFAULT 0,
      isCustom INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      moduleCode TEXT NOT NULL,
      sessionId TEXT,
      semaine TEXT,
      dueDate TEXT,
      priority TEXT DEFAULT 'medium',
      completed INTEGER DEFAULT 0,
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      payload TEXT,
      timestamp TEXT NOT NULL,
      status TEXT DEFAULT 'pending'
    );
  `);
}

/**
 * Seed SQLite database from data/agenda_db.json object
 */
export function seedFromJsonObject(database: SqlJsDatabase, data: any): void {
  createSchema(database);

  // Insert Sessions
  const insertSessionStmt = database.prepare(`
    INSERT OR REPLACE INTO sessions (
      id, semaine, weekNum, jour, dayIndex, horaire,
      startTime, endTime, moduleCode, moduleTitle, moduleRaw,
      professeur, salle, mode, groupNote, isCancelled, isCustom
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  if (Array.isArray(data.sessions)) {
    for (const s of data.sessions) {
      insertSessionStmt.run([
        s.id,
        s.semaine,
        s.weekNum,
        s.jour,
        s.dayIndex,
        s.horaire,
        s.startTime,
        s.endTime,
        s.moduleCode,
        s.moduleTitle,
        s.moduleRaw || '',
        s.professeur || '',
        s.salle || '',
        s.mode || 'NEANT',
        s.groupNote || null,
        s.isCancelled ? 1 : 0,
        s.isCustom ? 1 : 0,
      ]);
    }
  }
  insertSessionStmt.free();

  // Insert Tasks
  const insertTaskStmt = database.prepare(`
    INSERT OR REPLACE INTO tasks (
      id, title, description, moduleCode, sessionId, semaine, dueDate, priority, completed, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  if (Array.isArray(data.tasks)) {
    for (const t of data.tasks) {
      insertTaskStmt.run([
        t.id,
        t.title,
        t.description || '',
        t.moduleCode || 'M111',
        t.sessionId || null,
        t.semaine || null,
        t.dueDate || '',
        t.priority || 'medium',
        t.completed ? 1 : 0,
        t.createdAt || new Date().toISOString(),
        t.updatedAt || new Date().toISOString(),
      ]);
    }
  }
  insertTaskStmt.free();

  // Insert Settings
  const insertSettingStmt = database.prepare(`
    INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)
  `);

  if (data.settings) {
    for (const [key, val] of Object.entries(data.settings)) {
      insertSettingStmt.run([key, typeof val === 'object' ? JSON.stringify(val) : String(val)]);
    }
  }
  if (data.csvHash) {
    insertSettingStmt.run(['csvHash', data.csvHash]);
  }
  insertSettingStmt.free();
}

/**
 * Initialize Client-Side SQLite Database
 */
export async function initSqliteClient(): Promise<boolean> {
  if (db) return true;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (typeof window === 'undefined') return false;

    try {
      // 1. Initialize sql.js WebAssembly
      if (!SQL) {
        // Dynamic import sql.js
        const initSqlJs = (await import('sql.js')).default;
        SQL = await initSqlJs({
          locateFile: (file: string) => `/${file}`,
        });
      }

      // 2. Check if a SQLite database is already persisted in IndexedDB
      const savedBinary = await loadBinaryFromIndexedDb();
      if (savedBinary && savedBinary.length > 0) {
        try {
          db = new SQL.Database(savedBinary);
          createSchema(db);
          console.log('✅ Base SQLite restaurée depuis IndexedDB locale (' + savedBinary.length + ' octets)');
          return true;
        } catch (e) {
          console.warn('Base IndexedDB corrompue, tentative de re-création:', e);
        }
      }

      // 3. Try fetching pre-compiled binary SQLite or data/agenda_db.json
      let initializedFromSource = false;

      // Option A: Try /data/agenda_db.sqlite
      try {
        const sqliteRes = await fetch('/data/agenda_db.sqlite');
        if (sqliteRes.ok) {
          const arrayBuffer = await sqliteRes.arrayBuffer();
          const binary = new Uint8Array(arrayBuffer);
          db = new SQL.Database(binary);
          createSchema(db);
          await commitSqliteDb();
          console.log('✅ Base SQLite initialisée depuis /data/agenda_db.sqlite (' + binary.length + ' octets)');
          initializedFromSource = true;
          return true;
        }
      } catch (err) {
        console.warn('Impossible de charger /data/agenda_db.sqlite, fallback agenda_db.json:', err);
      }

      // Option B: Try /data/agenda_db.json
      if (!initializedFromSource) {
        try {
          const jsonRes = await fetch('/data/agenda_db.json');
          if (jsonRes.ok) {
            const jsonData = await jsonRes.json();
            db = new SQL.Database();
            seedFromJsonObject(db, jsonData);
            await commitSqliteDb();
            console.log('✅ Base SQLite initialisée et générée depuis /data/agenda_db.json');
            return true;
          }
        } catch (err) {
          console.warn('Impossible de charger /data/agenda_db.json en ligne:', err);
        }
      }

      // Option C: Check localStorage fallback for cached sessions
      if (!db) {
        db = new SQL.Database();
        createSchema(db);

        const cachedSessions = localStorage.getItem('sdsi_sessions');
        const cachedTasks = localStorage.getItem('sdsi_tasks');
        const cachedSettings = localStorage.getItem('sdsi_settings');

        const fallbackData = {
          sessions: cachedSessions ? JSON.parse(cachedSessions) : [],
          tasks: cachedTasks ? JSON.parse(cachedTasks) : [],
          settings: cachedSettings ? JSON.parse(cachedSettings) : { semesterStartDate: DEFAULT_SEMESTER_START },
        };

        seedFromJsonObject(db, fallbackData);
        await commitSqliteDb();
        console.log('✅ Base SQLite initialisée depuis le cache local');
      }

      return true;
    } catch (err) {
      console.error('Erreur initialisation SQLite Client:', err);
      return false;
    } finally {
      isInitializing = false;
    }
  })();

  return initPromise;
}

// -------------------------------------------------------------
// SQLite CRUD Operations (Synchronous SQL execution on in-memory WASM)
// -------------------------------------------------------------

/**
 * Retrieve all sessions from the local SQLite database
 */
export function getSqliteSessions(): Session[] {
  if (!db) return [];

  try {
    const res = db.exec(`
      SELECT 
        id, semaine, weekNum, jour, dayIndex, horaire,
        startTime, endTime, moduleCode, moduleTitle, moduleRaw,
        professeur, salle, mode, groupNote, isCancelled, isCustom
      FROM sessions
      ORDER BY weekNum ASC, dayIndex ASC, startTime ASC
    `);

    if (!res || res.length === 0) return [];

    const { columns, values } = res[0];
    const sessions: Session[] = values.map((row: any[]) => {
      const obj: any = {};
      columns.forEach((col: string, idx: number) => {
        obj[col] = row[idx];
      });

      return {
        id: obj.id,
        semaine: obj.semaine,
        weekNum: Number(obj.weekNum),
        jour: obj.jour,
        dayIndex: Number(obj.dayIndex),
        horaire: obj.horaire,
        startTime: obj.startTime,
        endTime: obj.endTime,
        moduleCode: obj.moduleCode,
        moduleTitle: obj.moduleTitle,
        moduleRaw: obj.moduleRaw,
        professeur: obj.professeur,
        salle: obj.salle,
        mode: obj.mode,
        groupNote: obj.groupNote || undefined,
        isCancelled: Boolean(obj.isCancelled),
        isCustom: Boolean(obj.isCustom),
      };
    });

    return sessions;
  } catch (err) {
    console.error('Erreur lecture séances SQLite:', err);
    return [];
  }
}

/**
 * Save or update a session in SQLite
 */
export async function saveSqliteSession(session: Session): Promise<void> {
  if (!db) await initSqliteClient();
  if (!db) return;

  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO sessions (
        id, semaine, weekNum, jour, dayIndex, horaire,
        startTime, endTime, moduleCode, moduleTitle, moduleRaw,
        professeur, salle, mode, groupNote, isCancelled, isCustom
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      session.id,
      session.semaine,
      session.weekNum,
      session.jour,
      session.dayIndex,
      session.horaire,
      session.startTime,
      session.endTime,
      session.moduleCode,
      session.moduleTitle,
      session.moduleRaw || '',
      session.professeur || '',
      session.salle || '',
      session.mode || 'NEANT',
      session.groupNote || null,
      session.isCancelled ? 1 : 0,
      session.isCustom ? 1 : 0,
    ]);
    stmt.free();

    await commitSqliteDb();
  } catch (err) {
    console.error('Erreur sauvegarde séance SQLite:', err);
  }
}

/**
 * Delete or cancel a session in SQLite
 */
export async function deleteSqliteSession(sessionId: string): Promise<void> {
  if (!db) await initSqliteClient();
  if (!db) return;

  try {
    // Check if custom or standard
    const res = db.exec(`SELECT isCustom FROM sessions WHERE id = '${sessionId.replace(/'/g, "''")}'`);
    if (res && res.length > 0 && res[0].values.length > 0) {
      const isCustom = Boolean(res[0].values[0][0]);
      if (isCustom) {
        db.run(`DELETE FROM sessions WHERE id = ?`, [sessionId]);
      } else {
        db.run(`UPDATE sessions SET isCancelled = 1 WHERE id = ?`, [sessionId]);
      }
      await commitSqliteDb();
    }
  } catch (err) {
    console.error('Erreur suppression séance SQLite:', err);
  }
}

/**
 * Retrieve all tasks from the local SQLite database
 */
export function getSqliteTasks(): Task[] {
  if (!db) return [];

  try {
    const res = db.exec(`
      SELECT 
        id, title, description, moduleCode, sessionId, semaine, dueDate, priority, completed, createdAt, updatedAt
      FROM tasks
      ORDER BY createdAt DESC
    `);

    if (!res || res.length === 0) return [];

    const { columns, values } = res[0];
    return values.map((row: any[]) => {
      const obj: any = {};
      columns.forEach((col: string, idx: number) => {
        obj[col] = row[idx];
      });

      return {
        id: obj.id,
        title: obj.title,
        description: obj.description || undefined,
        moduleCode: obj.moduleCode || 'M111',
        sessionId: obj.sessionId || undefined,
        semaine: obj.semaine || undefined,
        dueDate: obj.dueDate || undefined,
        priority: obj.priority || 'medium',
        completed: Boolean(obj.completed),
        createdAt: obj.createdAt,
        updatedAt: obj.updatedAt,
      };
    });
  } catch (err) {
    console.error('Erreur lecture tâches SQLite:', err);
    return [];
  }
}

/**
 * Save or update a task in SQLite
 */
export async function saveSqliteTask(task: Task): Promise<Task> {
  if (!db) await initSqliteClient();
  if (!db) return task;

  const now = new Date().toISOString();
  const taskToSave: Task = {
    ...task,
    id: task.id || `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: task.createdAt || now,
    updatedAt: now,
  };

  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO tasks (
        id, title, description, moduleCode, sessionId, semaine, dueDate, priority, completed, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      taskToSave.id,
      taskToSave.title,
      taskToSave.description || '',
      taskToSave.moduleCode,
      taskToSave.sessionId || null,
      taskToSave.semaine || null,
      taskToSave.dueDate || '',
      taskToSave.priority || 'medium',
      taskToSave.completed ? 1 : 0,
      taskToSave.createdAt,
      taskToSave.updatedAt,
    ]);
    stmt.free();

    await commitSqliteDb();
    return taskToSave;
  } catch (err) {
    console.error('Erreur sauvegarde tâche SQLite:', err);
    return taskToSave;
  }
}

/**
 * Toggle task completed status in SQLite
 */
export async function toggleSqliteTask(taskId: string, completed: boolean): Promise<void> {
  if (!db) await initSqliteClient();
  if (!db) return;

  try {
    const now = new Date().toISOString();
    db.run(`UPDATE tasks SET completed = ?, updatedAt = ? WHERE id = ?`, [
      completed ? 1 : 0,
      now,
      taskId,
    ]);
    await commitSqliteDb();
  } catch (err) {
    console.error('Erreur bascule statut tâche SQLite:', err);
  }
}

/**
 * Delete task in SQLite
 */
export async function deleteSqliteTask(taskId: string): Promise<void> {
  if (!db) await initSqliteClient();
  if (!db) return;

  try {
    db.run(`DELETE FROM tasks WHERE id = ?`, [taskId]);
    await commitSqliteDb();
  } catch (err) {
    console.error('Erreur suppression tâche SQLite:', err);
  }
}

/**
 * Retrieve settings from SQLite
 */
export function getSqliteSettings(): AppSettings {
  if (!db) return { semesterStartDate: DEFAULT_SEMESTER_START, theme: 'dark' };

  try {
    const res = db.exec(`SELECT key, value FROM settings`);
    if (!res || res.length === 0) {
      return { semesterStartDate: DEFAULT_SEMESTER_START, theme: 'dark' };
    }

    const settings: any = { semesterStartDate: DEFAULT_SEMESTER_START, theme: 'dark' };
    res[0].values.forEach(([key, val]: any[]) => {
      settings[key] = val;
    });

    return settings;
  } catch (err) {
    console.error('Erreur lecture paramètres SQLite:', err);
    return { semesterStartDate: DEFAULT_SEMESTER_START, theme: 'dark' };
  }
}

/**
 * Update settings in SQLite
 */
export async function updateSqliteSettings(settings: Partial<AppSettings>): Promise<void> {
  if (!db) await initSqliteClient();
  if (!db) return;

  try {
    const stmt = db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`);
    for (const [k, v] of Object.entries(settings)) {
      stmt.run([k, String(v)]);
    }
    stmt.free();
    await commitSqliteDb();
  } catch (err) {
    console.error('Erreur mise à jour paramètres SQLite:', err);
  }
}

/**
 * Synchronize full dataset from server into SQLite
 */
export async function syncServerDataToSqlite(
  sessions: Session[],
  tasks: Task[],
  settings?: AppSettings
): Promise<void> {
  if (!db) await initSqliteClient();
  if (!db) return;

  try {
    seedFromJsonObject(db, {
      sessions,
      tasks,
      settings: settings || { semesterStartDate: DEFAULT_SEMESTER_START, theme: 'dark' },
    });
    await commitSqliteDb();
    console.log(`✅ Base SQLite synchronisée (${sessions.length} séances, ${tasks.length} tâches)`);
  } catch (err) {
    console.error('Erreur synchronisation SQLite depuis serveur:', err);
  }
}

/**
 * Re-seed SQLite from data/agenda_db.json explicitly
 */
export async function resetSqliteFromAgendaJson(): Promise<boolean> {
  try {
    const res = await fetch('/data/agenda_db.json');
    if (!res.ok) throw new Error('Impossible de charger /data/agenda_db.json');
    const data = await res.json();

    if (!db && SQL) {
      db = new SQL.Database();
    } else if (db) {
      db.run(`DROP TABLE IF EXISTS sessions; DROP TABLE IF EXISTS tasks; DROP TABLE IF EXISTS settings;`);
    }

    seedFromJsonObject(db, data);
    await commitSqliteDb();
    return true;
  } catch (err) {
    console.error('Erreur re-chargement SQLite depuis agenda_db.json:', err);
    return false;
  }
}

/**
 * Export the SQLite database as a downloadable .sqlite Blob
 */
export function exportSqliteBlob(): Blob | null {
  if (!db) return null;
  try {
    const binary = db.export();
    return new Blob([binary], { type: 'application/x-sqlite3' });
  } catch (err) {
    console.error('Erreur exportation SQLite binary:', err);
    return null;
  }
}

/**
 * Enqueue an action when offline for later background sync
 */
export async function enqueueOfflineSync(
  action: string,
  endpoint: string,
  payload: any
): Promise<void> {
  if (!db) await initSqliteClient();
  if (!db) return;

  try {
    const id = `sync-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    db.run(
      `INSERT INTO sync_queue (id, action, endpoint, payload, timestamp, status) VALUES (?, ?, ?, ?, ?, 'pending')`,
      [id, action, endpoint, JSON.stringify(payload), now]
    );
    await commitSqliteDb();
  } catch (err) {
    console.error('Erreur mise en file attente sync SQLite:', err);
  }
}

/**
 * Flush pending offline actions when connection is restored
 */
export async function processOfflineSyncQueue(): Promise<number> {
  if (!db) return 0;

  try {
    const res = db.exec(`SELECT id, action, endpoint, payload FROM sync_queue WHERE status = 'pending'`);
    if (!res || res.length === 0 || res[0].values.length === 0) return 0;

    const rows = res[0].values;
    let syncedCount = 0;

    for (const [id, action, endpoint, payloadStr] of rows) {
      try {
        const payload = JSON.parse(payloadStr as string);
        let method = 'POST';
        if (action === 'update' || action === 'toggle') method = 'PUT';
        if (action === 'delete') method = 'DELETE';

        const fetchRes = await fetch(endpoint as string, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: method !== 'DELETE' ? JSON.stringify(payload) : undefined,
        });

        if (fetchRes.ok) {
          db.run(`UPDATE sync_queue SET status = 'completed' WHERE id = ?`, [id]);
          syncedCount++;
        }
      } catch (e) {
        console.warn(`Échec synchronisation action ${id}:`, e);
      }
    }

    if (syncedCount > 0) {
      db.run(`DELETE FROM sync_queue WHERE status = 'completed'`);
      await commitSqliteDb();
      console.log(`✅ ${syncedCount} actions hors-ligne synchronisées avec le serveur`);
    }

    return syncedCount;
  } catch (err) {
    console.error('Erreur traitement queue sync:', err);
    return 0;
  }
}

/**
 * Retrieve database metrics and status for UI inspection
 */
export function getSqliteDbStats(): {
  isReady: boolean;
  sessionsCount: number;
  tasksCount: number;
  dbSizeBytes: number;
} {
  if (!db) {
    return { isReady: false, sessionsCount: 0, tasksCount: 0, dbSizeBytes: 0 };
  }

  try {
    let sessionsCount = 0;
    let tasksCount = 0;

    const sRes = db.exec(`SELECT COUNT(*) FROM sessions`);
    if (sRes && sRes.length > 0) sessionsCount = Number(sRes[0].values[0][0]);

    const tRes = db.exec(`SELECT COUNT(*) FROM tasks`);
    if (tRes && tRes.length > 0) tasksCount = Number(tRes[0].values[0][0]);

    const binary = db.export();
    const dbSizeBytes = binary ? binary.byteLength : 0;

    return {
      isReady: true,
      sessionsCount,
      tasksCount,
      dbSizeBytes,
    };
  } catch {
    return { isReady: true, sessionsCount: 0, tasksCount: 0, dbSizeBytes: 0 };
  }
}
