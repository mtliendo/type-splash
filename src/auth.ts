import { createAuth0Client, type Auth0Client } from "@auth0/auth0-spa-js";

export const STUB_SUB = "stub|xavier-local";

let clientPromise: Promise<Auth0Client> | null = null;

export function isAuthStub() {
  return import.meta.env.VITE_AUTH_STUB === "1";
}

function playUrl() {
  return `${window.location.origin}/play`;
}

export function getAuth0Client() {
  if (isAuthStub()) {
    throw new Error("Auth0 is skipped while VITE_AUTH_STUB=1");
  }
  if (!clientPromise) {
    const domain = import.meta.env.VITE_AUTH0_DOMAIN;
    const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
    const audience = import.meta.env.VITE_AUTH0_AUDIENCE;
    if (!domain || !clientId || !audience) {
      throw new Error("Missing VITE_AUTH0_DOMAIN, VITE_AUTH0_CLIENT_ID, or VITE_AUTH0_AUDIENCE");
    }
    clientPromise = createAuth0Client({
      domain,
      clientId,
      authorizationParams: {
        redirect_uri: playUrl(),
        audience,
      },
      cacheLocation: "localstorage",
      useRefreshTokens: true,
    });
  }
  return clientPromise;
}

export async function loginToPlay() {
  if (isAuthStub()) {
    window.location.assign("/play");
    return;
  }
  const client = await getAuth0Client();
  await client.loginWithRedirect({
    appState: { returnTo: "/play" },
    authorizationParams: { redirect_uri: playUrl() },
  });
}

export async function logoutHome() {
  if (isAuthStub()) {
    window.location.assign("/");
    return;
  }
  const client = await getAuth0Client();
  await client.logout({ logoutParams: { returnTo: window.location.origin } });
}

export async function requirePlaySession(): Promise<{ stub: boolean }> {
  if (isAuthStub()) return { stub: true };

  const client = await getAuth0Client();
  const params = new URLSearchParams(window.location.search);
  if (params.has("code") && params.has("state")) {
    await client.handleRedirectCallback();
    const clean = new URL(window.location.href);
    clean.searchParams.delete("code");
    clean.searchParams.delete("state");
    window.history.replaceState({}, document.title, `${clean.pathname}${clean.search}${clean.hash}`);
  }

  const signedIn = await client.isAuthenticated();
  if (!signedIn) {
    await client.loginWithRedirect({
      appState: { returnTo: "/play" },
      authorizationParams: { redirect_uri: playUrl() },
    });
    return new Promise(() => undefined);
  }
  return { stub: false };
}

export async function isSignedIn() {
  if (isAuthStub()) return true;
  try {
    const client = await getAuth0Client();
    const params = new URLSearchParams(window.location.search);
    if (params.has("code") && params.has("state")) {
      return true;
    }
    return client.isAuthenticated();
  } catch {
    return false;
  }
}

export async function getAccessToken() {
  if (isAuthStub()) return null;
  const client = await getAuth0Client();
  return client.getTokenSilently();
}
