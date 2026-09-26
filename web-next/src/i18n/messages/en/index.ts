import type { Messages } from "../vi";
import { auth } from "./auth";
import { common } from "./common";
import { errors } from "./errors";
import { home } from "./home";
import { landing } from "./landing";
import { meta } from "./meta";
import { notifications } from "./notifications";
import { pages } from "./pages";
import { settings } from "./settings";
import { shell } from "./shell";

export const en: Messages = { meta, common, errors, shell, notifications, auth, landing, home, settings, pages };
