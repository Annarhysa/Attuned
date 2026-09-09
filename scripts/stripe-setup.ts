/**
 * One-time setup: creates the Attuned Membership product and its three
 * recurring prices (monthly, yearly, yearly-referral) in your Stripe
 * account, then prints the price IDs to paste into .env.
 *
 * Usage: STRIPE_SECRET_KEY=sk_test_... npx tsx scripts/stripe-setup.ts
 * (or just make sure STRIPE_SECRET_KEY is already set in .env)
 */
import 'dotenv/config';
import Stripe from 'stripe';

async function main() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error('Set STRIPE_SECRET_KEY (a Stripe test-mode secret key, starts with sk_test_) before running this script.');
    process.exit(1);
  }

  const stripe = new Stripe(secretKey);

  const product = await stripe.products.create({ name: 'Attuned Membership' });

  const [monthly, yearly, yearlyReferral] = await Promise.all([
    stripe.prices.create({ product: product.id, currency: 'eur', unit_amount: 500, recurring: { interval: 'month' }, nickname: 'Monthly' }),
    stripe.prices.create({ product: product.id, currency: 'eur', unit_amount: 5000, recurring: { interval: 'year' }, nickname: 'Yearly' }),
    stripe.prices.create({ product: product.id, currency: 'eur', unit_amount: 3000, recurring: { interval: 'year' }, nickname: 'Yearly (referral rate)' }),
  ]);

  console.log('\nAdd these to your .env:\n');
  console.log(`STRIPE_PRICE_MONTHLY="${monthly.id}"`);
  console.log(`STRIPE_PRICE_YEARLY="${yearly.id}"`);
  console.log(`STRIPE_PRICE_YEARLY_REFERRAL="${yearlyReferral.id}"`);
  console.log('\nThen run the Stripe CLI to forward webhooks for local dev:');
  console.log('  stripe listen --forward-to localhost:3000/api/billing/webhook');
  console.log('and paste the printed whsec_... value into STRIPE_WEBHOOK_SECRET.\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
