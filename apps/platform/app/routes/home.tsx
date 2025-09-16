import type { Route } from "./+types/home";
import { useState } from "react";
import { CheckCircle, ArrowRight } from "lucide-react";

import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { DashboardLayout } from "../components/dashboard-layout";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Iterate Dashboard" },
    { name: "description", content: "Iterate platform dashboard" },
  ];
}

function ConnectSlackCard() {
  const [isConnected, setIsConnected] = useState(false);

  const handleConnectSlack = () => {
    // Simulate connecting to Slack
    setIsConnected(true);
  };

  const handleGoToSlack = () => {
    // Open Slack
    window.open("slack://open", "_blank");
  };

  return (
    <div className="max-w-4xl mx-auto px-8 pt-16 pb-8">
      {/* Header with Slack logo */}
      <div className="mb-8">
        <img
          src="/slack.png"
          alt="Slack"
          className="w-20 h-20 mb-6 object-contain"
        />

        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
          Connect Slack
        </h1>

        <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
          Connect Slack to start using iterate. Just{" "}
          <Badge
            variant="secondary"
            className="font-mono text-base px-2 py-0.5 mx-1"
          >
            @iterate
          </Badge>{" "}
          in Slack to help with your tasks like managing Linear tickets,
          searching Notion, adding Gmail users and sending emails.
        </p>
      </div>

      {/* Integration status */}
      {isConnected ? (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            <span className="text-green-700 dark:text-green-300 font-medium">
              Slack Connected
            </span>
          </div>

          <Button
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-8 py-4 h-12"
            onClick={handleGoToSlack}
          >
            Go to Slack
            <ArrowRight className="h-4 w-4 ml-3" />
          </Button>
        </div>
      ) : (
        <Button
          size="lg"
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-8 py-4 h-12"
          onClick={handleConnectSlack}
        >
          Connect Slack
          <ArrowRight className="h-4 w-4 ml-3" />
        </Button>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center items-center min-h-[400px]">
            <ConnectSlackCard />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
