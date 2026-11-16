'use client';

import { useState } from 'react';
import { ModeType, Session } from '@/types';
import { DAYS_ORDER, MODULE_METADATA } from '@/lib/constants';
import {
  RotateCcw,
  Download,
  Plus,
  Save,
  Trash2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Edit,
  Clock,
  MapPin,
  X,
  Undo2,
} from 'lucide-react';

interface EditViewProps {
  sessions: Session[];
  semesterStartDate: string;
  onUpdateSession: (session: Session) => Promise<void>;
  onDeleteSession: (sessionId: string) => Promise<void>;
  onAddSession: (session: Session) => Promise<void>;
  onResetFromCsv: () => Promise<void>;
  onUpdateSemesterStartDate: (newDate: string) => Promise<void>;
}

export function EditView({
  sessions,
  semesterStartDate,
  onUpdateSession,
  onDeleteSession,
  onAddSession,
  onResetFromCsv,
  onUpdateSemesterStartDate,
}: EditViewProps) {
  const [selectedWeekNum, setSelectedWeekNum] = useState<number>(7);
  const [startDateInput, setStartDateInput] = useState(semesterStartDate);
  const [isSavingDate, setIsSavingDate] = useState(false);
  const [dateSavedFeedback, setDateSavedFeedback] = useState(false);

  // Reset confirmation modal
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Add Makeup Session Form
  const [showAddModal, setShowAddModal] = useState(false);
  const [newModuleCode, setNewModuleCode] = useState('M113');
  const [newJour, setNewJour] = useState('Lundi');
  const [newHoraire, setNewHoraire] = useState('17h00 à 18h50');
  const [newSalle, setNewSalle] = useState('LC3');
  const [newProf, setNewProf] = useState('Pr. M. FAKHOURI AMR');
  const [newMode, setNewMode] = useState<ModeType>('P');
  const [isAddingSession, setIsAddingSession] = useState(false);

  // Editing session in place
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editSalle, setEditSalle] = useState('');
  const [editMode, setEditMode] = useState<ModeType>('NEANT');
  const [editHoraire, setEditHoraire] = useState('');
  const [editProf, setEditProf] = useState('');
  const [isSavingSession, setIsSavingSession] = useState(false);

  // Filter sessions for selected week
  const weekSessions = sessions.filter(
    (s) => s.weekNum === selectedWeekNum
  );

  const handleSaveStartDate = async () => {
    if (!startDateInput) return;
    try {
      setIsSavingDate(true);
      await onUpdateSemesterStartDate(startDateInput);
      setDateSavedFeedback(true);
      setTimeout(() => setDateSavedFeedback(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingDate(false);
    }
  };

  const handleStartEdit = (s: Session) => {
    setEditingSessionId(s.id);
    setEditSalle(s.salle);
    setEditMode(s.mode);
    setEditHoraire(s.horaire);
    setEditProf(s.professeur);
  };

  const handleSaveEdit = async (s: Session) => {
    try {
      setIsSavingSession(true);
      await onUpdateSession({
        ...s,
        salle: editSalle,
        mode: editMode,
        horaire: editHoraire,
        professeur: editProf,
      });
      setEditingSessionId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingSession(false);
    }
  };

  const handleToggleCancel = async (s: Session) => {
    try {
      await onUpdateSession({
        ...s,
        isCancelled: !s.isCancelled,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateMakeupSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsAddingSession(true);
      const meta = MODULE_METADATA[newModuleCode];
      const newSession: Session = {
        id: `custom-s${selectedWeekNum}-${Date.now()}`,
        semaine: `S${selectedWeekNum}`,
        weekNum: selectedWeekNum,
        jour: newJour,
        dayIndex: DAYS_ORDER.indexOf(newJour as typeof DAYS_ORDER[number]),
        horaire: newHoraire,
        startTime: newHoraire.slice(0, 5).replace('h', ':'),
        endTime: newHoraire.slice(-5).replace('h', ':'),
        moduleCode: newModuleCode,
        moduleTitle: meta?.title || newModuleCode,
        moduleRaw: `${newModuleCode} ${meta?.title || ''}`,
        professeur: newProf,
        salle: newSalle,
        mode: newMode,
        isCancelled: false,
        isCustom: true,
      };

      await onAddSession(newSession);
      setShowAddModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingSession(false);
    }
  };

  const handleExportCsv = () => {
    window.open('/api/schedule/export', '_blank');
  };

  const handleConfirmReset = async () => {
    try {
      setIsResetting(true);
      await onResetFromCsv();
      setShowResetConfirm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-5 pb-20 sm:pb-8">
      {/* 1. Global Settings & Actions Card */}
      <div className="p-4 sm:p-5 rounded-2xl border border-zinc-800 bg-zinc-950/80 shadow-lg space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
          Configuration & Actions Globales
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
          {/* Start Date Config */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
              Date de départ du Semestre (Lundi S1) :
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={startDateInput}
                onChange={(e) => setStartDateInput(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 flex-1"
              />
              <button
                onClick={handleSaveStartDate}
                disabled={isSavingDate || startDateInput === semesterStartDate}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-200 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{dateSavedFeedback ? 'Enregistré !' : 'Appliquer'}</span>
              </button>
            </div>
          </div>

          {/* Quick Actions (Export / Reset) */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white transition-all shadow-sm"
              title="Télécharger l'emploi du temps actuel au format CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Exporter CSV</span>
            </button>

            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-bold text-rose-400 transition-all shadow-sm"
              title="Réinitialiser toutes les modifications depuis le fichier CSV d'origine"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Réinitialiser CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Week Selector for Editing */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-2 rounded-xl bg-zinc-900/50 border border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-400">Modifier :</span>
          <select
            value={selectedWeekNum}
            onChange={(e) => setSelectedWeekNum(Number(e.target.value))}
            className="bg-zinc-950 border border-zinc-700 text-zinc-100 font-bold text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500"
          >
            {Array.from({ length: 14 }, (_, i) => i + 1).map((w) => (
              <option key={w} value={w}>
                Semaine S{w}
              </option>
            ))}
          </select>
          <span className="text-xs text-zinc-500">
            ({weekSessions.length} séances au total)
          </span>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold shadow-md transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter une séance (Rattrapage)</span>
        </button>
      </div>

      {/* 3. Sessions List with Inline Editing */}
      <div className="space-y-2.5">
        {weekSessions.map((s) => {
          const isEditing = editingSessionId === s.id;
          const meta = MODULE_METADATA[s.moduleCode];

          return (
            <div
              key={s.id}
              className={`p-3.5 rounded-xl border transition-all ${
                s.isCancelled
                  ? 'bg-zinc-950/40 border-zinc-900 opacity-60'
                  : 'bg-zinc-900/70 border-zinc-800/80 shadow-sm'
              }`}
            >
              {isEditing ? (
                /* Edit Mode */
                <div className="space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400">
                      Édition de {s.moduleCode} ({s.jour})
                    </span>
                    <button
                      onClick={() => setEditingSessionId(null)}
                      className="text-zinc-500 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[10px] text-zinc-400 font-semibold mb-1">
                        Salle
                      </label>
                      <input
                        type="text"
                        value={editSalle}
                        onChange={(e) => setEditSalle(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-zinc-400 font-semibold mb-1">
                        Mode
                      </label>
                      <select
                        value={editMode}
                        onChange={(e) => setEditMode(e.target.value as ModeType)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="P">P (Présentiel)</option>
                        <option value="D">D (À distance)</option>
                        <option value="NEANT">NEANT (Standard)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-zinc-400 font-semibold mb-1">
                        Horaire
                      </label>
                      <input
                        type="text"
                        value={editHoraire}
                        onChange={(e) => setEditHoraire(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-zinc-400 font-semibold mb-1">
                        Professeur
                      </label>
                      <input
                        type="text"
                        value={editProf}
                        onChange={(e) => setEditProf(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => setEditingSessionId(null)}
                      className="px-3 py-1.5 rounded-lg border border-zinc-800 text-xs font-semibold text-zinc-400"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => handleSaveEdit(s)}
                      disabled={isSavingSession}
                      className="px-4 py-1.5 rounded-lg bg-emerald-500 text-zinc-950 font-bold text-xs"
                    >
                      Enregistrer
                    </button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-black uppercase ${
                        meta?.color.badge || 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {s.moduleCode}
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-200">
                          {s.jour} • {s.horaire}
                        </span>
                        {s.isCancelled && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400">
                            Annulée
                          </span>
                        )}
                        {s.isCustom && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-400">
                            Rattrapage
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Salle <span className="font-bold text-zinc-200">{s.salle}</span> • Mode{' '}
                        <span className="font-bold text-zinc-200">{s.mode}</span> • {s.professeur}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => handleStartEdit(s)}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs flex items-center gap-1 font-semibold transition-colors"
                      title="Modifier les détails"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Modifier</span>
                    </button>

                    <button
                      onClick={() => handleToggleCancel(s)}
                      className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        s.isCancelled
                          ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                          : 'bg-zinc-800 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400'
                      }`}
                      title={s.isCancelled ? 'Rétablir la séance' : 'Annuler la séance'}
                    >
                      {s.isCancelled ? 'Rétablir' : 'Annuler'}
                    </button>

                    {s.isCustom && (
                      <button
                        onClick={() => onDeleteSession(s.id)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 transition-colors"
                        title="Supprimer la séance"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 4. Add Makeup Session Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
          <form
            onSubmit={handleCreateMakeupSession}
            className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-3.5"
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white">
                Ajouter une séance de rattrapage (S{selectedWeekNum})
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Module
              </label>
              <select
                value={newModuleCode}
                onChange={(e) => setNewModuleCode(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-2 text-xs text-zinc-100"
              >
                {Object.keys(MODULE_METADATA).map((m) => (
                  <option key={m} value={m}>
                    {m} - {MODULE_METADATA[m].title}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Jour
                </label>
                <select
                  value={newJour}
                  onChange={(e) => setNewJour(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-2 text-xs text-zinc-100"
                >
                  {DAYS_ORDER.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Mode
                </label>
                <select
                  value={newMode}
                  onChange={(e) => setNewMode(e.target.value as ModeType)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-2 text-xs text-zinc-100"
                >
                  <option value="P">P (Présentiel)</option>
                  <option value="D">D (À distance)</option>
                  <option value="NEANT">NEANT</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Horaire
                </label>
                <input
                  type="text"
                  value={newHoraire}
                  onChange={(e) => setNewHoraire(e.target.value)}
                  placeholder="17h00 à 18h50"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-2 text-xs text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Salle
                </label>
                <input
                  type="text"
                  value={newSalle}
                  onChange={(e) => setNewSalle(e.target.value)}
                  placeholder="LC3, Amphi 4..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-2 text-xs text-zinc-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Professeur
              </label>
              <input
                type="text"
                value={newProf}
                onChange={(e) => setNewProf(e.target.value)}
                placeholder="Nom du professeur"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-2 text-xs text-zinc-100"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3.5 py-1.5 rounded-lg border border-zinc-800 text-xs font-semibold text-zinc-400"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isAddingSession}
                className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs"
              >
                Créer la séance
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5. Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-3">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold">Réinitialiser l&apos;emploi du temps ?</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Toutes les modifications personnalisées de séances seront annulées et l&apos;emploi du temps reviendra exactement à l&apos;état du fichier CSV original.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-300 text-xs font-semibold hover:bg-zinc-900"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmReset}
                disabled={isResetting}
                className="px-4 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs"
              >
                {isResetting ? 'Réinitialisation...' : 'Confirmer le Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
