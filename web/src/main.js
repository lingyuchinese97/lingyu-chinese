import { route, setGuard, setNotFound, startRouter } from "./routes/router.js";
import { mountAppShell, updateShell } from "./components/layout/appShell.js";
import { getCurrentUser, getPendingVerification } from "./services/api/authApi.js";
import { renderLogin } from "./features/auth/login.js";
import { renderRegister } from "./features/auth/register.js";
import { renderVerifyEmail } from "./features/auth/verifyEmail.js";
import { renderVerifySuccess } from "./features/auth/verifySuccess.js";
import { renderForgotPassword } from "./features/auth/forgotPassword.js";
import { renderHome } from "./features/home/home.js";
import { renderVocabularyList } from "./features/vocabulary/list.js";
import { renderVocabularyForm } from "./features/vocabulary/form.js";
import { renderReviewSetup } from "./features/review/setup.js";
import { renderReviewSession } from "./features/review/session.js";
import { renderReviewResult } from "./features/review/result.js";
import { renderSettings } from "./features/settings/settings.js";
import { renderGrammarList } from "./features/grammar/list.js";
import { renderGrammarForm } from "./features/grammar/form.js";
import { renderGrammarDetail } from "./features/grammar/detail.js";
import { renderRadicalList } from "./features/radicals/list.js";
import { renderRadicalDetail } from "./features/radicals/detail.js";

const root = document.getElementById("root");

const TITLES = {
  "/login": "Đăng nhập", "/register": "Đăng ký", "/verify-email": "Xác thực email", "/verify-success": "Xác thực thành công",
  "/forgot-password": "Quên mật khẩu",
};

function authPage(render, title) {
  return (ctx) => {
    document.title = `${title} · LingYu Chinese`;
    root.dataset.layout = "auth";
    return render(root, ctx);
  };
}

function appPage(render, { nav, title, quote, topQuote }) {
  return (ctx) => {
    document.title = `${title} · LingYu Chinese`;
    if (root.dataset.layout !== "app") { root.dataset.layout = "app"; root.innerHTML = ""; }
    mountAppShell(root);
    const page = updateShell({ nav, quote, topQuote });
    return render(page, ctx);
  };
}

const Q = {
  home: "Cùng LingYu<br/>khám phá thế giới tiếng Trung<br/>thật thú vị nhé!",
  vocab: "Học mỗi ngày<br/>Một phiên bản tốt hơn<br/>của chính mình!",
  setup: "Ôn tập hôm nay,<br/>tự tin hơn mỗi ngày!",
  session: "Cố gắng mỗi ngày<br/>Tiếng Trung sẽ gần hơn!",
  result: "Kiên trì hôm nay,<br/>tiến bộ mỗi ngày!",
  settings: "Small steps,<br/>big future!",
  radicals: "Hiểu bộ thủ,<br/>nhớ chữ Hán<br/>thật dễ dàng!",
  grammar: "Nắm vững ngữ pháp,<br/>nói tiếng Trung<br/>tự tin hơn!",
};
const TQ = {
  learn: "Learn Today<br/>A Brighter Tomorrow",
  vi: "Học hôm nay<br/>tốt hơn ngày mai",
  small: "Small steps, big future",
};

// ----- Auth -----
route("/login", authPage(renderLogin, TITLES["/login"]));
route("/register", authPage(renderRegister, TITLES["/register"]));
route("/verify-email", authPage(renderVerifyEmail, TITLES["/verify-email"]));
route("/verify-success", authPage(renderVerifySuccess, TITLES["/verify-success"]));
route("/forgot-password", authPage(renderForgotPassword, TITLES["/forgot-password"]));

// ----- App -----
route("/home", appPage(renderHome, { nav: "home", title: "Trang chủ", quote: Q.home }));
route("/vocabulary", appPage(renderVocabularyList, { nav: "vocabulary", title: "Từ vựng", quote: Q.vocab }));
route("/vocabulary/new", appPage(renderVocabularyForm, { nav: "vocabulary", title: "Thêm từ vựng", quote: Q.vocab, topQuote: TQ.small }));
route("/vocabulary/:id/edit", appPage(renderVocabularyForm, { nav: "vocabulary", title: "Sửa từ vựng", quote: Q.vocab, topQuote: TQ.small }));
// /grammar/new phải khai báo trước /grammar/:id
route("/grammar", appPage(renderGrammarList, { nav: "grammar", title: "Ngữ pháp", quote: Q.grammar }));
route("/grammar/new", appPage(renderGrammarForm, { nav: "grammar", title: "Thêm ngữ pháp", quote: Q.grammar, topQuote: TQ.small }));
route("/grammar/:id/edit", appPage(renderGrammarForm, { nav: "grammar", title: "Chỉnh sửa ngữ pháp", quote: Q.grammar, topQuote: TQ.small }));
route("/grammar/:id", appPage(renderGrammarDetail, { nav: "grammar", title: "Ngữ pháp", quote: Q.grammar, topQuote: TQ.learn }));
route("/radicals", appPage(renderRadicalList, { nav: "radicals", title: "Bộ thủ", quote: Q.radicals }));
route("/radicals/:num", appPage(renderRadicalDetail, { nav: "radicals", title: "Bộ thủ", quote: Q.radicals, topQuote: TQ.learn }));
route("/review/setup", appPage(renderReviewSetup, { nav: "review", title: "Thiết lập ôn tập", quote: Q.setup, topQuote: TQ.learn }));
route("/review/session", appPage(renderReviewSession, { nav: "review", title: "Làm bài ôn tập", quote: Q.session, topQuote: TQ.vi }));
route("/review/result", appPage(renderReviewResult, { nav: "review", title: "Hoàn thành ôn tập", quote: Q.result, topQuote: TQ.vi }));
route("/settings", appPage(renderSettings, { nav: "settings", title: "Cài đặt", quote: Q.settings }));

const PUBLIC = new Set(["/login", "/register", "/verify-email", "/forgot-password"]);
setGuard((path) => {
  const user = getCurrentUser();
  if (path === "/" || path === "") return user ? "/home" : "/login";
  if (path === "/verify-success") return user ? null : "/login";
  if (path === "/verify-email" && !getPendingVerification()) return user ? "/home" : "/register";
  if (!user && !PUBLIC.has(path)) return "/login";
  if (user && PUBLIC.has(path)) return "/home";
  return null;
});
setNotFound("/home");

startRouter();
