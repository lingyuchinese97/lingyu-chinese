"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Database,
  Download,
  KeyRound,
  Loader2,
  LogOut,
  Plus,
  Trash2,
  Upload,
  User as UserIcon,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Dialog, DialogActions, DialogClose, DialogContent } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";
import { LeafDecor } from "@/components/layout/icons";
import { authClient } from "@/lib/auth-client";
import { MIN_PASSWORD } from "@/lib/auth-rules";
import { importSampleAction } from "@/features/vocabulary/actions";
import { changePasswordAction, deleteAccountAction, updateNameAction } from "../actions";
import type { ImportReport } from "../transfer";

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?";

export function SettingsView({ user }: { user: { name: string; email: string; role: string } }) {
  return (
    <>
      <div>
        <h1 className="flex items-center gap-3 text-[26px] font-extrabold tracking-tight text-text md:text-[34px]">
          Cài đặt
          <LeafDecor className="w-10" />
        </h1>
        <p className="mt-1.5 text-[15px] text-text-2 md:text-[17px]">Quản lý tài khoản và dữ liệu học tập của bạn.</p>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <AccountCard user={user} />
          <PasswordCard />
        </div>
        <div className="flex flex-col gap-5">
          <DataCard />
          <DangerCard />
        </div>
      </div>
    </>
  );
}

function Card({
  id,
  icon,
  title,
  children,
  danger,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <section
      aria-labelledby={id}
      className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-border bg-white/94 p-5 shadow-card md:p-6"
    >
      <h2
        id={id}
        className={`flex items-center gap-2.5 text-xl font-bold [&_svg]:size-6 ${danger ? "text-red" : "text-navy [&_svg]:text-blue-600"}`}
      >
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4 first:border-0 first:pt-0 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <strong className="block text-text">{title}</strong>
        <span className="text-[14.5px] text-text-2">{desc}</span>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">{children}</div>
    </div>
  );
}

function AccountCard({ user }: { user: { name: string; email: string; role: string } }) {
  const router = useRouter();
  const [name, setName] = React.useState(user.name);
  const [err, setErr] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [out, setOut] = React.useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const r = await updateNameAction(name);
    setBusy(false);
    if (!r.ok) return void setErr(r.message);
    setErr("");
    toast.success("Đã lưu tên hiển thị.");
    router.refresh();
  }
  async function logout() {
    setOut(true);
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <Card id="set-acc" icon={<UserIcon />} title="Tài khoản">
      <div className="flex items-center gap-4">
        <span className="flex size-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-blue),var(--color-cyan))] text-lg font-bold text-white">
          {initials(user.name)}
        </span>
        <div className="min-w-0">
          <strong className="block truncate text-lg text-text">{user.name}</strong>
          <span className="block truncate text-text-2">{user.email}</span>
          <span className="text-[13.5px] text-text-3">
            Đăng nhập bằng email{user.role === "admin" ? " · Quản trị viên" : ""}
          </span>
        </div>
      </div>
      <form onSubmit={save} noValidate className="flex flex-col gap-1.5">
        <Field id="set-name" label="Họ và tên" error={err}>
          <div className="flex flex-wrap gap-3">
            <Input
              id="set-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErr("");
              }}
              autoComplete="name"
              maxLength={60}
              aria-invalid={!!err || undefined}
              aria-describedby={err ? "set-name-err" : undefined}
              className="min-w-[200px] flex-1"
            />
            <Button type="submit" variant="solid" disabled={busy || name.trim() === user.name}>
              {busy ? <Loader2 className="animate-spin" /> : null}
              {busy ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
        </Field>
      </form>
      <Row title="Đăng xuất" desc="Thoát khỏi tài khoản trên thiết bị này.">
        <Button variant="secondary" onClick={logout} disabled={out}>
          <LogOut />
          Đăng xuất
        </Button>
      </Row>
    </Card>
  );
}

function PasswordCard() {
  const [v, setV] = React.useState({ current: "", password: "", confirm: "" });
  const [err, setErr] = React.useState<{ field?: string; message: string } | null>(null);
  const [busy, setBusy] = React.useState(false);
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setV({ ...v, [k]: e.target.value });
    setErr(null);
  };
  const errOf = (f: string) => (err?.field === f ? err.message : undefined);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const r = await changePasswordAction(v);
    setBusy(false);
    if (!r.ok) return void setErr({ field: r.field, message: r.message });
    setV({ current: "", password: "", confirm: "" });
    toast.success("Đã đổi mật khẩu. Các thiết bị khác đã được đăng xuất.");
  }

  return (
    <Card id="set-pw" icon={<KeyRound />} title="Đổi mật khẩu">
      <form onSubmit={submit} noValidate className="flex flex-col gap-3.5">
        {(
          [
            ["current", "Mật khẩu hiện tại", "current-password", "Nhập mật khẩu hiện tại"],
            ["password", "Mật khẩu mới", "new-password", `Ít nhất ${MIN_PASSWORD} ký tự`],
            ["confirm", "Nhập lại mật khẩu mới", "new-password", "Nhập lại mật khẩu mới"],
          ] as const
        ).map(([k, label, ac, ph]) => (
          <Field key={k} id={`pw-${k}`} label={label} error={errOf(k)}>
            <Input
              id={`pw-${k}`}
              type="password"
              value={v[k]}
              onChange={set(k)}
              autoComplete={ac}
              placeholder={ph}
              aria-invalid={!!errOf(k) || undefined}
              aria-describedby={errOf(k) ? `pw-${k}-err` : undefined}
            />
          </Field>
        ))}
        {err && !err.field ? (
          <p role="alert" className="text-sm text-red">
            {err.message}
          </p>
        ) : null}
        <Button type="submit" variant="solid" disabled={busy} className="self-start">
          {busy ? <Loader2 className="animate-spin" /> : <KeyRound />}
          {busy ? "Đang lưu..." : "Đổi mật khẩu"}
        </Button>
      </form>
    </Card>
  );
}

function DataCard() {
  const router = useRouter();
  const file = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState<"" | "import" | "sample">("");
  const [report, setReport] = React.useState<ImportReport | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setBusy("import");
    setReport(null);
    try {
      const body = new FormData();
      body.set("file", f);
      const res = await fetch("/api/account/import", { method: "POST", body });
      const j = (await res.json().catch(() => ({}))) as { report?: ImportReport; message?: string };
      if (!res.ok || !j.report) return void toast.error(j.message ?? "Không nhập được dữ liệu. Vui lòng thử lại.");
      setReport(j.report);
      toast.success(`Đã nhập ${j.report.vocab.added} từ vựng và ${j.report.grammar.added} ngữ pháp.`);
      router.refresh();
    } catch {
      toast.error("Không nhập được dữ liệu. Vui lòng thử lại.");
    } finally {
      setBusy("");
    }
  }
  async function sample() {
    setBusy("sample");
    const r = await importSampleAction();
    setBusy("");
    if (!r.ok) return void toast.error(r.message);
    toast.success(r.data.added ? `Đã thêm ${r.data.added} từ vựng mẫu.` : "Bạn đã có đủ các từ vựng mẫu.");
  }

  return (
    <Card id="set-data" icon={<Database />} title="Dữ liệu học tập">
      <Row
        title="Xuất dữ liệu"
        desc="Tải file JSON gồm từ vựng (kèm ảnh), tag, ngữ pháp, ghi chú, bộ thủ đã thuộc và tiến độ bài học."
      >
        <Button asChild variant="secondary">
          <a href="/api/account/export" download>
            <Download />
            Xuất dữ liệu
          </a>
        </Button>
      </Row>
      <Row
        title="Nhập dữ liệu"
        desc="Chọn file .json đã xuất, hoặc file .csv tải từ bản LingYu cũ (Từ vựng → chọn từ → Chia sẻ → Tải file → CSV). Dữ liệu được gộp vào, không ghi đè; từ trùng sẽ được bỏ qua."
      >
        <input
          ref={file}
          type="file"
          accept="application/json,.json,text/csv,.csv"
          className="sr-only"
          id="import-file"
          onChange={onFile}
          aria-label="Chọn file dữ liệu để nhập"
        />
        <Button variant="secondary" onClick={() => file.current?.click()} disabled={!!busy}>
          {busy === "import" ? <Loader2 className="animate-spin" /> : <Upload />}
          {busy === "import" ? "Đang nhập..." : "Nhập dữ liệu"}
        </Button>
      </Row>
      {report ? (
        <div role="status" className="rounded-md bg-green-50 px-4 py-3 text-[14.5px] text-green-700">
          <strong className="block">Đã nhập xong:</strong>
          Từ vựng: thêm {report.vocab.added}, bỏ qua {report.vocab.skipped} · Ngữ pháp: thêm {report.grammar.added}, bỏ
          qua {report.grammar.skipped} · Ảnh: {report.images} · Bộ thủ đã thuộc: {report.radicals} · Tiến độ bài học:{" "}
          {report.lessons}
        </div>
      ) : null}
      <Row title="Dữ liệu mẫu" desc="Thêm các từ vựng HSK mẫu để thử tính năng ôn tập.">
        <Button variant="secondary" onClick={sample} disabled={!!busy}>
          {busy === "sample" ? <Loader2 className="animate-spin" /> : <Plus />}
          Thêm dữ liệu mẫu
        </Button>
      </Row>
    </Card>
  );
}

function DangerCard() {
  const [open, setOpen] = React.useState(false);
  return (
    <Card id="set-danger" icon={<TriangleAlert />} title="Xóa tài khoản" danger>
      <Row
        title="Xóa vĩnh viễn tài khoản"
        desc="Xóa tài khoản và toàn bộ dữ liệu học tập (từ vựng, ảnh, ngữ pháp, tiến độ). Không thể hoàn tác — hãy xuất dữ liệu trước."
      >
        <Button variant="danger" onClick={() => setOpen(true)}>
          <Trash2 />
          Xóa tài khoản
        </Button>
      </Row>
      <Dialog open={open} onOpenChange={setOpen}>
        {open ? <DeleteBody /> : null}
      </Dialog>
    </Card>
  );
}

function DeleteBody() {
  const router = useRouter();
  const [pw, setPw] = React.useState("");
  const [err, setErr] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const r = await deleteAccountAction(pw);
    if (!r.ok) {
      setBusy(false);
      return void setErr(r.message);
    }
    toast.success("Đã xóa tài khoản. Hẹn gặp lại bạn!");
    router.replace("/");
    router.refresh();
  }
  return (
    <DialogContent title="Xóa tài khoản?" icon={<TriangleAlert />}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <p className="text-[15px] text-text-2">
          Toàn bộ dữ liệu của bạn sẽ bị xóa vĩnh viễn và <strong className="text-text">không thể khôi phục</strong>.
          Nhập mật khẩu để xác nhận.
        </p>
        <Field id="del-pw" label="Mật khẩu" error={err}>
          <Input
            id="del-pw"
            type="password"
            value={pw}
            onChange={(e) => {
              setPw(e.target.value);
              setErr("");
            }}
            autoComplete="current-password"
            aria-invalid={!!err || undefined}
            aria-describedby={err ? "del-pw-err" : undefined}
            autoFocus
          />
        </Field>
        <DialogActions>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Hủy
            </Button>
          </DialogClose>
          <Button type="submit" variant="danger" disabled={busy || !pw}>
            {busy ? <Loader2 className="animate-spin" /> : <Trash2 />}
            {busy ? "Đang xóa..." : "Xóa vĩnh viễn"}
          </Button>
        </DialogActions>
      </form>
    </DialogContent>
  );
}
