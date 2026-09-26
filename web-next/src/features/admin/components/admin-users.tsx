"use client";
import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Copy, KeyRound, Lock, LockOpen, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/input";
import { Dialog, DialogActions, DialogClose, DialogContent } from "@/components/ui/dialog";
import { useConfirm } from "@/components/ui/confirm";
import { toast } from "@/components/ui/toaster";
import { LeafDecor } from "@/components/layout/icons";
import { cn } from "@/lib/utils";
import type { AdminUser } from "../service";
import { resetPasswordAction, setDisabledAction } from "../actions";
import { useIntlTag, useT } from "@/i18n/client";

const fmt = (d: Date | string | null, tag: string) =>
  d
    ? new Date(d).toLocaleString(tag, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export function AdminUsers({
  data,
  q: initialQ,
  meId,
}: {
  data: { items: AdminUser[]; total: number; page: number; pageCount: number };
  q: string;
  meId: string;
}) {
  const router = useRouter();
  const t = useT();
  const tag = useIntlTag();
  const pathname = usePathname();
  const [confirm, confirmNode] = useConfirm();
  const [q, setQ] = React.useState(initialQ);
  const [temp, setTemp] = React.useState<{ email: string; password: string } | null>(null);
  const [pending, start] = React.useTransition();

  const go = React.useCallback(
    (next: { q?: string; page?: number }) => {
      const sp = new URLSearchParams();
      const nq = next.q ?? initialQ;
      if (nq) sp.set("q", nq);
      if ((next.page ?? 1) > 1) sp.set("page", String(next.page));
      start(() => router.replace(sp.size ? `${pathname}?${sp}` : pathname, { scroll: false }));
    },
    [initialQ, pathname, router],
  );
  React.useEffect(() => {
    if (q.trim() === initialQ) return;
    const timer = setTimeout(() => go({ q: q.trim(), page: 1 }), 300);
    return () => clearTimeout(timer);
  }, [q, initialQ, go]);

  async function reset(u: AdminUser) {
    const ok = await confirm({
      title: t("admin.resetTitle"),
      message: t("admin.resetMessage", { email: u.email }),
      confirmLabel: t("admin.resetConfirm"),
    });
    if (!ok) return;
    const r = await resetPasswordAction(u.id);
    if (!r.ok) return void toast.error(r.message);
    setTemp({ email: r.email, password: r.password });
  }
  async function toggleLock(u: AdminUser) {
    const lock = !u.disabledAt;
    const ok = await confirm({
      title: lock ? t("admin.lockTitle") : t("admin.unlockTitle"),
      message: lock ? t("admin.lockMessage", { email: u.email }) : t("admin.unlockMessage", { email: u.email }),
      confirmLabel: lock ? t("admin.lock") : t("admin.unlock"),
      danger: lock,
    });
    if (!ok) return;
    const r = await setDisabledAction(u.id, lock);
    if (!r.ok) return void toast.error(r.message);
    toast.success(lock ? t("admin.lockedToast", { email: u.email }) : t("admin.unlockedToast", { email: u.email }));
    start(() => router.refresh());
  }

  const actions = (u: AdminUser) =>
    u.id === meId ? (
      <span className="text-sm text-text-3">{t("admin.yours")}</span>
    ) : (
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => reset(u)}
          aria-label={t("admin.resetFor", { email: u.email })}
        >
          <KeyRound />
          {t("admin.reset")}
        </Button>
        <Button
          size="sm"
          variant={u.disabledAt ? "ghost" : "danger-outline"}
          onClick={() => toggleLock(u)}
          aria-label={u.disabledAt ? t("admin.unlockFor", { email: u.email }) : t("admin.lockFor", { email: u.email })}
        >
          {u.disabledAt ? <LockOpen /> : <Lock />}
          {u.disabledAt ? t("admin.unlock") : t("admin.lock")}
        </Button>
      </div>
    );
  const status = (u: AdminUser) => (
    <span className="flex flex-wrap gap-1.5">
      {u.role === "admin" ? (
        <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-0.5 text-[13px] font-semibold text-blue-600">
          <ShieldCheck className="size-3.5" />
          {t("admin.roleAdmin")}
        </span>
      ) : null}
      <span
        className={cn(
          "rounded-lg px-2 py-0.5 text-[13px] font-semibold",
          u.disabledAt ? "bg-red-50 text-red" : "bg-green-50 text-green-700",
        )}
      >
        {u.disabledAt ? t("admin.locked") : t("admin.active")}
      </span>
    </span>
  );

  return (
    <>
      <div>
        <h1 className="flex items-center gap-3 text-[26px] font-extrabold tracking-tight text-text md:text-[34px]">
          {t("admin.title")}
          <LeafDecor className="w-10" />
        </h1>
        <p className="mt-1.5 text-[15px] text-text-2 md:text-[17px]">{t("admin.subtitle")}</p>
      </div>
      <section
        aria-label={t("admin.users")}
        className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-border bg-white/92 p-4 shadow-card md:p-[22px]"
      >
        <label className="relative block">
          <span className="sr-only">{t("admin.search")}</span>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-text-3" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("admin.searchPlaceholder")}
            autoComplete="off"
            className={cn(inputClass, "pl-11")}
          />
        </label>
        <p className="text-sm text-text-2" aria-live="polite">
          {t("admin.total", { count: data.total })}
        </p>
        <div className={cn("transition-opacity", pending && "opacity-60")}>
          <div className="hidden overflow-x-auto rounded-md border border-border md:block">
            <table className="w-full min-w-[900px] border-collapse text-[15px]">
              <thead>
                <tr className="bg-[#F3F8FE] text-left [&>th]:px-3 [&>th]:py-3 [&>th]:font-semibold">
                  <th>{t("admin.colUser")}</th>
                  <th>{t("admin.colVocab")}</th>
                  <th>{t("admin.colCreated")}</th>
                  <th>{t("admin.colLastLogin")}</th>
                  <th>{t("admin.colStatus")}</th>
                  <th>{t("admin.colActions")}</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((u) => (
                  <tr key={u.id} className="border-t border-[#EDF3F9] [&>td]:px-3 [&>td]:py-2.5 [&>td]:align-middle">
                    <td>
                      <strong className="block text-text">{u.name}</strong>
                      <span className="text-text-2">{u.email}</span>
                    </td>
                    <td className="tabular-nums">{u.vocabCount}</td>
                    <td className="whitespace-nowrap">{fmt(u.createdAt, tag)}</td>
                    <td className="whitespace-nowrap">{fmt(u.lastLoginAt, tag)}</td>
                    <td>{status(u)}</td>
                    <td>{actions(u)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="flex flex-col gap-3 md:hidden" aria-label={t("admin.list")}>
            {data.items.map((u) => (
              <li key={u.id} className="flex flex-col gap-2 rounded-xl border border-border bg-white p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <strong className="block truncate text-text">{u.name}</strong>
                    <span className="block truncate text-sm text-text-2">{u.email}</span>
                  </div>
                  {status(u)}
                </div>
                <dl className="grid grid-cols-2 gap-1 text-[13.5px] text-text-2">
                  <dt>{t("admin.colVocab")}</dt>
                  <dd className="text-right text-text">{u.vocabCount}</dd>
                  <dt>{t("admin.colCreated")}</dt>
                  <dd className="text-right text-text">{fmt(u.createdAt, tag)}</dd>
                  <dt>{t("admin.lastLogin")}</dt>
                  <dd className="text-right text-text">{fmt(u.lastLoginAt, tag)}</dd>
                </dl>
                {actions(u)}
              </li>
            ))}
          </ul>
        </div>
        {data.pageCount > 1 ? (
          <nav aria-label={t("ui.pagination")} className="flex items-center justify-center gap-3">
            <Button
              size="icon"
              variant="secondary"
              disabled={data.page <= 1}
              onClick={() => go({ page: data.page - 1 })}
              aria-label={t("ui.prevPage")}
            >
              <ChevronLeft />
            </Button>
            <span className="text-sm text-text-2">{t("admin.pageOf", { page: data.page, count: data.pageCount })}</span>
            <Button
              size="icon"
              variant="secondary"
              disabled={data.page >= data.pageCount}
              onClick={() => go({ page: data.page + 1 })}
              aria-label={t("ui.nextPage")}
            >
              <ChevronRight />
            </Button>
          </nav>
        ) : null}
      </section>

      <Dialog open={!!temp} onOpenChange={(o) => !o && setTemp(null)}>
        {temp ? (
          <DialogContent title={t("admin.tempTitle")} icon={<KeyRound />}>
            <p className="text-[15px] text-text-2">
              {t.rich("admin.tempDesc", {
                email: <strong className="text-text">{temp.email}</strong>,
                once: <strong className="text-text">{t("admin.once")}</strong>,
              })}
            </p>
            <div className="flex items-center gap-2 rounded-md bg-bg px-3 py-2.5">
              <code className="flex-1 font-mono text-lg tracking-wider text-navy" aria-label={t("admin.tempLabel")}>
                {temp.password}
              </code>
              <Button
                size="sm"
                variant="secondary"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(temp.password);
                    toast.success(t("admin.copied"));
                  } catch {
                    toast.error(t("admin.copyFailed"));
                  }
                }}
              >
                <Copy />
                {t("admin.copy")}
              </Button>
            </div>
            <DialogActions>
              <DialogClose asChild>
                <Button variant="solid">{t("admin.savedClose")}</Button>
              </DialogClose>
            </DialogActions>
          </DialogContent>
        ) : null}
      </Dialog>
      {confirmNode}
    </>
  );
}
