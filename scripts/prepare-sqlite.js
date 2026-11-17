const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

async function prepareSqlite() {
  console.log('🔄 Initialisation de la base SQLite et des assets PWA...');

  const rootDir = path.resolve(__dirname, '..');
  const publicDir = path.join(rootDir, 'public');
  const publicDataDir = path.join(publicDir, 'data');
  const dataDir = path.join(rootDir, 'data');
  const jsonPath = path.join(dataDir, 'agenda_db.json');
  const sqlitePath = path.join(dataDir, 'agenda_db.sqlite');

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  if (!fs.existsSync(publicDataDir)) {
    fs.mkdirSync(publicDataDir, { recursive: true });
  }

  // 1. Copy sql-wasm assets to public/
  const sqlWasmSrc = path.join(rootDir, 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
  const sqlWasmJsSrc = path.join(rootDir, 'node_modules', 'sql.js', 'dist', 'sql-wasm.js');

  if (fs.existsSync(sqlWasmSrc)) {
    fs.copyFileSync(sqlWasmSrc, path.join(publicDir, 'sql-wasm.wasm'));
    console.log('✅ Copié: public/sql-wasm.wasm');
  } else {
    console.warn('⚠️ Introuvable:', sqlWasmSrc);
  }

  if (fs.existsSync(sqlWasmJsSrc)) {
    fs.copyFileSync(sqlWasmJsSrc, path.join(publicDir, 'sql-wasm.js'));
    console.log('✅ Copié: public/sql-wasm.js');
  }

  // 2. Read agenda_db.json
  if (!fs.existsSync(jsonPath)) {
    console.error('❌ Erreur: data/agenda_db.json non trouvé à', jsonPath);
    return;
  }

  const rawJson = fs.readFileSync(jsonPath, 'utf8');
  const data = JSON.parse(rawJson);

  // Copy JSON to public/data/agenda_db.json for offline PWA fetch
  fs.copyFileSync(jsonPath, path.join(publicDataDir, 'agenda_db.json'));
  console.log('✅ Copié: public/data/agenda_db.json');

  // 3. Create SQLite Database using sql.js
  const SQL = await initSqlJs();
  const db = new SQL.Database();

  // Create Schema
  db.run(`
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

  // Insert Sessions
  const insertSessionStmt = db.prepare(`
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
  const insertTaskStmt = db.prepare(`
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
  const insertSettingStmt = db.prepare(`
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

  // 4. Export SQLite binary
  const binaryData = db.export();
  const buffer = Buffer.from(binaryData);

  fs.writeFileSync(sqlitePath, buffer);
  console.log(`✅ Généré: data/agenda_db.sqlite (${buffer.length} octets, ${data.sessions?.length || 0} séances)`);

  fs.writeFileSync(path.join(publicDataDir, 'agenda_db.sqlite'), buffer);
  console.log('✅ Copié: public/data/agenda_db.sqlite');

  console.log('🎉 Préparation SQLite terminée avec succès !');
}

prepareSqlite().catch((err) => {
  console.error('Erreur préparation SQLite:', err);
  process.exit(1);
});
