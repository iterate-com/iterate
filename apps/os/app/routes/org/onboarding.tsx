import { Suspense, useState } from "react";
import { ArrowRight, Check, CheckCircle, Loader2 } from "lucide-react";
import { redirect, useLoaderData, useSearchParams } from "react-router";
import { asc, eq } from "drizzle-orm";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { getDb } from "../../../backend/db/client.ts";
import { estate } from "../../../backend/db/schema.ts";
import { Button } from "../../components/ui/button.tsx";
import { Input } from "../../components/ui/input.tsx";
import { Badge } from "../../components/ui/badge.tsx";
import { useTRPC } from "../../lib/trpc.ts";
import { authClient } from "../../lib/auth-client.ts";
import type { Route } from "./+types/onboarding.ts";

export async function loader({ params }: Route.LoaderArgs) {
  const { organizationId } = params;

  // Parent loader already checked session and organization access
  // We just need to get the first estate for this organization
  if (!organizationId) {
    throw redirect("/");
  }
  const db = getDb();
  const firstEstate = await db.query.estate.findFirst({
    where: eq(estate.organizationId, organizationId),
    orderBy: asc(estate.createdAt),
  });

  if (!firstEstate) {
    throw new Error(`The organization ${organizationId} has no estates, this should never happen.`);
  }
  return {
    organizationId,
    estateId: firstEstate.id,
  };
}

function OrganizationNameStep({
  organizationId,
  onComplete,
}: {
  organizationId: string;
  onComplete: () => void;
}) {
  const trpc = useTRPC();
  const { data: organization } = useSuspenseQuery(
    trpc.organization.get.queryOptions({ organizationId }),
  );

  const [organizationName, setOrganizationName] = useState(() => organization.name);
  const [error, setError] = useState<string | null>(null);

  const updateOrganization = useMutation(
    trpc.organization.updateName.mutationOptions({
      onSuccess: () => {
        setError(null);
        onComplete();
      },
      onError: (mutationError) => {
        setError(mutationError.message);
      },
    }),
  );

  return (
    <form
      className="space-y-6"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        const trimmedName = organizationName.trim();
        if (!trimmedName) {
          setError("Organization name is required");
          return;
        }
        await updateOrganization.mutateAsync({
          organizationId,
          name: trimmedName,
        });
      }}
    >
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Step 1 of 2</p>
        <h2 className="text-lg font-semibold">Confirm organization name</h2>
      </div>
      <div className="space-y-4">
        <Input
          value={organizationName}
          onChange={(event) => {
            setOrganizationName(event.target.value);
            setError(null);
          }}
          disabled={updateOrganization.isPending}
          autoFocus
          onFocus={(event) => {
            event.currentTarget.select();
          }}
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={updateOrganization.isPending}>
          {updateOrganization.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Confirming
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Confirm
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

function SlackStep({ estateId, organizationId }: { estateId: string; organizationId: string }) {
  const trpc = useTRPC();
  const { data: integrations } = useSuspenseQuery(
    trpc.integrations.list.queryOptions({ estateId }),
  );

  const slackIntegration = integrations.oauthIntegrations.find(
    (integration) => integration.id === "slack-bot",
  );
  const isConnected = slackIntegration?.isConnected ?? false;

  const [error, setError] = useState<string | null>(null);

  const connectSlack = useMutation({
    mutationFn: async () => {
      const callbackURL = `/${organizationId}/onboarding?step=slack&success=true`;
      const result = await authClient.integrations.link.slackBot({
        estateId,
        callbackURL,
      });
      window.location.href = result.url.toString();
      return result;
    },
  });

  const onboard = useMutation(trpc.organization.onboard.mutationOptions({}));

  const handleConnect = async () => {
    setError(null);
    try {
      await connectSlack.mutateAsync();
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Failed to connect Slack");
    }
  };

  const handleOpenSlack = () => {
    window.open("slack://open", "_blank");
  };

  const handleComplete = async () => {
    await onboard.mutateAsync({ organizationId });
    window.location.href = `/`;
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Step 2 of 2</p>
        <h2 className="text-lg font-semibold">Connect Slack</h2>
      </div>
      <div className="space-y-4">
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded border bg-background">
              <img src="/slack.svg" alt="Slack" className="h-4 w-4" />
            </div>
            <span>Use Slack to talk to iterate.</span>
          </div>
          <p>
            Mention
            <Badge variant="secondary" className="mx-2 font-mono">
              @iterate
            </Badge>
            in Slack to start working with the agent team.
          </p>
        </div>
        {isConnected ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Slack is connected</span>
          </div>
        ) : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
      <div className="flex justify-between">
        {isConnected ? (
          <>
            <Button variant="outline" onClick={handleOpenSlack}>
              Open Slack
            </Button>
            <Button onClick={handleComplete} disabled={onboard.isPending}>
              {onboard.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Finishing setup
                </>
              ) : (
                "Complete setup"
              )}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <div />
            <Button onClick={handleConnect} disabled={connectSlack.isPending}>
              {connectSlack.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting Slack
                </>
              ) : (
                "Connect Slack"
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default function OrganizationOnboarding({ params }: Route.ComponentProps) {
  const { organizationId } = params;
  const { estateId } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlStep = searchParams.get("step") ?? "name";

  if (!organizationId) {
    return null;
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          }
        >
          <div className={urlStep === "name" ? "" : "hidden"}>
            <OrganizationNameStep
              organizationId={organizationId}
              onComplete={() => setSearchParams({ step: "slack" })}
            />
          </div>
          <div className={urlStep === "slack" ? "" : "hidden"}>
            <SlackStep estateId={estateId} organizationId={organizationId} />
          </div>
        </Suspense>
      </div>
    </main>
  );
}
