import Stripe from "stripe";

let _instance: Stripe | null = null;

function getInstance(): Stripe {
  if (!_instance) {
    _instance = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return _instance;
}

export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    return Reflect.get(getInstance(), prop, receiver);
  },
  set(_target, prop, value, receiver) {
    return Reflect.set(getInstance(), prop, value, receiver);
  },
}) as Stripe;
