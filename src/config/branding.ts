/**
 * Ponto único de configuração de marca.
 * O nome do produto ainda não foi definido — troque APP_NAME (e o <title>/meta em index.html)
 * quando o nome final for escolhido. Nada mais no app precisa mudar.
 */
export const APP_NAME = "Horária"
export const APP_TAGLINE = "Grade horária pronta em minutos, não em semanas."
export const APP_DESCRIPTION =
  "Horária é o gerador de horários escolares que monta a grade da sua escola automaticamente, sem conflitos de professores ou turmas."
export const APP_DOMAIN = "horaria.app" // placeholder, ajustar quando o domínio for definido

export type PlanId = "teste" | "bronze" | "prata" | "ouro"

export interface Plan {
  id: PlanId
  name: string
  tagline: string
  maxTurmas: number | null // null = ilimitado
  priceMonthly: number
  priceYearly: number // total do ano (equivale a ~2 meses grátis)
  highlight?: boolean
  features: string[]
}

/**
 * Preços definidos com base em pesquisa de mercado (jul/2026):
 * - PowerCubus (BR): planos Standard/Advanced/Premium + free até 3 turmas.
 * - GridClass (BR): a partir de R$ 1.399/ano (~R$ 116/mês) para até 20 turmas.
 * - Concorrentes internacionais (Schedula, Timetabling Turbo): US$ 5–30/mês.
 * Posicionamos os 3 planos abaixo do GridClass no tier de entrada/intermediário
 * para ganhar mercado, com o Ouro competindo no mesmo patamar dos planos avançados.
 */
export const PLANS: Plan[] = [
  {
    id: "teste",
    name: "Teste grátis",
    tagline: "Experimente o gerador com 1 turma, sem cartão de crédito.",
    maxTurmas: 1,
    priceMonthly: 0,
    priceYearly: 0,
    features: ["1 turma", "Geração automática de horários", "Detecção de conflitos", "Sem cartão de crédito"],
  },
  {
    id: "bronze",
    name: "Bronze",
    tagline: "Para escolas pequenas e coordenadores começando a organizar a grade.",
    maxTurmas: 10,
    priceMonthly: 49.9,
    priceYearly: 499,
    features: [
      "Até 10 turmas",
      "Geração automática de horários",
      "Cadastro de professores e disciplinas",
      "Exportação em PDF",
      "Suporte por e-mail",
    ],
  },
  {
    id: "prata",
    name: "Prata",
    tagline: "O equilíbrio ideal para a maioria das escolas de médio porte.",
    maxTurmas: 25,
    priceMonthly: 99.9,
    priceYearly: 999,
    highlight: true,
    features: [
      "Até 25 turmas",
      "Tudo do plano Bronze",
      "Detecção avançada de conflitos",
      "Múltiplos usuários (coordenação)",
      "Suporte prioritário",
    ],
  },
  {
    id: "ouro",
    name: "Ouro",
    tagline: "Para redes de ensino e escolas com grande volume de turmas.",
    maxTurmas: null,
    priceMonthly: 179.9,
    priceYearly: 1799,
    features: [
      "Turmas ilimitadas",
      "Tudo do plano Prata",
      "Múltiplas unidades/filiais",
      "Exportação em massa (PDF/Excel)",
      "Gerente de conta dedicado",
    ],
  },
]

// "Teste grátis" não entra na grade de preços (não é um plano pago) — só a UI de planos usa isto.
export const PAID_PLANS = PLANS.filter((p) => p.id !== "teste")

export const getPlan = (id: PlanId): Plan => PLANS.find((p) => p.id === id)!
