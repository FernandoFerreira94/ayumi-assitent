"use client";
import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";

/** O login por senha de quem tem 2FA (só o dono) devolve twoFactorRedirect; o LoginForm pede o código ali mesmo. */
export const authClient = createAuthClient({ plugins: [twoFactorClient()] });
