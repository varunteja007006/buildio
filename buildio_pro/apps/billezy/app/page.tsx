import { CreateGroupForm } from "@/components/create-group-form";
import { RecentGroups } from "@/components/recent-groups";

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center px-3 py-6 sm:px-4 sm:py-10">
      <div className="w-full max-w-xl flex flex-col items-center gap-4 sm:gap-6">
        <div className="text-center space-y-2">
          <h1 className="text-primary text-3xl font-bold sm:text-4xl">
            Billezy
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Split bills for shared group expenses. We tell you who owes whom and
            how to settle debts in the group.
          </p>
        </div>

        <CreateGroupForm />

        <RecentGroups />

        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 text-center">
          <div className="rounded-lg border p-3">
            <p className="font-medium">Free &amp; easy</p>
            <p className="text-muted-foreground text-sm">
              No sign-up. No download.
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="font-medium">Partial expenses</p>
            <p className="text-muted-foreground text-sm">
              Not everyone joined every expense? No problem.
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="font-medium">Share the result</p>
            <p className="text-muted-foreground text-sm">
              Send the link. Everyone sees the settlement live.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
