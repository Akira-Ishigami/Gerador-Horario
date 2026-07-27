// Espelha os planos pagos de src/config/branding.ts (PLANS). Duplicado de
// propósito: Edge Functions (Deno) não importam o código do frontend (Vite).
// Se mudar preço/plano lá, atualize aqui também.
export const PAID_PLAN_PRICES: Record<string, number> = {
  bronze: 49.9,
  prata: 99.9,
  ouro: 179.9,
}

export function isPaidPlanId(value: string): value is keyof typeof PAID_PLAN_PRICES {
  return value in PAID_PLAN_PRICES
}
