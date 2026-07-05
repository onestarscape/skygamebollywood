import { RoomClient } from "@/components/room-client";

export default async function RoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return (
    <main className="container py-6">
      <RoomClient code={code.toUpperCase()} />
    </main>
  );
}
