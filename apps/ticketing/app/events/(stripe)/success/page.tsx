import { redirect } from "next/navigation";
import ViewWithRedirect from "../ViewWithRedirect";
import { CharacterBackground } from "@/components/ui/CharacterBackground";
import Stripe from "stripe";
import { fetchEventServer, publicToFetchedData } from "@/lib/api/fetchEventServer";
import { CheckIcon } from "lucide-react";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id: string, event_id: string }>
}) {
  const { session_id, event_id } = await searchParams;
  if (!event_id) {
    redirect("/");
  }

  let session;
  if (!!session_id) {
    session = await stripe.checkout.sessions.retrieve(session_id);
  }

  let eventName = "Event";
  if (!!event_id) {
    const eventData = await fetchEventServer(event_id, { requirePublished: false });
    if (eventData) {
      const fetched = publicToFetchedData(eventData);
      eventName = fetched.formData.name ?? "Event";
    }
  }

  return (
    <ViewWithRedirect to="/">
      <div
        className="fixed inset-0 bg-gray-100 -z-10"
      />
      <CharacterBackground />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-foreground px-4">
        <div className="size-16 rounded-full bg-green-500/20 flex items-center justify-center">
          <CheckIcon className="size-8 text-green-500" />
        </div>
        <h1 className={`text-3xl font-bold tracking-tight text-foreground`}>
          Payment successful!
        </h1>
        <p className={`text-lg`}>
          You&rsquo;re all set for <span className="font-semibold">{eventName}</span>
        </p>
        {!!session &&
          <p className={`text-sm`}>
            Order ID: {session.id}
          </p>
        }
      </div>
    </ViewWithRedirect>
  );
}

