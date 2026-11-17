'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppSettings, ModuleSummary, Session, Task } from '@/types';
import { DEFAULT_SEMESTER_START } from '@/lib/constants';
import { getCurrentWeekNumber, getHeroSession, SessionHeroStatus, computeModuleSummaries } from '@/lib/dates';
import {
  initSqliteClient,
  getSqliteSessions,
  saveSqliteSession,
  deleteSqliteSession,
  getSqliteTasks,
  saveSqliteTask,
  toggleSqliteTask,
  deleteSqliteTask,
  getSqliteSettings,
  updateSqliteSettings,
  syncServerDataToSqlite,
  resetSqliteFromAgendaJson,
  enqueueOfflineSync,
  processOfflineSyncQueue,
  getSqliteDbStats,
} from '@/lib/sqliteClient';
import { Header } from '@/components/Header';
import { Navigation, TabType } from '@/components/Navigation';
import { WeekView } from '@/components/WeekView';
import { TasksView } from '@/components/TasksView';
import { EditView } from '@/components/EditView';
import { SessionDetailModal } from '@/components/SessionDetailModal';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('week');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    semesterStartDate: DEFAULT_SEMESTER_START,
  });
  const [summaries, setSummaries] = useState<ModuleSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sqliteReady, setSqliteReady] = useState(false);

  // Computed Week — SSR-safe default of 1, corrected on client hydration
  const [currentSystemWeekNum, setCurrentSystemWeekNum] = useState<number>(1);
  const [selectedWeekNum, setSelectedWeekNum] = useState<number>(1);
  const [hasInitializedWeek, setHasInitializedWeek] = useState(false);

  // Hero session
  const [heroSession, setHeroSession] = useState<SessionHeroStatus | null>(null);

  // Selected session for drawer / modal
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  // 1. Initial Load & Offline SQLite Hydration
  const loadInitialData = useCallback(async () => {
    try {
      // 1. Initialize client-side SQLite engine
      const isSqliteInitialized = await initSqliteClient();
      setSqliteReady(isSqliteInitialized);

      // 2. Attempt online fetch from server API
      const [schedRes, taskRes] = await Promise.all([
        fetch('/api/schedule'),
        fetch('/api/tasks'),
      ]);

      if (schedRes.ok && taskRes.ok) {
        const schedData = await schedRes.json();
        const taskData = await taskRes.json();

        const currentSessions = schedData.sessions || [];
        const currentTasks = taskData.tasks || [];
        const currentSettings = schedData.settings || { semesterStartDate: DEFAULT_SEMESTER_START };

        setSessions(currentSessions);
        setTasks(currentTasks);
        setSettings(currentSettings);
        setSummaries(schedData.summaries || computeModuleSummaries(currentSessions, currentTasks, currentSettings.semesterStartDate));

        // Sync with local SQLite database for offline resilience
        await syncServerDataToSqlite(currentSessions, currentTasks, currentSettings);

        // Process any queued offline modifications
        await processOfflineSyncQueue();

        // Secondary localStorage cache
        localStorage.setItem('sdsi_sessions', JSON.stringify(currentSessions));
        localStorage.setItem('sdsi_tasks', JSON.stringify(currentTasks));
        localStorage.setItem('sdsi_settings', JSON.stringify(currentSettings));
      } else {
        throw new Error('API non joignable');
      }
    } catch (err) {
      console.warn('Mode déconnecté détecté, bascule vers la base SQLite locale:', err);

      // Offline fallback: Query directly from local SQLite database
      const localSessions = getSqliteSessions();
      const localTasks = getSqliteTasks();
      const localSettings = getSqliteSettings();

      if (localSessions.length > 0) {
        setSessions(localSessions);
        setTasks(localTasks);
        setSettings(localSettings);
        setSummaries(computeModuleSummaries(localSessions, localTasks, localSettings.semesterStartDate));
      } else {
        // Fallback to localStorage if SQLite was not yet initialized
        if (typeof window !== 'undefined') {
          try {
            const cachedSessions = localStorage.getItem('sdsi_sessions');
            const cachedTasks = localStorage.getItem('sdsi_tasks');
            const cachedSettings = localStorage.getItem('sdsi_settings');

            const loadedSessions = cachedSessions ? JSON.parse(cachedSessions) : [];
            const loadedTasks = cachedTasks ? JSON.parse(cachedTasks) : [];
            const loadedSettings = cachedSettings ? JSON.parse(cachedSettings) : { semesterStartDate: DEFAULT_SEMESTER_START };

            setSessions(loadedSessions);
            setTasks(loadedTasks);
            setSettings(loadedSettings);
            setSummaries(computeModuleSummaries(loadedSessions, loadedTasks, loadedSettings.semesterStartDate));
          } catch (cacheErr) {
            console.warn('Erreur chargement fallback:', cacheErr);
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();

    // Listen to online events to automatically flush offline sync queue
    const handleOnline = async () => {
      console.log('📶 Réseau rétabli : synchronisation des modifications locales...');
      await processOfflineSyncQueue();
      loadInitialData();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [loadInitialData]);

  // 2. Compute current week and live hero status
  useEffect(() => {
    const updateTimeBasedState = () => {
      const now = new Date();
      const startDate = settings.semesterStartDate || DEFAULT_SEMESTER_START;
      const { weekNum } = getCurrentWeekNumber(now, startDate);

      setCurrentSystemWeekNum(weekNum);

      // Sync selected week to current system week on first load
      if (!hasInitializedWeek) {
        setSelectedWeekNum(weekNum);
        setHasInitializedWeek(true);
      }

      if (sessions.length > 0) {
        const hero = getHeroSession(sessions, now, startDate);
        setHeroSession(hero);
      }
    };

    updateTimeBasedState();
    const interval = setInterval(updateTimeBasedState, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [sessions, settings.semesterStartDate, hasInitializedWeek]);

  // Helper to recompute and update summaries
  const refreshSummaries = (updatedSessions: Session[], updatedTasks: Task[]) => {
    const newSummaries = computeModuleSummaries(
      updatedSessions,
      updatedTasks,
      settings.semesterStartDate || DEFAULT_SEMESTER_START
    );
    setSummaries(newSummaries);
  };

  // 3. Task Handlers (Offline-First via SQLite)
  const handleAddTask = async (taskData: Partial<Task>) => {
    const now = new Date().toISOString();
    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: taskData.title || '',
      description: taskData.description,
      moduleCode: taskData.moduleCode || 'M111',
      sessionId: taskData.sessionId,
      semaine: taskData.semaine,
      dueDate: taskData.dueDate,
      priority: taskData.priority || 'medium',
      completed: false,
      createdAt: now,
      updatedAt: now,
    };

    // 1. Immediately save to SQLite local database
    await saveSqliteTask(newTask);

    // 2. Update React State immediately (optimistic UI)
    const updatedTasks = [newTask, ...tasks];
    setTasks(updatedTasks);
    refreshSummaries(sessions, updatedTasks);

    // 3. Try server sync or enqueue for offline sync
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      });
      if (!res.ok) throw new Error('Erreur API');
    } catch {
      console.log('Action enregistrée hors-ligne dans SQLite');
      await enqueueOfflineSync('create', '/api/tasks', newTask);
    }
  };

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    // 1. Immediately update in SQLite
    await toggleSqliteTask(taskId, completed);

    // 2. Update React state immediately
    const updatedTasks = tasks.map((t) => (t.id === taskId ? { ...t, completed } : t));
    setTasks(updatedTasks);
    refreshSummaries(sessions, updatedTasks);

    // 3. Try server sync or enqueue
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      });
      if (!res.ok) throw new Error('Erreur API');
    } catch {
      console.log('Bascule tâche enregistrée hors-ligne dans SQLite');
      await enqueueOfflineSync('toggle', `/api/tasks/${taskId}`, { completed });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    // 1. Immediately delete from SQLite
    await deleteSqliteTask(taskId);

    // 2. Update React state
    const updatedTasks = tasks.filter((t) => t.id !== taskId);
    setTasks(updatedTasks);
    refreshSummaries(sessions, updatedTasks);

    // 3. Try server sync or enqueue
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erreur API');
    } catch {
      console.log('Suppression tâche enregistrée hors-ligne dans SQLite');
      await enqueueOfflineSync('delete', `/api/tasks/${taskId}`, {});
    }
  };

  // 4. Session Handlers (Offline-First via SQLite)
  const handleUpdateSession = async (session: Session) => {
    // 1. Immediately save to SQLite
    await saveSqliteSession(session);

    // 2. Update React state
    const updatedSessions = sessions.map((s) => (s.id === session.id ? session : s));
    setSessions(updatedSessions);
    refreshSummaries(updatedSessions, tasks);

    // 3. Try server sync or enqueue
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session),
      });
      if (!res.ok) throw new Error('Erreur API');
    } catch {
      console.log('Modification séance enregistrée hors-ligne dans SQLite');
      await enqueueOfflineSync('update', '/api/schedule', session);
    }
  };

  const handleAddSession = async (session: Session) => {
    // 1. Immediately save to SQLite
    await saveSqliteSession(session);

    // 2. Update React state
    const updatedSessions = [...sessions, session];
    setSessions(updatedSessions);
    refreshSummaries(updatedSessions, tasks);

    // 3. Try server sync or enqueue
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session),
      });
      if (!res.ok) throw new Error('Erreur API');
    } catch {
      console.log('Ajout séance enregistré hors-ligne dans SQLite');
      await enqueueOfflineSync('create', '/api/schedule', session);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    // 1. Immediately delete or cancel in SQLite
    await deleteSqliteSession(sessionId);

    // 2. Update React state
    const updatedSessions = sessions.filter((s) => s.id !== sessionId);
    setSessions(updatedSessions);
    refreshSummaries(updatedSessions, tasks);

    // 3. Try server sync or enqueue
    try {
      const res = await fetch(`/api/schedule/session/${sessionId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erreur API');
    } catch {
      console.log('Suppression séance enregistrée hors-ligne dans SQLite');
      await enqueueOfflineSync('delete', `/api/schedule/session/${sessionId}`, {});
    }
  };

  const handleResetFromCsv = async () => {
    try {
      const res = await fetch('/api/schedule/reset', { method: 'POST' });
      if (res.ok) {
        await resetSqliteFromAgendaJson();
        await loadInitialData();
      }
    } catch (err) {
      console.warn('Reset en ligne impossible, réinitialisation SQLite depuis agenda_db.json locale:', err);
      await resetSqliteFromAgendaJson();
      const localSessions = getSqliteSessions();
      setSessions(localSessions);
      refreshSummaries(localSessions, tasks);
    }
  };

  const handleUpdateSemesterStartDate = async (newDate: string) => {
    // 1. Immediately update in SQLite
    await updateSqliteSettings({ semesterStartDate: newDate });

    // 2. Update React state
    setSettings((prev) => ({ ...prev, semesterStartDate: newDate }));
    const { weekNum } = getCurrentWeekNumber(new Date(), newDate);
    setCurrentSystemWeekNum(weekNum);
    refreshSummaries(sessions, tasks);

    // 3. Try server sync or enqueue
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ semesterStartDate: newDate }),
      });
      if (!res.ok) throw new Error('Erreur API');
    } catch {
      console.log('Mise à jour date semestre enregistrée hors-ligne dans SQLite');
      await enqueueOfflineSync('update', '/api/settings', { semesterStartDate: newDate });
    }
  };

  const pendingTasksCount = tasks.filter((t) => !t.completed).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 selection:bg-emerald-500/20 transition-colors">
      {/* 1. Header */}
      <Header
        currentWeekNum={currentSystemWeekNum}
        semesterStartDate={settings.semesterStartDate}
        onOpenSettings={() => setActiveTab('edit')}
      />

      {/* 2. Navigation bar (Desktop tabs) */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendingTasksCount={pendingTasksCount}
      />

      {/* 3. Main Views Container */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-6 pt-4 sm:pt-6">
        {isLoading && sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
            <Loader2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold tracking-wide">
              Chargement de l&apos;emploi du temps SDSI (SQLite PWA)...
            </p>
          </div>
        ) : (
          <>
            {/* View 1: Week Dashboard */}
            {activeTab === 'week' && (
              <WeekView
                sessions={sessions}
                tasks={tasks}
                selectedWeekNum={selectedWeekNum}
                currentSystemWeekNum={currentSystemWeekNum}
                semesterStartDate={settings.semesterStartDate}
                heroSession={heroSession}
                onSelectWeek={setSelectedWeekNum}
                onSelectSession={setSelectedSession}
              />
            )}

            {/* View 2: Tasks & Pedagogical Progress */}
            {activeTab === 'tasks' && (
              <TasksView
                tasks={tasks}
                sessions={sessions}
                summaries={summaries}
                onAddTask={handleAddTask}
                onToggleTask={handleToggleTask}
                onDeleteTask={handleDeleteTask}
              />
            )}

            {/* View 3: Schedule Management & Editing */}
            {activeTab === 'edit' && (
              <EditView
                sessions={sessions}
                semesterStartDate={settings.semesterStartDate}
                onUpdateSession={handleUpdateSession}
                onDeleteSession={handleDeleteSession}
                onAddSession={handleAddSession}
                onResetFromCsv={handleResetFromCsv}
                onUpdateSemesterStartDate={handleUpdateSemesterStartDate}
              />
            )}
          </>
        )}
      </main>

      {/* 4. Session Detail Modal / Drawer */}
      <SessionDetailModal
        session={selectedSession}
        tasks={tasks}
        semesterStartDate={settings.semesterStartDate}
        onClose={() => setSelectedSession(null)}
        onAddTask={handleAddTask}
        onToggleTask={handleToggleTask}
        onDeleteTask={handleDeleteTask}
      />
    </div>
  );
}
