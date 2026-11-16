'use client';

import { Calendar, CheckSquare, Edit3 } from 'lucide-react';

export type TabType = 'week' | 'tasks' | 'edit';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  pendingTasksCount?: number;
}

export function Navigation({
  activeTab,
  onTabChange,
  pendingTasksCount = 0,
}: NavigationProps) {
  const tabs = [
    {
      id: 'week' as TabType,
      label: 'Semaine',
      icon: Calendar,
    },
    {
      id: 'tasks' as TabType,
      label: 'Tâches',
      icon: CheckSquare,
      badge: pendingTasksCount > 0 ? pendingTasksCount : undefined,
    },
    {
      id: 'edit' as TabType,
      label: 'Édition EDT',
      icon: Edit3,
    },
  ];

  return (
    <>
      {/* Desktop Navigation Tabs */}
      <div className="hidden sm:block w-full border-b border-slate-200/90 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-950/60 backdrop-blur-sm px-4">
        <div className="max-w-5xl mx-auto flex items-center gap-1.5 py-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 border border-slate-200 shadow-sm dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-900/80'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isActive
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-400 dark:text-zinc-400'
                  }`}
                />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                        : 'bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/90 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950/90 backdrop-blur-lg px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 transition-colors shadow-lg">
        <div className="grid grid-cols-3 max-w-md mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-300 font-medium'
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-transform ${
                      isActive ? 'scale-110' : ''
                    }`}
                  />
                  {tab.badge !== undefined && (
                    <span className="absolute -top-1 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white dark:text-zinc-950 text-[10px] font-extrabold flex items-center justify-center shadow-sm">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px] mt-0.5 tracking-tight">{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 w-8 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
