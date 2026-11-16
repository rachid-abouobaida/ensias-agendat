'use client';

import { useState } from 'react';
import { ModuleSummary, PriorityType, Session, Task } from '@/types';
import { MODULE_METADATA } from '@/lib/constants';
import {
  CheckSquare,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  Clock,
  Sparkles,
  BarChart3,
  Filter,
} from 'lucide-react';

interface TasksViewProps {
  tasks: Task[];
  sessions: Session[];
  summaries: ModuleSummary[];
  onAddTask: (task: Partial<Task>) => Promise<void>;
  onToggleTask: (taskId: string, completed: boolean) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
}

export function TasksView({
  tasks,
  sessions,
  summaries,
  onAddTask,
  onToggleTask,
  onDeleteTask,
}: TasksViewProps) {
  // Filters state
  const [statusFilter, setStatusFilter] = useState<'todo' | 'all' | 'done'>('todo');
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [selectedWeek, setSelectedWeek] = useState<string>('ALL');

  // New task form state
  const [title, setTitle] = useState('');
  const [moduleCode, setModuleCode] = useState<string>('M112');
  const [semaine, setSemaine] = useState<string>('S7');
  const [priority, setPriority] = useState<PriorityType>('medium');
  const [dueDate, setDueDate] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setIsAdding(true);
      await onAddTask({
        title: title.trim(),
        moduleCode,
        semaine: semaine === 'NONE' ? undefined : semaine,
        priority,
        dueDate: dueDate || undefined,
        completed: false,
      });
      setTitle('');
      setDueDate('');
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    // Status
    if (statusFilter === 'todo' && task.completed) return false;
    if (statusFilter === 'done' && !task.completed) return false;

    // Module
    if (selectedModule !== 'ALL' && task.moduleCode !== selectedModule) return false;

    // Week
    if (selectedWeek !== 'ALL' && task.semaine !== selectedWeek) return false;

    return true;
  });

  const pendingCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="space-y-5 pb-20 sm:pb-8">
      {/* 1. Pedagogical Progress & Modules Tracking Card */}
      <div className="p-4 sm:p-5 rounded-2xl border border-zinc-800 bg-zinc-950/80 shadow-lg">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
              Progression Pédagogique du Semestre (S1 - S14)
            </h2>
          </div>
          <span className="text-xs font-semibold text-zinc-400">
            {completedCount} terminées / {tasks.length} tâches
          </span>
        </div>

        {/* Modules Grid with Progress bars */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {summaries.map((mod) => {
            const percentage =
              mod.totalSessions > 0
                ? Math.round((mod.completedSessions / mod.totalSessions) * 100)
                : 0;
            const meta = MODULE_METADATA[mod.code];

            return (
              <div
                key={mod.code}
                className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-black uppercase ${
                      meta?.color.badge || 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    {mod.code}
                  </span>
                  <span className="text-[11px] font-bold text-zinc-300">
                    {percentage}%
                  </span>
                </div>

                <p className="text-[11px] font-semibold text-zinc-300 truncate mb-2">
                  {meta?.shortTitle || mod.title}
                </p>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: meta?.color.hex || '#10b981',
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-400">
                    <span>
                      {mod.completedSessions}/{mod.totalSessions} séances
                    </span>
                    <span>
                      {mod.completedTasks}/{mod.totalTasks} tâches
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Tasks Header & Quick Add Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-zinc-100">
            Tâches & Travaux Dirigés
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-bold">
            {pendingCount} à faire
          </span>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-md transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle tâche</span>
        </button>
      </div>

      {/* 3. Add Task Form (Collapsible) */}
      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/90 shadow-xl space-y-3 animate-in fade-in slide-in-from-top-2"
        >
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Ajouter une tâche ou devoir
          </h3>

          <div>
            <input
              type="text"
              placeholder="Intitulé (ex: Rendre TP OpenCV, réviser DS Statistique...)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Module dropdown */}
            <div>
              <label className="block text-[10px] font-semibold text-zinc-400 mb-1">
                Module
              </label>
              <select
                value={moduleCode}
                onChange={(e) => setModuleCode(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
              >
                {Object.keys(MODULE_METADATA).map((m) => (
                  <option key={m} value={m}>
                    {m} - {MODULE_METADATA[m].shortTitle}
                  </option>
                ))}
              </select>
            </div>

            {/* Week dropdown */}
            <div>
              <label className="block text-[10px] font-semibold text-zinc-400 mb-1">
                Semaine
              </label>
              <select
                value={semaine}
                onChange={(e) => setSemaine(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="NONE">Non spécifiée</option>
                {Array.from({ length: 14 }, (_, i) => `S${i + 1}`).map((w) => (
                  <option key={w} value={w}>
                    Semaine {w}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority dropdown */}
            <div>
              <label className="block text-[10px] font-semibold text-zinc-400 mb-1">
                Priorité
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityType)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
              </select>
            </div>

            {/* Due date */}
            <div>
              <label className="block text-[10px] font-semibold text-zinc-400 mb-1">
                Échéance
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-semibold"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isAdding || !title.trim()}
              className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold disabled:opacity-50 transition-all"
            >
              Enregistrer
            </button>
          </div>
        </form>
      )}

      {/* 4. Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-2 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
        {/* Status Pills */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setStatusFilter('todo')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'todo'
                ? 'bg-zinc-100 text-zinc-950'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            À faire ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'all'
                ? 'bg-zinc-100 text-zinc-950'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Toutes ({tasks.length})
          </button>
          <button
            onClick={() => setStatusFilter('done')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'done'
                ? 'bg-zinc-100 text-zinc-950'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Terminées ({completedCount})
          </button>
        </div>

        {/* Module & Week Filter Selects */}
        <div className="flex items-center gap-2">
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-300 focus:outline-none"
          >
            <option value="ALL">Tous les modules</option>
            {Object.keys(MODULE_METADATA).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-300 focus:outline-none"
          >
            <option value="ALL">Toutes semaines</option>
            {Array.from({ length: 14 }, (_, i) => `S${i + 1}`).map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 5. Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="p-10 text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 text-zinc-500">
          <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-500" />
          <p className="text-sm font-semibold text-zinc-400">
            Aucune tâche correspondant aux critères
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            Ajoutez une tâche ou changez de filtre pour voir d&apos;autres travaux.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((t) => {
            const meta = MODULE_METADATA[t.moduleCode];
            const isHigh = t.priority === 'high';
            const isMedium = t.priority === 'medium';

            return (
              <div
                key={t.id}
                className={`group flex items-center justify-between gap-3 p-3.5 rounded-xl border transition-all ${
                  t.completed
                    ? 'bg-zinc-950/40 border-zinc-900 opacity-60'
                    : 'bg-zinc-900/70 hover:bg-zinc-900 border-zinc-800/80 hover:border-zinc-700 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={t.completed}
                    onChange={(e) => onToggleTask(t.id, e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-emerald-500 focus:ring-emerald-500/30 cursor-pointer shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs sm:text-sm truncate ${
                        t.completed
                          ? 'line-through text-zinc-500'
                          : 'font-semibold text-zinc-100'
                      }`}
                    >
                      {t.title}
                    </p>

                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-black uppercase ${
                          meta?.color.badge || 'bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        {t.moduleCode}
                      </span>

                      {t.semaine && (
                        <span className="text-[10px] font-semibold text-zinc-500">
                          {t.semaine}
                        </span>
                      )}

                      {t.dueDate && (
                        <span className="flex items-center gap-1 text-[10px] text-zinc-400">
                          <Clock className="w-2.5 h-2.5 text-zinc-500" />
                          <span>{t.dueDate}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isHigh && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      Haute
                    </span>
                  )}
                  {isMedium && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      Moyenne
                    </span>
                  )}

                  <button
                    onClick={() => onDeleteTask(t.id)}
                    className="p-1.5 rounded-lg text-zinc-600 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
