import { BriefingBanner } from "./components/BriefingBanner";
import { InboxCard } from "./components/InboxCard";
import { DriveCard } from "./components/DriveCard";
import { TasksCard } from "./components/TasksCard";
import { ComplaintsCard } from "./components/ComplaintsCard";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Life at a glance
        </h1>
        <p className="text-sm text-zinc-500">
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </header>

      <div className="mb-6">
        <BriefingBanner />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <InboxCard />
        <DriveCard />
        <TasksCard />
        <ComplaintsCard />
      </div>
    </main>
  );
}
