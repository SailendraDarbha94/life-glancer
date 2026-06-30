import { BriefingBanner } from "./components/BriefingBanner";
import { InboxCard } from "./components/InboxCard";
import { DriveCard } from "./components/DriveCard";
import { TasksCard } from "./components/TasksCard";
import { ComplaintsCard } from "./components/ComplaintsCard";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground text-glow">
            Life at a glance
          </h1>
          <p className="font-mono text-xs tracking-wide text-muted">
            {new Date()
              .toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })
              .toUpperCase()}
          </p>
        </div>
        <span className="hidden items-center gap-2 font-mono text-[10px] tracking-widest text-accent uppercase sm:flex">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
          online
        </span>
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
