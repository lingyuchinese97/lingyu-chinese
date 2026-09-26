import { auth } from "./auth";
import { common } from "./common";
import { errors } from "./errors";
import { home } from "./home";
import { landing } from "./landing";
import { meta } from "./meta";
import { notifications } from "./notifications";
import { pages } from "./pages";
import { sentences } from "./sentences";
import { settings } from "./settings";
import { shell } from "./shell";
import { ui } from "./ui";
import { vocab } from "./vocab";

/** Từ điển gốc (tiếng Việt). Mọi ngôn ngữ khác phải có đủ đúng các khoá này (kiểm tra bằng TypeScript). */
export const vi = {
  meta,
  common,
  errors,
  shell,
  notifications,
  auth,
  landing,
  home,
  settings,
  pages,
  ui,
  vocab,
  sentences,
};
export type Messages = typeof vi;
