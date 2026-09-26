import type { Messages } from "../vi";
import { admin } from "./admin";
import { auth } from "./auth";
import { common } from "./common";
import { errors } from "./errors";
import { grammar } from "./grammar";
import { home } from "./home";
import { landing } from "./landing";
import { lessons } from "./lessons";
import { meta } from "./meta";
import { notifications } from "./notifications";
import { pages } from "./pages";
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
  grammar,
  lessons,
  radicals,
  review,
  sentences,
  vocab,
};
