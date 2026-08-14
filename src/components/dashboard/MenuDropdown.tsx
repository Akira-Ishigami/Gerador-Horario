import { useEffect, useRef, useState } from "react"
import { ChevronDown, type LucideIcon } from "lucide-react"

export interface MenuDropdownSubItem {
  id: string
  label: string
}

export interface MenuDropdownItem {
  id: string
  label: string
  icon: LucideIcon
  /** quando presente, o item vira um grupo expansível em vez de navegar direto — só os filhos são selecionáveis. */
  children?: readonly MenuDropdownSubItem[]
}

interface MenuDropdownProps {
  label: string
  itens: MenuDropdownItem[]
  tabAtual: string
  onSelect: (id: string) => void
}

export function MenuDropdown({ label, itens, tabAtual, onSelect }: MenuDropdownProps) {
  const [aberto, setAberto] = useState(false)
  const [grupoAberto, setGrupoAberto] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const algumAtivo = itens.some((item) => item.id === tabAtual || item.children?.some((c) => c.id === tabAtual))

  useEffect(() => {
    if (!aberto) return
    // ao abrir, já deixa expandido o grupo que contém a aba atual — evita
    // ter que reabrir manualmente toda vez pra ver onde você está.
    const grupoComTabAtual = itens.find((item) => item.children?.some((c) => c.id === tabAtual))
    setGrupoAberto(grupoComTabAtual?.id ?? null)

    const fecharSeFora = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false)
      }
    }
    document.addEventListener("mousedown", fecharSeFora)
    return () => document.removeEventListener("mousedown", fecharSeFora)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          algumAtivo
            ? "bg-brand-600 text-white shadow-sm shadow-brand-600/30"
            : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
        }`}
      >
        {label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${aberto ? "rotate-180" : ""}`} />
      </button>

      {aberto && (
        <div className="absolute left-0 top-full z-30 mt-1.5 w-60 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-white/10 dark:bg-slate-900">
          {itens.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-slate-400">Em breve.</p>
          ) : (
            itens.map((item) => {
              if (!item.children) {
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelect(item.id)
                      setAberto(false)
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                      tabAtual === item.id
                        ? "bg-brand-600 text-white shadow-sm shadow-brand-600/30"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                )
              }

              const expandido = grupoAberto === item.id
              const filhoAtivo = item.children.some((c) => c.id === tabAtual)
              return (
                <div key={item.id}>
                  <button
                    type="button"
                    onClick={() => setGrupoAberto(expandido ? null : item.id)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                      filhoAtivo
                        ? "text-brand-700 dark:text-brand-300"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="flex-1">{item.label}</span>
                    <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${expandido ? "rotate-180" : ""}`} />
                  </button>
                  {expandido && (
                    <div className="ml-3 space-y-0.5 border-l border-slate-100 py-0.5 pl-3 dark:border-white/10">
                      {item.children.map((sub) => (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => {
                            onSelect(sub.id)
                            setAberto(false)
                          }}
                          className={`block w-full rounded-lg px-3 py-1.5 text-left text-sm transition-colors ${
                            tabAtual === sub.id
                              ? "bg-brand-600 font-medium text-white shadow-sm shadow-brand-600/30"
                              : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5"
                          }`}
                        >
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
