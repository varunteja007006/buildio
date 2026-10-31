import { GroupView } from "@/components/group-view";

export default async function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <GroupView groupId={id} />
    </main>
  );
}
