import { CreateGroupForm } from "@/components/create-group-form";

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-16">
      <div className="w-full max-w-xl flex flex-col items-center gap-8">
        <div className="text-center space-y-3">
          <h1 className="text-primary text-5xl font-bold">Billezy</h1>
          <p className="text-muted-foreground text-lg">
            Split bills for shared group expenses. We tell you who owes whom
            and how to settle debts in the group.
          </p>
        </div>

        <CreateGroupForm />

        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3 text-center">
          <div className="rounded-lg border p-4">
            <p className="font-medium">Free &amp; easy</p>
            <p className="text-muted-foreground text-sm">
              No sign-up. No download.
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="font-medium">Partial expenses</p>
            <p className="text-muted-foreground text-sm">
              Not everyone joined every expense? No problem.
            </p>
          </div>
          <div className="rounded-lg border p-4">
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
