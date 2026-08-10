import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { useData } from "@/context/DataContext"
import { DIAS_SEMANA_COMPLETA, PERIODOS, type DiaSemana } from "@/data/mockData"
import { NovaTurmaModal } from "@/components/NovaTurmaModal"

export function TurmasManager() {
  const { turmas, addTurma, removeTurma, updateTurma, limiteAtingido, maxTurmas } = useData()
  const [modalOpen, setModalOpen] = useState(false)

  const toggleDia = (turmaId: string, dias: DiaSemana[], dia: DiaSemana) => {
    const next = dias.includes(dia) ? dias.filter((d) => d !== dia) : [...dias, dia]
    updateTurma(turmaId, { diasFuncionamento: next })
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-slate-800 dark:text-white">Turmas</h2>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          disabled={limiteAtingido}
          className="flex items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" /> Nova
        </button>
      </div>
      <p className="mb-4 text-xs text-slate-400">
        {turmas.length} de {maxTurmas ?? "∞"} turmas usadas neste plano.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {turmas.map((t) => (
          <div key={t.id} className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
            <div className="flex items-center justify-between">
              <input
                value={t.nome}
                onChange={(e) => updateTurma(t.id, { nome: e.target.value })}
                className="w-full rounded-lg border border-transparent bg-transparent px-1 py-1 font-display text-sm font-semibold text-slate-900 outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:text-white dark:focus:bg-slate-950"
              />
              <button
                type="button"
                onClick={() => removeTurma(t.id)}
                aria-label="Remover turma"
                className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/40"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <input
              value={t.sala ?? ""}
              onChange={(e) => updateTurma(t.id, { sala: e.target.value })}
              placeholder="Sala/ambiente (opcional)"
              className="mt-1 w-full rounded-lg border border-transparent bg-transparent px-1 py-1 text-xs text-slate-400 outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:focus:bg-slate-950"
            />

            <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {PERIODOS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => updateTurma(t.id, { turno: p })}
                  className={`rounded-lg border px-2 py-1 text-[11px] font-medium capitalize transition-colors ${
                    t.turno === p
                      ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                      : "border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-1">
              {DIAS_SEMANA_COMPLETA.map((dia) => {
                const active = t.diasFuncionamento.includes(dia)
                return (
                  <button
                    key={dia}
                    type="button"
                    onClick={() => toggleDia(t.id, t.diasFuncionamento, dia)}
                    className={`h-7 w-9 rounded-md border text-[11px] font-medium transition-colors ${
                      active
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "border-slate-200 text-slate-400 dark:border-slate-700"
                    }`}
                  >
                    {dia}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
        {turmas.length === 0 && (
          <p className="col-span-full rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400 dark:border-slate-700">
            Nenhuma turma cadastrada ainda.
          </p>
        )}
      </div>

      <NovaTurmaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={(nome, turno, sala) =>
          addTurma({
            nome,
            turno,
            sala,
            cargaHoraria: {},
            cargaHorariaGeminada: {},
            diasFuncionamento: ["Seg", "Ter", "Qua", "Qui", "Sex"],
          })
        }
      />
    </div>
  )
}
