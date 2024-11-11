import { users } from "@/lib/db-schema";
import { db } from "@/lib/drizzle";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-09-30.acacia",
  appInfo: {
    name: "Chesski",
    version: "0.0.0",
    url: process.env.NEXT_PUBLIC_ENV_URL!,
  },
});

export async function POST(request: Request) {
  const { user, priceId } = await request.json();

  console.log("Received user data:", user);

  const session = await stripe.checkout.sessions.create({
    success_url: `${process.env.NEXT_PUBLIC_ENV_URL}/dashboard`,
    cancel_url: `${process.env.NEXT_PUBLIC_ENV_URL}/dashboard`,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: "payment",
    metadata: {
      user_id: user.id,
    },
    // allow_promotion_codes: true,
  });

  if (!session) {
    return new Response(JSON.stringify({ error: "Failed to create checkout session" }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify({ url: session.url }), { status: 200 });
}
