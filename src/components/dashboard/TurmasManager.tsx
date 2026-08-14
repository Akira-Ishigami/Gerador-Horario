import { useState } from "react"
import { Check, ChevronRight, Copy, ListChecks, Plus, RefreshCw, Trash2, X } from "lucide-react"
import { useData } from "@/context/DataContext"
import { DIAS_SEMANA_COMPLETA, PERIODOS, gerarCodigoSecreto, type DiaSemana } from "@/data/mockData"

export function TurmasManager() {
  const { turmas, addTurma, removeTurma, updateTurma, limiteAtingido, maxTurmas, blocos } = useData()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [modoSelecao, setModoSelecao] = useState(false)
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set())
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)
  const [copiado, setCopiado] = useState(false)

  const selecionada = turmas.find((t) => t.id === selectedId) ?? null
  const aulasDoTurno = selecionada
    ? blocos.filter((b) => b.turno === selecionada.turno && b.tipo === "aula").sort((a, b) => a.inicio.localeCompare(b.inicio))
    : []

  const toggleDia = (turmaId: string, dias: DiaSemana[], dia: DiaSemana) => {
    const next = dias.includes(dia) ? dias.filter((d) => d !== dia) : [...dias, dia]
    updateTurma(turmaId, { diasFuncionamento: next })
  }

  const handleNova = () => {
    const result = addTurma({
      nome: `Turma ${turmas.length + 1}`,
      turno: "matutino",
      cargaHoraria: {},
      cargaHorariaGeminada: {},
      diasFuncionamento: ["Seg", "Ter", "Qua", "Qui", "Sex"],
      aulasFixas: [],
    })
    if (result.ok) setSelectedId(result.id)
  }

  const handleRemover = (id: string) => {
    removeTurma(id)
    if (selectedId === id) setSelectedId(null)
  }

  const sairDoModoSelecao = () => {
    setModoSelecao(false)
    setSelecionadas(new Set())
    setConfirmandoExclusao(false)
  }

  const toggleSelecionada = (id: string) => {
    setConfirmandoExclusao(false)
    setSelecionadas((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleExcluirSelecionadas = () => {
    if (!confirmandoExclusao) {
      setConfirmandoExclusao(true)
      return
    }
    selecionadas.forEach((id) => removeTurma(id))
    if (selectedId && selecionadas.has(selectedId)) setSelectedId(null)
    sairDoModoSelecao()
  }

  const handleCopiarCodigo = (codigo: string) => {
    navigator.clipboard.writeText(codigo).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1500)
    })
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-slate-800 dark:text-white">Turmas</h2>
      </div>
      <p className="mb-4 text-xs text-slate-400">
        {turmas.length} de {maxTurmas ?? "∞"} turmas usadas neste plano.
      </p>

      <div className="grid gap-4 md:grid-cols-[280px_minmax(0,1fr)]">
        {/* Lista */}
        <div className={`rounded-xl border border-slate-200 dark:border-white/10 ${selecionada ? "hidden md:flex md:flex-col" : "flex flex-col"}`}>
          <div className="flex items-center gap-2 border-b border-slate-100 p-2.5 dark:border-white/5">
            <button
              type="button"
              onClick={handleNova}
              disabled={limiteAtingido}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-2.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" /> Nova turma
            </button>
            <button
              type="button"
              onClick={() => (modoSelecao ? sairDoModoSelecao() : setModoSelecao(true))}
              aria-label={modoSelecao ? "Cancelar seleção" : "Selecionar várias"}
              title={modoSelecao ? "Cancelar seleção" : "Selecionar várias"}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                modoSelecao
                  ? "bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-white"
                  : "text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
              }`}
            >
              {modoSelecao ? <X className="h-4 w-4" /> : <ListChecks className="h-4 w-4" />}
            </button>
          </div>

          {modoSelecao && (
            <div className="border-b border-slate-100 p-2.5 dark:border-white/5">
              <button
                type="button"
                onClick={handleExcluirSelecionadas}
                disabled={selecionadas.size === 0}
                className={`flex w-full items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  confirmandoExclusao
                    ? "bg-rose-600 text-white hover:bg-rose-700"
                    : "bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400"
                }`}
              >
                <Trash2 className="h-3.5 w-3.5" />
                {confirmandoExclusao ? `Confirmar exclusão (${selecionadas.size})` : `Excluir selecionadas (${selecionadas.size})`}
              </button>
            </div>
          )}

          <div className="max-h-112 flex-1 overflow-y-auto p-1.5">
            {turmas.map((t) => {
              const marcada = selecionadas.has(t.id)
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => (modoSelecao ? toggleSelecionada(t.id) : setSelectedId(t.id))}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                    !modoSelecao && selectedId === t.id
                      ? "bg-brand-600 font-medium text-white shadow-sm shadow-brand-600/30"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
                  }`}
                >
                  {modoSelecao && (
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        marcada
                          ? "border-brand-600 bg-brand-600 text-white"
                          : "border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {marcada && <Check className="h-3 w-3" />}
                    </span>
                  )}
                  <span className="flex-1 truncate">{t.nome || "Sem nome"}</span>
                  {!modoSelecao && <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-40" />}
                </button>
              )
            })}
            {turmas.length === 0 && (
              <p className="px-2.5 py-6 text-center text-sm text-slate-400">Nenhuma turma cadastrada ainda.</p>
            )}
          </div>

          <p className="border-t border-slate-100 px-3 py-2 text-[11px] text-slate-400 dark:border-white/5">
            {turmas.length} {turmas.length === 1 ? "turma cadastrada" : "turmas cadastradas"}
          </p>
        </div>

        {/* Detalhe */}
        <div className={selecionada ? "" : "hidden items-center justify-center rounded-xl border border-dashed border-slate-200 py-16 dark:border-slate-700 md:flex"}>
          {!selecionada && (
            <p className="max-w-[16rem] text-center text-sm text-slate-400">
              Selecione uma turma à esquerda, ou clique em "Nova turma" pra cadastrar.
            </p>
          )}

          {selecionada && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 md:hidden">
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400"
                >
                  <ChevronRight className="h-3.5 w-3.5 rotate-180" /> Voltar pra lista
                </button>
              </div>

              <div className="flex items-center justify-between gap-2">
                <input
                  value={selecionada.nome}
                  onChange={(e) => updateTurma(selecionada.id, { nome: e.target.value })}
                  placeholder="Nome da turma"
                  className="w-full rounded-lg border border-transparent bg-transparent px-1 py-1 font-display text-lg font-semibold text-slate-900 outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:text-white dark:focus:bg-slate-950"
                />
                <button
                  type="button"
                  onClick={() => handleRemover(selecionada.id)}
                  aria-label="Excluir turma"
                  title="Excluir turma"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/40"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <input
                value={selecionada.sala ?? ""}
                onChange={(e) => updateTurma(selecionada.id, { sala: e.target.value })}
                placeholder="Sala/ambiente (opcional)"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />

              <div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Período</span>
                <div className="mt-1 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                  {PERIODOS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => updateTurma(selecionada.id, { turno: p })}
                      className={`rounded-lg border px-2 py-1.5 text-xs font-medium capitalize transition-colors ${
                        selecionada.turno === p
                          ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                          : "border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Dias de funcionamento</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {DIAS_SEMANA_COMPLETA.map((dia) => {
                    const active = selecionada.diasFuncionamento.includes(dia)
                    return (
                      <button
                        key={dia}
                        type="button"
                        onClick={() => toggleDia(selecionada.id, selecionada.diasFuncionamento, dia)}
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

              <div className="grid grid-cols-3 gap-2">
                <label className="block">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Aulas/sem.</span>
                  <input
                    type="number"
                    min={0}
                    value={selecionada.aulasSemanais ?? ""}
                    onChange={(e) => {
                      const v = e.target.value
                      updateTurma(selecionada.id, { aulasSemanais: v === "" ? undefined : Math.max(0, parseInt(v, 10)) })
                    }}
                    placeholder="—"
                    className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Mín./dia</span>
                  <input
                    type="number"
                    min={0}
                    value={selecionada.minAulasPorDia ?? ""}
                    onChange={(e) => {
                      const v = e.target.value
                      updateTurma(selecionada.id, { minAulasPorDia: v === "" ? undefined : Math.max(0, parseInt(v, 10)) })
                    }}
                    placeholder="—"
                    className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Máx./dia</span>
                  <input
                    type="number"
                    min={0}
                    value={selecionada.maxAulasPorDia ?? ""}
                    onChange={(e) => {
                      const v = e.target.value
                      updateTurma(selecionada.id, { maxAulasPorDia: v === "" ? undefined : Math.max(0, parseInt(v, 10)) })
                    }}
                    placeholder="—"
                    className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </label>
              </div>

              <div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Recreio próprio (opcional)</span>
                <p className="text-[11px] text-slate-400">
                  Deixe em "Nenhum" pra usar o intervalo padrão do turno, definido em Configurações.
                </p>
                {aulasDoTurno.length === 0 ? (
                  <p className="mt-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                    Cadastre os horários do turno "{selecionada.turno}" em Configurações antes de definir um recreio próprio.
                  </p>
                ) : (
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    <label className="block">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Depois de qual aula</span>
                      <select
                        value={selecionada.recreioDepoisDaAula ?? ""}
                        onChange={(e) => {
                          const v = e.target.value
                          updateTurma(
                            selecionada.id,
                            v === ""
                              ? { recreioDepoisDaAula: undefined, recreioDuracaoMin: undefined }
                              : { recreioDepoisDaAula: parseInt(v, 10) },
                          )
                        }}
                        className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      >
                        <option value="">Nenhum</option>
                        {aulasDoTurno.map((bloco, i) => (
                          <option key={bloco.id} value={i + 1}>
                            {i + 1}ª aula ({bloco.inicio}–{bloco.fim})
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Duração (min)</span>
                      <input
                        type="number"
                        min={1}
                        value={selecionada.recreioDuracaoMin ?? ""}
                        disabled={selecionada.recreioDepoisDaAula === undefined}
                        onChange={(e) => {
                          const v = e.target.value
                          updateTurma(selecionada.id, { recreioDuracaoMin: v === "" ? undefined : Math.max(1, parseInt(v, 10)) })
                        }}
                        placeholder="—"
                        className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      />
                    </label>
                  </div>
                )}
              </div>

              <div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Código de acesso</span>
                <div className="mt-1 flex items-center gap-1.5">
                  <code className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center font-mono text-sm font-semibold tracking-[0.2em] text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                    {selecionada.codigoSecreto ?? "——————"}
                  </code>
                  <button
                    type="button"
                    onClick={() => selecionada.codigoSecreto && handleCopiarCodigo(selecionada.codigoSecreto)}
                    disabled={!selecionada.codigoSecreto}
                    aria-label="Copiar código"
                    title="Copiar código"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-white/5"
                  >
                    {copiado ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateTurma(selecionada.id, { codigoSecreto: gerarCodigoSecreto() })}
                    aria-label="Gerar novo código"
                    title="Gerar novo código"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-white/5"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
