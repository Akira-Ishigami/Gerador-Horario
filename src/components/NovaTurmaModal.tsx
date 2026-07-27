import { useState, type FormEvent } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { PERIODOS, type Periodo } from "@/data/mockData"

interface NovaTurmaModalProps {
  open: boolean
  onClose: () => void
  onCreate: (nome: string, turno: Periodo) => { ok: true } | { ok: false; error: string }
}

export function NovaTurmaModal({ open, onClose, onCreate }: NovaTurmaModalProps) {
  const [nome, setNome] = useState("")
  const [turno, setTurno] = useState<Periodo>("matutino")
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) return
    const result = onCreate(nome.trim(), turno)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setNome("")
    setTurno("matutino")
    setError(null)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Nova turma</h3>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="nome-turma" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Nome da turma
                </label>
                <input
                  id="nome-turma"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: 8º Ano B"
                  required
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Período</span>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  {PERIODOS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTurno(t)}
                      className={`rounded-lg border px-2 py-2 text-xs font-medium capitalize transition-colors ${
                        turno === t
                          ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                          : "border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 hover:bg-brand-700"
              >
                Criar turma
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
