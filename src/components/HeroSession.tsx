'use client';

import { SessionHeroStatus } from '@/lib/dates';
import { MODULE_METADATA, DEFAULT_MODULE_COLOR } from '@/lib/constants';
import { Clock, MapPin, User, Video, Sparkles, ChevronRight } from 'lucide-react';
import { Session } from '@/types';

interface HeroSessionProps {
  hero: SessionHeroStatus | null;
  onSelectSession: (session: Session) => void;
}

export function HeroSession({ hero, onSelectSession }: HeroSessionProps) {
  if (!hero) {
    return (
      <div className="w-full p-4 rounded-2xl border border-slate-200 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/40 text-center text-slate-500 dark:text-zinc-400 text-xs">
        Aucune séance programmée pour le moment.
      </div>
    );
  }

  const { session, isOngoing, timeRemainingText } = hero;
  const meta = MODULE_METADATA[session.moduleCode] || {
    title: session.moduleTitle,
    shortTitle: session.moduleCode,
    color: DEFAULT_MODULE_COLOR,
  };

  const isPresentiel = session.mode === 'P';
  const isDistance = session.mode === 'D';

  return (
    <div
      onClick={() => onSelectSession(session)}
      className="relative overflow-hidden group cursor-pointer w-full rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-gradient-to-br dark:from-zinc-900 dark:via-zinc-900/90 dark:to-zinc-950 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:border-slate-300 dark:hover:border-zinc-700 active:scale-[0.99]"
    >
      {/* Decorative ambient glow */}
      <div
        className="absolute -right-10 -top-10 w-44 h-44 rounded-full blur-3xl opacity-15 pointer-events-none transition-opacity group-hover:opacity-25"
        style={{ backgroundColor: meta.color.hex }}
      />

      {/* Top Status & Countdown Row */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          {isOngoing ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 dark:bg-emerald-500/20 dark:border-emerald-500/30 dark:text-emerald-400 text-[11px] font-bold uppercase tracking-wider animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
              Séance en cours
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-indigo-500/15 dark:border-indigo-500/30 dark:text-indigo-400 text-[11px] font-bold tracking-wide">
              <Sparkles className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
              Prochain cours
            </span>
          )}

          <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800/80 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-zinc-700/50">
            {session.jour} • {session.horaire}
          </span>
        </div>

        {/* Live Countdown Badge */}
        <div className="flex items-center gap-1 text-xs font-bold text-slate-800 dark:text-zinc-200 bg-slate-50 dark:bg-zinc-950/70 border border-slate-200 dark:border-zinc-800 px-2.5 py-1 rounded-lg">
          <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>{timeRemainingText}</span>
        </div>
      </div>

      {/* Main Content: Room In Big Font & Module Code + Details */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className={`px-2 py-0.5 rounded-md text-xs font-extrabold uppercase tracking-wide ${meta.color.badge}`}
            >
              {session.moduleCode}
            </span>
            {session.groupNote && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700">
                {session.groupNote}
              </span>
            )}
            {isPresentiel && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                Présentiel
              </span>
            )}
            {isDistance && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200 dark:bg-sky-500/20 dark:text-sky-400 dark:border-sky-500/30 flex items-center gap-1">
                <Video className="w-2.5 h-2.5" />
                À Distance
              </span>
            )}
          </div>

          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100 truncate tracking-tight">
            {session.moduleTitle || meta.title}
          </h2>

          <div className="flex items-center gap-2 mt-2 text-xs text-slate-600 dark:text-zinc-400">
            <User className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0" />
            <span className="truncate">{session.professeur}</span>
          </div>
        </div>

        {/* Big Room Badge */}
        <div className="shrink-0 flex flex-col items-center justify-center min-w-[76px] sm:min-w-[90px] px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 dark:bg-zinc-950/90 dark:border-zinc-800 group-hover:border-slate-300 dark:group-hover:border-zinc-700 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500 flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
            Salle
          </span>
          <span className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-0.5">
            {session.salle}
          </span>
        </div>
      </div>

      {/* Footer hint */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-500 group-hover:text-slate-700 dark:group-hover:text-zinc-400">
        <span>Semaine {session.semaine}</span>
        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
          Détails & tâches <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
}
