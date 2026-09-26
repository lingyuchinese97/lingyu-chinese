import type { Messages } from "../vi";
import { admin } from "./admin";
import { api } from "./api";
import { auth } from "./auth";
import { common } from "./common";
import { errors } from "./errors";
import { grammar } from "./grammar";
import { home } from "./home";
import { landing } from "./landing";
import { lessons } from "./lessons";
import { listening } from "./listening";
import { meta } from "./meta";
import { notifications } from "./notifications";
import { pages } from "./pages";
import { pronunciation } from "./pronunciation";
import { radicals } from "./radicals";
import { review } from "./review";
import { sentences } from "./sentences";
import { settings } from "./settings";
import { shell } from "./shell";
import { ui } from "./ui";
import { vocab } from "./vocab";

export const en: Messages = {
  meta,
  common,
  errors,
  ui,
  shell,
  notifications,
  auth,
  landing,
  home,
  settings,
  pages,
  admin,
  api,
  grammar,
  lessons,
  listening,
  pronunciation,
  radicals,
  review,
  sentences,
  vocab,
};
