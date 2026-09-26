import type { Locale } from "../config";
import { en } from "./en";
import { vi, type Messages } from "./vi";

export const MESSAGES: Record<Locale, Messages> = { vi, en };
