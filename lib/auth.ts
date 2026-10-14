import { getAuth0 } from "./auth0";

export const STUB_USER = {
  sub: "stub|xavier-local",
  name: "Xavier (local stub)",
  email: "xavier@localhost",
};

export function isAuthStub() {
  return process.env.AUTH_STUB === "1" || process.env.NEXT_PUBLIC_AUTH_STUB === "1";
}

export type AppUser = {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
};

export async function getCurrentUser(): Promise<AppUser | null> {
  if (isAuthStub()) {
    return STUB_USER;
  }

  const session = await getAuth0().getSession();
  if (!session?.user?.sub) {
    return null;
  }

  return {
    sub: session.user.sub,
    name: session.user.name,
    email: session.user.email,
    picture: session.user.picture,
  };
}
