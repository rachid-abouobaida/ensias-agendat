'use client';

import { Session, Task } from '@/types';
import { MODULE_METADATA, DEFAULT_MODULE_COLOR } from '@/lib/constants';
import { MapPin, User, Video, CheckSquare, Clock } from 'lucide-react';

interface SessionCardProps {
  session: Session;
  tasks: Task[];
  onSelect: (session: Session) => void;
  isOverlapping?: boolean;
}

export function SessionCard({
  session,
  tasks,
  onSelect,
  isOverlapping = false,
}: SessionCardProps) {
  const meta = MODULE_METADATA[session.moduleCode] || {
    title: session.moduleTitle,
    shortTitle: session.moduleCode,
    color: DEFAULT_MODULE_COLOR,
  };

  // Associated tasks
  const sessionTasks = tasks.filter(
    (t) => t.sessionId === session.id || (t.moduleCode === session.moduleCode && t.semaine === session.semaine)
  );
  const totalTasks = sessionTasks.length;
  const completedTasks = sessionTasks.filter((t) => t.completed).length;

  const isPresentiel = session.mode === 'P';
  const isDistance = session.mode === 'D';

  return (
    <div
      onClick={() => onSelect(session)}
      className={`group relative flex flex-col justify-between p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
        session.isCancelled
          ? 'bg-slate-100/70 border-slate-200 opacity-50 line-through dark:bg-zinc-900/30 dark:border-zinc-800/40'
          : 'bg-white hover:bg-slate-50/90 border-slate-200/90 hover:border-slate-300 shadow-sm hover:shadow dark:bg-zinc-900/70 dark:hover:bg-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-700'
      } ${isOverlapping ? 'ring-1 ring-amber-400/50 dark:ring-amber-500/30' : ''}`}
    >
      {/* Module color bar indicator on the left */}
      <div
        className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full"
        style={{ backgroundColor: meta.color.hex }}
      />

      {/* Top row: Time + Mode badge + Overlap badge */}
      <div className="flex items-center justify-between gap-1.5 mb-2 pl-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-zinc-200">
          <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-400" />
          <span>{session.startTime} - {session.endTime}</span>
        </div>

        <div className="flex items-center gap-1">
          {session.groupNote && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700/80">
              {session.groupNote}
            </span>
          )}

          {isPresentiel && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
              P
            </span>
          )}

          {isDistance && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/30 flex items-center gap-1">
              <Video className="w-2.5 h-2.5" />
              D
            </span>
          )}
        </div>
      </div>

      {/* Middle row: Module Code + Title */}
      <div className="pl-2 flex-1 mb-2">
        <div className="flex items-baseline gap-1.5">
          <span
            className={`px-1.5 py-0.5 rounded text-[11px] font-extrabold uppercase tracking-wide ${meta.color.badge}`}
          >
            {session.moduleCode}
          </span>
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-700 dark:text-zinc-100 dark:group-hover:text-white line-clamp-1 transition-colors">
            {session.moduleTitle || meta.title}
          </h3>
        </div>

        <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-1 flex items-center gap-1 truncate font-medium">
          <User className="w-3 h-3 text-slate-400 dark:text-zinc-500 shrink-0" />
          <span className="truncate">{session.professeur}</span>
        </p>
      </div>

      {/* Bottom row: Room Badge + Task counter indicator */}
      <div className="pl-2 pt-2 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between">
        {/* Room Badge */}
        <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-900 font-extrabold text-xs shadow-sm dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-100">
          <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          <span>{session.salle}</span>
        </div>

        {/* Task counter */}
        {totalTasks > 0 ? (
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
              completedTasks === totalTasks
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400'
                : 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300'
            }`}
          >
            <CheckSquare className="w-3 h-3" />
            <span>
              {completedTasks}/{totalTasks}
            </span>
          </div>
        ) : (
          <span className="text-[10px] text-slate-400 group-hover:text-slate-600 dark:text-zinc-600 dark:group-hover:text-zinc-500 font-medium">
            Détails →
          </span>
        )}
      </div>
    </div>
  );
}
