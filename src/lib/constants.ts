export const DEFAULT_SEMESTER_START =
  process.env.NEXT_PUBLIC_SEMESTER_START_DATE || '2026-10-05';

export const DAYS_ORDER = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
] as const;

export const DAY_OFFSETS: Record<string, number> = {
  Lundi: 0,
  Mardi: 1,
  Mardi_: 1,
  Mercredi: 2,
  Jeudi: 3,
  Vendredi: 4,
  Samedi: 5,
};

export const MODULE_METADATA: Record<
  string,
  {
    title: string;
    shortTitle: string;
    color: {
      bg: string;
      text: string;
      border: string;
      badge: string;
      glow: string;
      accent: string;
      hex: string;
    };
  }
> = {
  M111: {
    title: 'Statistique inférentielle & analyse et visualisation',
    shortTitle: 'Stats & Visualisation',
    color: {
      bg: 'bg-emerald-50 dark:bg-emerald-500/15',
      text: 'text-emerald-800 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-500/30',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30',
      glow: 'shadow-emerald-500/10',
      accent: 'emerald',
      hex: '#10b981',
    },
  },
  M112: {
    title: 'Bases de traitement des données multimédias',
    shortTitle: 'Données Multimédias',
    color: {
      bg: 'bg-sky-50 dark:bg-cyan-500/15',
      text: 'text-sky-800 dark:text-cyan-300',
      border: 'border-sky-200 dark:border-cyan-500/30',
      badge: 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/30',
      glow: 'shadow-sky-500/10',
      accent: 'sky',
      hex: '#0284c7',
    },
  },
  M113: {
    title: 'Algorithmique avancée et structures de données',
    shortTitle: 'Algo Avancée & SD',
    color: {
      bg: 'bg-indigo-50 dark:bg-indigo-500/15',
      text: 'text-indigo-800 dark:text-indigo-300',
      border: 'border-indigo-200 dark:border-indigo-500/30',
      badge: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30',
      glow: 'shadow-indigo-500/10',
      accent: 'indigo',
      hex: '#4f46e5',
    },
  },
  M114: {
    title: "Techniques de l'Intelligence Artificielle",
    shortTitle: 'Techniques IA',
    color: {
      bg: 'bg-amber-50 dark:bg-amber-500/15',
      text: 'text-amber-800 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-500/30',
      badge: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30',
      glow: 'shadow-amber-500/10',
      accent: 'amber',
      hex: '#d97706',
    },
  },
  M115: {
    title: 'Ingénierie des Données et Systèmes Décisionnels',
    shortTitle: 'Ingénierie Données & BI',
    color: {
      bg: 'bg-rose-50 dark:bg-rose-500/15',
      text: 'text-rose-800 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-500/30',
      badge: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30',
      glow: 'shadow-rose-500/10',
      accent: 'rose',
      hex: '#e11d48',
    },
  },
  M117: {
    title: 'Compétences en culture et art marocains',
    shortTitle: 'Culture & Art Marocains',
    color: {
      bg: 'bg-purple-50 dark:bg-purple-500/15',
      text: 'text-purple-800 dark:text-purple-300',
      border: 'border-purple-200 dark:border-purple-500/30',
      badge: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30',
      glow: 'shadow-purple-500/10',
      accent: 'purple',
      hex: '#9333ea',
    },
  },
};

export const DEFAULT_MODULE_COLOR = {
  bg: 'bg-slate-50 dark:bg-zinc-500/15',
  text: 'text-slate-800 dark:text-zinc-300',
  border: 'border-slate-200 dark:border-zinc-500/30',
  badge: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-zinc-500/20 dark:text-zinc-300 dark:border-zinc-500/30',
  glow: 'shadow-slate-500/10',
  accent: 'slate',
  hex: '#64748b',
};
