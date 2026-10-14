import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function AuthCta({ size = "md" }: { size?: "md" | "lg" }) {
  await connection();
  let signedIn = false;
  try {
    signedIn = Boolean(await getCurrentUser());
  } catch {
    signedIn = false;
  }

  const className = size === "lg" ? "btn-primary lg" : "btn-primary";
  if (signedIn) {
    return (
      <a className={className} href="/play">
        {size === "lg" ? "Jump in the pool" : "Start racing"}
      </a>
    );
  }

  return (
    <a className={className} href="/auth/login?returnTo=/play">
      Parent sign in
    </a>
  );
}
