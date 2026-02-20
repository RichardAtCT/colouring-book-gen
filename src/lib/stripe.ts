import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-01-28.clover",
    });
  }
  return _stripe;
}

export const PLANS = {
  pro: {
    name: "Pro",
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? "",
    price: "£5/mo",
    features: [
      "30 pages per day",
      "500 pages per month",
      "Low + Medium quality",
      "Gallery & favourites",
      "Book compiler",
    ],
  },
  creator: {
    name: "Creator",
    priceId: process.env.STRIPE_CREATOR_PRICE_ID ?? "",
    price: "£15/mo",
    features: [
      "100 pages per day",
      "2,000 pages per month",
      "All quality levels",
      "Gallery & favourites",
      "Book compiler",
      "Priority support",
    ],
  },
} as const;

export const FREE_PLAN = {
  name: "Free",
  price: "£0",
  features: [
    "5 pages per day",
    "30 pages per month",
    "Low quality only",
    "Gallery & favourites",
  ],
};
