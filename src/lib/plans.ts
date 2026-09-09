export type Plan = 'monthly' | 'yearly' | 'yearly_referral';

export const PLAN_LABELS: Record<Plan, string> = {
  monthly: 'Monthly — €5/mo',
  yearly: 'Yearly — €50/yr',
  yearly_referral: 'Yearly (referral rate) — €30/yr',
};

export function isPlan(value: unknown): value is Plan {
  return value === 'monthly' || value === 'yearly' || value === 'yearly_referral';
}
