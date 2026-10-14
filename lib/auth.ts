import { createRemoteJWKSet, jwtVerify } from "jose";

export const STUB_USER = {
  sub: "stub|xavier-local",
  name: "Xavier (local stub)",
};

export function isAuthStub() {
  return process.env.AUTH_STUB === "1" || process.env.VITE_AUTH_STUB === "1";
}

function domain() {
  const value = process.env.AUTH0_DOMAIN ?? "";
  return value.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function issuer() {
  return process.env.AUTH0_ISSUER ?? `https://${domain()}/`;
}

function audience() {
  return process.env.AUTH0_AUDIENCE ?? process.env.VITE_AUTH0_AUDIENCE ?? "";
}

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks() {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`https://${domain()}/.well-known/jwks.json`));
  }
  return jwks;
}

export async function getUserSub(request: Request): Promise<string | null> {
  if (isAuthStub()) {
    return STUB_USER.sub;
  }

  const header = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) return null;

  const { payload } = await jwtVerify(token, getJwks(), {
    issuer: issuer(),
    audience: audience(),
  });

  return typeof payload.sub === "string" ? payload.sub : null;
}
