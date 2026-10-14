import { connection } from "next/server";
import { redirect } from "next/navigation";
import { PlayClient } from "@/components/PlayClient";
import { getCurrentUser, isAuthStub } from "@/lib/auth";
import { DEFAULT_DRILL } from "@/lib/drills";
import { getFastestRuns, getPersonalBestMs } from "@/lib/runs";

export const instant = false;

export default async function PlayPage() {
  await connection();
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login?returnTo=/play");
  }

  const drill = DEFAULT_DRILL;
  let ghosts: Awaited<ReturnType<typeof getFastestRuns>> = [];
  let previousBestMs: number | null = null;

  try {
    ghosts = await getFastestRuns(user.sub, drill.id, 3);
    previousBestMs = await getPersonalBestMs(user.sub, drill.id);
  } catch {
    ghosts = [];
  }

  return (
    <PlayClient
      drill={{
        id: drill.id,
        label: drill.label,
        raceMeters: drill.raceMeters,
        alphabet: [...drill.alphabet],
      }}
      ghosts={ghosts}
      previousBestMs={previousBestMs}
      stub={isAuthStub()}
    />
  );
}
