import { subscriptions, users } from "@/lib/db-schema";
import { db } from "@/lib/drizzle";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { PostHog } from "posthog-node";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-10-28.acacia",
  appInfo: {
    name: "Tweet Maestro",
    version: "0.0.0",
    url: process.env.NEXT_PUBLIC_ENV_URL!,
  },
});

const posthog = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  flushAt: 1,
  flushInterval: 1000,
});

export async function POST(request: Request) {
  const payload = await request.text();
  const stripeSig = request.headers.get("stripe-signature");

  let event: Stripe.Event;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    event = stripe.webhooks.constructEvent(payload, stripeSig!, endpointSecret!);
  } catch (err: any) {
    console.log(err);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const sessionWithLineItems = await stripe.checkout.sessions.retrieve(event.data.object.id, {
        expand: ["line_items"],
      });
      const lineItems = sessionWithLineItems.line_items;
      const price_id = lineItems?.data[0].price?.id;
      const user_id = sessionWithLineItems.metadata?.user_id;
      const user_email = sessionWithLineItems.customer_details?.email;
      const plan = sessionWithLineItems.metadata?.plan;

      console.log("User ID:", user_id);
      console.log("Email:", user_email);
      console.log("Price ID:", price_id);

      if (!user_id) {
        return new Response("Invalid user ID", { status: 400 });
      }

      console.log();
      if (
        price_id === process.env.NEXT_PUBLIC_PRICE_ID_10 ||
        price_id === process.env.NEXT_PUBLIC_PRICE_ID_30 ||
        price_id === process.env.NEXT_PUBLIC_PRICE_ID_50 ||
        price_id === process.env.NEXT_PUBLIC_PRICE_ID_100 ||
        price_id === process.env.NEXT_PUBLIC_MPID_10 ||
        price_id === process.env.NEXT_PUBLIC_MPID_20
      ) {
        await db.insert(subscriptions).values({
          id:
            plan === "lifetime"
              ? sessionWithLineItems.id
              : (sessionWithLineItems.subscription as string),
          user_id: user_id,
          price_id: price_id as string,
          type: plan as "lifetime" | "monthly",
          active: true,
          customer_id: sessionWithLineItems.customer as string,
        });

        if (user_email) {
          await db
            .update(users)
            .set({
              email: user_email,
            })
            .where(eq(users.id, user_id));
        }

        // console.log(sessionWithLineItems.customer_details?.email, sessionWithLineItems.customer_email);

        posthog.identify({
          distinctId: user_id,
          properties: {
            handle: sessionWithLineItems.metadata?.handle,
            email: sessionWithLineItems.customer_email,
          },
        });

        posthog.capture({
          distinctId: user_id,
          event: "checkout-completed",
        });

        posthog.shutdown();
      }
      break;
    case "customer.subscription.deleted":
      console.log(event.data.object);
      const subscription = event.data.object as Stripe.Subscription;
      await db
        .update(subscriptions)
        .set({ active: false })
        .where(eq(subscriptions.id, subscription.id));
      break;
    default:
      return new Response(`Unhandled event type ${event.type}`, { status: 400 });
  }

  return new Response("Event handled successfully", { status: 200 });
}
