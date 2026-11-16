'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppSettings, ModuleSummary, Session, Task } from '@/types';
import { DEFAULT_SEMESTER_START } from '@/lib/constants';
import { getCurrentWeekNumber, getHeroSession, SessionHeroStatus } from '@/lib/dates';
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

  // Computed Week
  const [currentSystemWeekNum, setCurrentSystemWeekNum] = useState<number>(7);
  const [selectedWeekNum, setSelectedWeekNum] = useState<number>(7);

  // Hero session
  const [heroSession, setHeroSession] = useState<SessionHeroStatus | null>(null);

  // Selected session for drawer / modal
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  // 1. Initial Load & Offline Cache Hydration
  const loadInitialData = useCallback(async () => {
    // Try localStorage first for instant paint
    if (typeof window !== 'undefined') {
      try {
        const cachedSessions = localStorage.getItem('sdsi_sessions');
        const cachedTasks = localStorage.getItem('sdsi_tasks');
        const cachedSettings = localStorage.getItem('sdsi_settings');

        if (cachedSessions) setSessions(JSON.parse(cachedSessions));
        if (cachedTasks) setTasks(JSON.parse(cachedTasks));
        if (cachedSettings) setSettings(JSON.parse(cachedSettings));
      } catch (err) {
        console.warn('LocalStorage error:', err);
      }
    }

    try {
      const [schedRes, taskRes] = await Promise.all([
        fetch('/api/schedule'),
        fetch('/api/tasks'),
      ]);

      if (schedRes.ok) {
        const schedData = await schedRes.json();
        setSessions(schedData.sessions || []);
        if (schedData.settings) setSettings(schedData.settings);
        if (schedData.summaries) setSummaries(schedData.summaries);

        // Cache in localStorage
        localStorage.setItem('sdsi_sessions', JSON.stringify(schedData.sessions));
        if (schedData.settings) {
          localStorage.setItem('sdsi_settings', JSON.stringify(schedData.settings));
        }
      }

      if (taskRes.ok) {
        const taskData = await taskRes.json();
        setTasks(taskData.tasks || []);
        localStorage.setItem('sdsi_tasks', JSON.stringify(taskData.tasks));
      }
    } catch (err) {
      console.warn('Network offline or fetch failed, using local cache:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // 2. Compute current week and live hero status
  useEffect(() => {
    const updateTimeBasedState = () => {
      const now = new Date();
      const startDate = settings.semesterStartDate || DEFAULT_SEMESTER_START;
      const { weekNum } = getCurrentWeekNumber(now, startDate);

      setCurrentSystemWeekNum(weekNum);

      // Default selected week to current system week on first load
      setSelectedWeekNum((prev) => (prev ? prev : weekNum));

      if (sessions.length > 0) {
        const hero = getHeroSession(sessions, now, startDate);
        setHeroSession(hero);
      }
    };

    updateTimeBasedState();
    const interval = setInterval(updateTimeBasedState, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [sessions, settings.semesterStartDate]);

  // 3. Task Handlers
  const handleAddTask = async (taskData: Partial<Task>) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });
      if (res.ok) {
        const { task } = await res.json();
        setTasks((prev) => [task, ...prev]);
        fetchSummaries();
      }
    } catch (err) {
      console.error('Error adding task:', err);
    }
  };

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed } : t))
    );

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      });
      fetchSummaries();
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    try {
      await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      fetchSummaries();
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  // 4. Session Handlers
  const handleUpdateSession = async (session: Session) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === session.id ? session : s))
    );

    try {
      await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session),
      });
      fetchSummaries();
    } catch (err) {
      console.error('Error updating session:', err);
    }
  };

  const handleAddSession = async (session: Session) => {
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session),
      });
      if (res.ok) {
        const { session: created } = await res.json();
        setSessions((prev) => [...prev, created]);
        fetchSummaries();
      }
    } catch (err) {
      console.error('Error adding session:', err);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    try {
      await fetch(`/api/schedule/session/${sessionId}`, {
        method: 'DELETE',
      });
      fetchSummaries();
    } catch (err) {
      console.error('Error deleting session:', err);
    }
  };

  const handleResetFromCsv = async () => {
    try {
      const res = await fetch('/api/schedule/reset', { method: 'POST' });
      if (res.ok) {
        await loadInitialData();
      }
    } catch (err) {
      console.error('Error resetting schedule:', err);
    }
  };

  const handleUpdateSemesterStartDate = async (newDate: string) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ semesterStartDate: newDate }),
      });
      if (res.ok) {
        setSettings((prev) => ({ ...prev, semesterStartDate: newDate }));
        const { weekNum } = getCurrentWeekNumber(new Date(), newDate);
        setCurrentSystemWeekNum(weekNum);
        fetchSummaries();
      }
    } catch (err) {
      console.error('Error updating semester start date:', err);
    }
  };

  const fetchSummaries = async () => {
    try {
      const res = await fetch('/api/schedule');
      if (res.ok) {
        const data = await res.json();
        if (data.summaries) setSummaries(data.summaries);
      }
    } catch (err) {
      console.warn('Error fetching summaries:', err);
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
              Chargement de l&apos;emploi du temps SDSI...
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
