import Stripe from 'stripe';
import { type Plan } from '@/lib/plans';

export { type Plan, PLAN_LABELS, isPlan } from '@/lib/plans';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

const PLAN_PRICE_ENV: Record<Plan, string> = {
  monthly: 'STRIPE_PRICE_MONTHLY',
  yearly: 'STRIPE_PRICE_YEARLY',
  yearly_referral: 'STRIPE_PRICE_YEARLY_REFERRAL',
};

export function priceIdForPlan(plan: Plan): string {
  const envKey = PLAN_PRICE_ENV[plan];
  const id = process.env[envKey];
  if (!id) throw new Error(`Missing Stripe price id for plan "${plan}" -- set ${envKey} in .env`);
  return id;
}
