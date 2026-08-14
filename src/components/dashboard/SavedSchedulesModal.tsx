import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { AlertTriangle, Check, FolderOpen, Pencil, Save, X } from "lucide-react"
import type { GeneratedSchedule } from "@/lib/scheduleGenerator"

export interface SlotHorario {
  slotId: number
  nome: string
  grades: GeneratedSchedule["grades"] | null
  conflitos: string[]
  updatedAt: string | null
}

interface SavedSchedulesModalProps {
  aberto: boolean
  onClose: () => void
  slots: SlotHorario[]
  temHorarioAtual: boolean
  onSalvar: (slotId: number) => void
  onCarregar: (slotId: number) => void
  onRenomear: (slotId: number, nome: string) => void
}

/** usado aqui e no card de resumo da tela Início. */
export function formatarDataSlot(iso: string | null): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
}

/**
 * "Horários salvos" — até 4 slots por conta, tipo save de jogo: cada um
 * pode ser salvo por cima, carregado de volta ou renomeado, independente
 * dos outros. `slots` sempre vem com os 4 (vazios ou não) — quem monta essa
 * lista fixa é o DashboardPage, aqui só exibe.
 */
export function SavedSchedulesModal({ aberto, onClose, slots, temHorarioAtual, onSalvar, onCarregar, onRenomear }: SavedSchedulesModalProps) {
  const [confirmandoSlot, setConfirmandoSlot] = useState<number | null>(null)
  const [editandoSlot, setEditandoSlot] = useState<number | null>(null)

  return (
    <AnimatePresence
      onExitComplete={() => {
        setConfirmandoSlot(null)
        setEditandoSlot(null)
      }}
    >
      {aberto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm print:hidden"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
          >
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-4 dark:border-white/10">
              <div>
                <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Horários salvos</h3>
                <p className="text-xs text-slate-400">Até 4 slots — salve por cima, carregue ou renomeie.</p>
              </div>
              <button type="button" onClick={onClose} aria-label="Fechar" className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2.5 p-4">
              {slots.map((slot) => {
                const ocupado = slot.grades !== null
                const confirmando = confirmandoSlot === slot.slotId
                const editando = editandoSlot === slot.slotId

                return (
                  <div
                    key={slot.slotId}
                    className={`rounded-xl border p-3 transition-colors ${
                      ocupado ? "border-slate-200 dark:border-white/10" : "border-dashed border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {editando ? (
                      <input
                        autoFocus
                        defaultValue={slot.nome}
                        onBlur={(e) => {
                          onRenomear(slot.slotId, e.target.value)
                          setEditandoSlot(null)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.currentTarget.blur()
                          if (e.key === "Escape") setEditandoSlot(null)
                        }}
                        className="w-full rounded-lg border border-brand-400 bg-white px-2 py-1 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-brand-500/20 dark:bg-slate-950 dark:text-white"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditandoSlot(slot.slotId)}
                        className="flex items-center gap-1.5 text-left text-sm font-semibold text-slate-800 hover:text-brand-600 dark:text-white dark:hover:text-brand-400"
                      >
                        <span className="truncate">{slot.nome}</span>
                        <Pencil className="h-3 w-3 shrink-0 text-slate-300" />
                      </button>
                    )}

                    <p className="mt-0.5 text-xs text-slate-400">
                      {ocupado ? (
                        <>
                          Salvo em {formatarDataSlot(slot.updatedAt)}
                          {slot.conflitos.length > 0 && (
                            <span className="ml-1 inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                              <AlertTriangle className="h-3 w-3" /> {slot.conflitos.length} conflito{slot.conflitos.length !== 1 ? "s" : ""}
                            </span>
                          )}
                        </>
                      ) : (
                        "Vazio"
                      )}
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onCarregar(slot.slotId)}
                        disabled={!ocupado}
                        className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-slate-300"
                      >
                        <FolderOpen className="h-3.5 w-3.5" /> Carregar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (ocupado && !confirmando) {
                            setConfirmandoSlot(slot.slotId)
                            return
                          }
                          onSalvar(slot.slotId)
                          setConfirmandoSlot(null)
                        }}
                        disabled={!temHorarioAtual}
                        className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                          confirmando
                            ? "bg-amber-600 text-white hover:bg-amber-700"
                            : "bg-brand-600 text-white hover:bg-brand-700"
                        }`}
                      >
                        {confirmando ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                        {confirmando ? "Confirmar e sobrescrever" : ocupado ? "Salvar por cima" : "Salvar aqui"}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {!temHorarioAtual && (
              <p className="border-t border-slate-100 px-6 py-3 text-xs text-slate-400 dark:border-white/10">
                Gere um horário primeiro pra poder salvar num slot.
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
