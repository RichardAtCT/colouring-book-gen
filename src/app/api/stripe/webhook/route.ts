import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      const plan = session.metadata?.plan as "pro" | "creator";

      if (userId && plan) {
        await db
          .update(users)
          .set({ plan })
          .where(eq(users.id, userId));
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const customerEmail =
        typeof subscription.customer === "string"
          ? null
          : null;

      // Look up user by Stripe customer and downgrade
      if (subscription.metadata?.userId) {
        await db
          .update(users)
          .set({ plan: "free" })
          .where(eq(users.id, subscription.metadata.userId));
      } else if (customerEmail) {
        await db
          .update(users)
          .set({ plan: "free" })
          .where(eq(users.email, customerEmail));
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
