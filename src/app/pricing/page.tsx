"use client";

import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const PLANS = [
  {
    key: "free",
    name: "Free",
    price: "\u00A30",
    period: "",
    features: [
      "5 pages per day",
      "30 pages per month",
      "Low quality only",
      "Gallery & favourites",
    ],
    cta: "Current Plan",
    disabled: true,
  },
  {
    key: "pro",
    name: "Pro",
    price: "\u00A35",
    period: "/month",
    features: [
      "30 pages per day",
      "500 pages per month",
      "Low + Medium quality",
      "Gallery & favourites",
      "Book compiler",
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
  },
  {
    key: "creator",
    name: "Creator",
    price: "\u00A315",
    period: "/month",
    features: [
      "100 pages per day",
      "2,000 pages per month",
      "All quality levels",
      "Gallery & favourites",
      "Book compiler",
      "Priority support",
    ],
    cta: "Upgrade to Creator",
  },
];

export default function PricingPage() {
  const { data: session } = useSession();

  const handleUpgrade = async (plan: string) => {
    if (!session) {
      // Redirect to sign in
      window.location.href = "/api/auth/signin";
      return;
    }

    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });

    const data = await response.json();
    if (data.url) {
      window.location.href = data.url;
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Pricing</h2>
        <p className="text-muted-foreground">
          Choose a plan that fits your needs.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => (
          <Card
            key={plan.key}
            className={`p-6 space-y-4 ${plan.highlighted ? "border-primary border-2" : ""}`}
          >
            {plan.highlighted && (
              <span className="text-xs font-medium text-primary">
                Most Popular
              </span>
            )}
            <div>
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <p className="text-3xl font-bold">
                {plan.price}
                <span className="text-sm font-normal text-muted-foreground">
                  {plan.period}
                </span>
              </p>
            </div>
            <ul className="space-y-2 text-sm">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">&#x2713;</span>
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              className="w-full"
              variant={plan.highlighted ? "default" : "outline"}
              disabled={plan.disabled}
              onClick={() => handleUpgrade(plan.key)}
            >
              {plan.cta}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
