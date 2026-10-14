import { Auth0Client } from "@auth0/nextjs-auth0/server";

function resolveAppBaseUrl() {
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

let client: Auth0Client | null = null;

export function getAuth0() {
  if (!client) {
    client = new Auth0Client({
      domain: process.env.AUTH0_DOMAIN,
      clientId: process.env.AUTH0_CLIENT_ID,
      clientSecret: process.env.AUTH0_CLIENT_SECRET,
      secret: process.env.AUTH0_SECRET,
      appBaseUrl: resolveAppBaseUrl(),
      routes: {
        login: "/auth/login",
        callback: "/auth/callback",
        logout: "/auth/logout",
      },
    });
  }
  return client;
}

export const auth0 = {
  middleware: (request: Parameters<Auth0Client["middleware"]>[0]) => getAuth0().middleware(request),
  getSession: (request?: Parameters<Auth0Client["getSession"]>[0]) =>
    request ? getAuth0().getSession(request) : getAuth0().getSession(),
};
