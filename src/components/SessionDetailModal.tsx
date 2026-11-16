'use client';

import { useState } from 'react';
import { Session, Task, PriorityType } from '@/types';
import { MODULE_METADATA, DEFAULT_MODULE_COLOR } from '@/lib/constants';
import { getDateForWeekAndDay } from '@/lib/dates';
import {
  X,
  MapPin,
  Clock,
  User,
  Video,
  CheckSquare,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
} from 'lucide-react';

interface SessionDetailModalProps {
  session: Session | null;
  tasks: Task[];
  semesterStartDate: string;
  onClose: () => void;
  onAddTask: (task: Partial<Task>) => Promise<void>;
  onToggleTask: (taskId: string, completed: boolean) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
}

export function SessionDetailModal({
  session,
  tasks,
  semesterStartDate,
  onClose,
  onAddTask,
  onToggleTask,
  onDeleteTask,
}: SessionDetailModalProps) {
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<PriorityType>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!session) return null;

  const meta = MODULE_METADATA[session.moduleCode] || {
    title: session.moduleTitle,
    shortTitle: session.moduleCode,
    color: DEFAULT_MODULE_COLOR,
  };

  const sessionDate = getDateForWeekAndDay(
    session.weekNum,
    session.jour,
    semesterStartDate
  );

  const formattedDate = sessionDate.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const sessionTasks = tasks.filter(
    (t) => t.sessionId === session.id || (t.moduleCode === session.moduleCode && t.semaine === session.semaine)
  );

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      setIsSubmitting(true);
      await onAddTask({
        title: newTitle.trim(),
        moduleCode: session.moduleCode,
        sessionId: session.id,
        semaine: session.semaine,
        priority: newPriority,
        completed: false,
      });
      setNewTitle('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div
        className="w-full sm:max-w-lg bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="relative p-4 sm:p-5 border-b border-zinc-800/80 bg-zinc-900/60">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-xs font-black uppercase tracking-wide ${meta.color.badge}`}
              >
                {session.moduleCode}
              </span>
              <span className="text-xs font-semibold text-zinc-300">
                Semaine {session.semaine}
              </span>
              {session.groupNote && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {session.groupNote}
                </span>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-lg font-bold text-white mt-2 leading-tight">
            {meta.title}
          </h2>

          <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-400 capitalize">
            <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Content Body: Details + Tasks */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Key Info Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {/* Room */}
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-400" />
                Salle
              </span>
              <p className="text-base font-black text-white mt-0.5">
                {session.salle}
              </p>
            </div>

            {/* Horaire */}
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                <Clock className="w-3 h-3 text-indigo-400" />
                Horaire
              </span>
              <p className="text-sm font-bold text-white mt-0.5">
                {session.startTime} - {session.endTime}
              </p>
            </div>

            {/* Mode */}
            <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                <Video className="w-3 h-3 text-sky-400" />
                Mode
              </span>
              <p className="text-sm font-bold text-white mt-0.5">
                {session.mode === 'P'
                  ? 'Présentiel'
                  : session.mode === 'D'
                  ? 'À Distance'
                  : 'Standard'}
              </p>
            </div>
          </div>

          {/* Professor */}
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs">
            <User className="w-4 h-4 text-zinc-400 shrink-0" />
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase font-bold">
                Enseignant
              </span>
              <span className="font-semibold text-zinc-200">
                {session.professeur}
              </span>
            </div>
          </div>

          {/* Tasks Section for this session */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Tâches liées à cette séance
                </h3>
              </div>
              <span className="text-xs font-semibold text-zinc-500">
                {sessionTasks.filter((t) => t.completed).length}/{sessionTasks.length}
              </span>
            </div>

            {/* Task list */}
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {sessionTasks.length === 0 ? (
                <div className="text-center py-4 px-2 rounded-xl bg-zinc-900/40 border border-dashed border-zinc-800 text-zinc-500 text-xs">
                  Aucune tâche liée à cette séance. Ajoutez-en une ci-dessous.
                </div>
              ) : (
                sessionTasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-zinc-900 border border-zinc-800/80 group"
                  >
                    <label className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={t.completed}
                        onChange={(e) => onToggleTask(t.id, e.target.checked)}
                        className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-emerald-500 focus:ring-emerald-500/30 cursor-pointer"
                      />
                      <span
                        className={`text-xs text-zinc-200 truncate ${
                          t.completed ? 'line-through text-zinc-500' : 'font-medium'
                        }`}
                      >
                        {t.title}
                      </span>
                    </label>

                    <div className="flex items-center gap-1">
                      {t.priority === 'high' && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400">
                          Haute
                        </span>
                      )}
                      <button
                        onClick={() => onDeleteTask(t.id)}
                        className="p-1 rounded text-zinc-500 hover:text-rose-400 transition-colors"
                        title="Supprimer la tâche"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Task Quick Form */}
            <form onSubmit={handleCreateTask} className="mt-3 flex gap-2">
              <input
                type="text"
                placeholder="Ex: Rendre TP OpenCV, réviser..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
              />

              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as PriorityType)}
                className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-2 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
              </select>

              <button
                type="submit"
                disabled={isSubmitting || !newTitle.trim()}
                className="px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-bold text-xs flex items-center gap-1 shadow-md transition-all shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Ajouter</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
