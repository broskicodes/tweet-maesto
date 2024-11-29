import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-10-28.acacia",
  appInfo: {
    name: "Tweet Maestro",
    version: "0.0.0",
    url: process.env.NEXT_PUBLIC_ENV_URL!,
  },
});

export async function POST(request: Request) {
  const { user, priceId, plan } = await request.json();

  console.log("Received user data:", user);

  const session = await stripe.checkout.sessions.create({
    success_url: `${process.env.NEXT_PUBLIC_ENV_URL}/compose`,
    cancel_url: `${process.env.NEXT_PUBLIC_ENV_URL}/`,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: plan === "lifetime" ? "payment" : "subscription",
    metadata: {
      user_id: user.id,
      handle: user.handle,
      plan: plan,
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
