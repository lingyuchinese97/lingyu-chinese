"use client";
import { createAuthClient } from "better-auth/react";

/** Client của Better Auth: gọi /api/auth/* cùng origin (đi qua rate limiter của server). */
export const authClient = createAuthClient();
