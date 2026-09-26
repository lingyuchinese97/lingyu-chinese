"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Loader2, Lock, Plus, Save, Trash2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toaster";
import { LeafDecor } from "@/components/layout/icons";
import { cn } from "@/lib/utils";
import { applyToneInput } from "@/lib/pinyin";
import { G_LIMITS, grammarInputSchema } from "../schema";
import { createGrammarAction, updateGrammarAction } from "../actions";
import { TagInput } from "./grammar-dialogs";
import { useT } from "@/i18n/client";

type Ex = { key: string; chinese: string; pinyin: string; vietnamese: string };
type Initial = {
  id: string;
  title: string;
  meaning: string;
  structure: string;
  notes: string;
  personalNote: string;
  examples: { chinese: string; pinyin: string; vietnamese: string }[];
  tags: string[];
};

let seq = 0;
const newKey = () => `ex-${++seq}`;

export function GrammarForm({ initial, allTags }: { initial: Initial | null; allTags: string[] }) {
  const router = useRouter();
  const t = useT();
  const editing = !!initial;
  const [title, setTitle] = React.useState(initial?.title ?? "");
  const [meaning, setMeaning] = React.useState(initial?.meaning ?? "");
  const [structure, setStructure] = React.useState(initial?.structure ?? "");
  const [notes, setNotes] = React.useState(initial?.notes ?? "");
  const [personalNote, setPersonalNote] = React.useState(initial?.personalNote ?? "");
  const [tags, setTags] = React.useState<string[]>(initial?.tags ?? []);
  const [examples, setExamples] = React.useState<Ex[]>(() => {
    const list = (initial?.examples ?? []).map((e) => ({ ...e, key: newKey() }));
    return list.length ? list : [{ key: newKey(), chinese: "", pinyin: "", vietnamese: "" }];
  });
  const [titleErr, setTitleErr] = React.useState("");
  const [exErr, setExErr] = React.useState("");
  const [formErr, setFormErr] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);
  const focusRef = React.useRef<string | null>(null);

  // Nhắc khi rời trang mà chưa lưu (đóng tab / tải lại).
  React.useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);
  React.useEffect(() => {
    if (!focusRef.current) return;
    document.querySelector<HTMLInputElement>(`[data-ex="${focusRef.current}"]`)?.focus();
    focusRef.current = null;
  });

  const setEx = (i: number, patch: Partial<Ex>) => {
    setDirty(true);
    setExErr("");
    setExamples((l) => l.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  };
  const move = (i: number, d: -1 | 1) =>
    setExamples((l) => {
      const n = l.slice();
      [n[i], n[i + d]] = [n[i + d]!, n[i]!];
      return n;
    });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setFormErr("");
    const payload = {
      title,
      meaning,
      structure,
      notes,
      personalNote,
      tags,
      examples: examples.map(({ key: _k, ...x }) => x),
    };
    const parsed = grammarInputSchema.safeParse(payload);
    if (!parsed.success) {
      for (const i of parsed.error.issues) {
        if (i.path[0] === "title") setTitleErr(i.message);
        else if (i.path[0] === "examples") setExErr(i.message);
        else setFormErr(i.message);
      }
      if (parsed.error.issues.some((i) => i.path[0] === "title")) document.getElementById("gf-title")?.focus();
      return;
    }
    setSaving(true);
    const r = editing ? await updateGrammarAction(initial!.id, parsed.data) : await createGrammarAction(parsed.data);
    if (!r.ok) {
      setSaving(false);
      if (r.fieldErrors?.title) return void setTitleErr(r.fieldErrors.title);
      if (r.fieldErrors?.examples) return void setExErr(r.fieldErrors.examples);
      return void setFormErr(r.message || t("grammar.form.saveFailed"));
    }
    setDirty(false);
    toast.success(editing ? t("grammar.form.saved") : t("grammar.form.added"));
    router.push(`/grammar/${editing ? initial!.id : (r.data as string)}`);
    router.refresh();
  }

  const cancelHref = editing ? `/grammar/${initial!.id}` : "/grammar";
  return (
    <form
      onSubmit={submit}
      onInput={() => setDirty(true)}
      noValidate
      className="relative flex flex-col gap-5 overflow-hidden rounded-[var(--radius-xl)] border border-border bg-white/92 p-4 shadow-card md:p-7"
    >
      <LeafDecor className="pointer-events-none absolute -right-2.5 -bottom-3.5 w-[70px] -rotate-30 opacity-35" />
      <div>
        <h1 className="flex items-center gap-3 text-[26px] font-extrabold tracking-tight text-navy md:text-[32px]">
          {editing ? t("grammar.edit") : t("grammar.addNew")}
          <LeafDecor className="w-10" />
        </h1>
        <p className="mt-1 text-[15px] text-text-2 md:text-[17px]">
          {editing ? t("grammar.form.editSub") : t("grammar.form.newSub")}
        </p>
      </div>
      {formErr ? <Alert tone="error">{formErr}</Alert> : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="gf-title">
          {t("grammar.form.title")}
          <span className="ml-0.5 text-red" aria-hidden="true">
            *
          </span>
        </Label>
        <Input
          id="gf-title"
          autoFocus
          value={title}
          maxLength={G_LIMITS.title}
          onChange={(e) => {
            setTitle(e.target.value);
            setTitleErr("");
          }}
          onBlur={() => dirty && !title.trim() && setTitleErr(t("errors.grammarTitleRequired"))}
          placeholder={t("grammar.form.titlePlaceholder")}
          aria-required
          aria-invalid={!!titleErr || undefined}
          aria-describedby="gf-title-err"
          autoComplete="off"
        />
        <span id="gf-title-err" role="alert" className={cn("text-sm text-red", !titleErr && "hidden")}>
          {titleErr ? t.maybe(titleErr) : null}
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="gf-meaning">{t("grammar.form.meaning")}</Label>
        <Textarea
          id="gf-meaning"
          rows={3}
          value={meaning}
          maxLength={G_LIMITS.meaning}
          onChange={(e) => setMeaning(e.target.value)}
          placeholder={t("grammar.form.meaningPlaceholder")}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="gf-structure">{t("grammar.form.structure")}</Label>
        <Input
          id="gf-structure"
          lang="zh"
          value={structure}
          maxLength={G_LIMITS.structure}
          onChange={(e) => setStructure(e.target.value)}
          placeholder={t("grammar.form.structurePlaceholder")}
          autoComplete="off"
        />
      </div>

      <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
        <legend className="mb-1.5 text-[15px] font-semibold text-text">{t("grammar.form.examples")}</legend>
        <ol className="flex flex-col gap-3">
          {examples.length ? (
            examples.map((e, i) => (
              <li key={e.key} className="rounded-md border border-border bg-bg px-3.5 py-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-bold text-navy">{t("grammar.form.example", { n: i + 1 })}</span>
                  <div className="flex gap-0.5">
                    <IconBtn
                      label={t("grammar.form.moveUp", { n: i + 1 })}
                      disabled={i === 0}
                      onClick={() => move(i, -1)}
                    >
                      <ArrowUp />
                    </IconBtn>
                    <IconBtn
                      label={t("grammar.form.moveDown", { n: i + 1 })}
                      disabled={i === examples.length - 1}
                      onClick={() => move(i, 1)}
                    >
                      <ArrowDown />
                    </IconBtn>
                    <IconBtn
                      label={t("grammar.form.removeExample", { n: i + 1 })}
                      danger
                      onClick={() => {
                        setDirty(true);
                        setExamples((l) => l.filter((_, j) => j !== i));
                      }}
                    >
                      <Trash2 />
                    </IconBtn>
                  </div>
                </div>
                <div className="grid gap-2.5 md:grid-cols-3">
                  <label className="grid min-w-0 gap-1">
                    <span className="text-[12.5px] font-semibold text-text-2">{t("grammar.form.chinese")}</span>
                    <Input
                      data-ex={e.key}
                      lang="zh"
                      value={e.chinese}
                      maxLength={G_LIMITS.example}
                      onChange={(ev) => setEx(i, { chinese: ev.target.value })}
                      placeholder="你是学生吗？"
                      className="h-11 font-cn"
                      autoComplete="off"
                    />
                  </label>
                  <label className="grid min-w-0 gap-1">
                    <span className="text-[12.5px] font-semibold text-text-2">{t("grammar.form.pinyin")}</span>
                    <Input
                      value={e.pinyin}
                      maxLength={G_LIMITS.example}
                      onChange={(ev) =>
                        setEx(i, {
                          pinyin: applyToneInput(
                            ev.currentTarget,
                            ev.nativeEvent instanceof InputEvent && ev.nativeEvent.isComposing,
                          ),
                        })
                      }
                      placeholder="Ni3 shi4 xue2sheng5 ma5?"
                      className="h-11"
                      autoComplete="off"
                      autoCapitalize="off"
                      spellCheck={false}
                    />
                  </label>
                  <label className="grid min-w-0 gap-1">
                    <span className="text-[12.5px] font-semibold text-text-2">{t("grammar.form.vietnamese")}</span>
                    <Input
                      value={e.vietnamese}
                      maxLength={G_LIMITS.example}
                      onChange={(ev) => setEx(i, { vietnamese: ev.target.value })}
                      placeholder={t("grammar.form.vietnamesePlaceholder")}
                      className="h-11"
                      autoComplete="off"
                    />
                  </label>
                </div>
              </li>
            ))
          ) : (
            <li className="text-sm text-text-3">{t("grammar.form.noExamples")}</li>
          )}
        </ol>
        <span role="alert" className={cn("text-sm text-red", !exErr && "hidden")}>
          {exErr ? t.maybe(exErr) : null}
        </span>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="self-start"
          onClick={() => {
            if (examples.length >= G_LIMITS.examples)
              return void setExErr(t("errors.grammarExamplesMax", { max: G_LIMITS.examples }));
            const key = newKey();
            focusRef.current = key;
            setDirty(true);
            setExamples((l) => [...l, { key, chinese: "", pinyin: "", vietnamese: "" }]);
          }}
        >
          <Plus />
          {t("grammar.form.addExample")}
        </Button>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="gf-notes">{t("grammar.form.notes")}</Label>
        <Textarea
          id="gf-notes"
          rows={4}
          value={notes}
          maxLength={G_LIMITS.notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t("grammar.form.notesPlaceholder")}
        />
        <span className="text-[13.5px] text-text-3">{t("grammar.form.notesHint")}</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="gf-personal">
          {t("grammar.form.personal")}{" "}
          <span className="font-medium text-text-2">{t("grammar.form.personalExtra")}</span>
        </Label>
        <Textarea
          id="gf-personal"
          rows={3}
          value={personalNote}
          maxLength={G_LIMITS.personalNote}
          onChange={(e) => setPersonalNote(e.target.value)}
          placeholder={t("grammar.form.personalPlaceholder")}
        />
        <span className="inline-flex items-center gap-1 text-[13.5px] text-text-3">
          <Lock className="size-3.5" /> {t("grammar.form.personalPrivate")}
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="gf-tags">{t("grammar.form.tags")}</Label>
        <TagInput
          id="gf-tags"
          value={tags}
          onChange={(v) => {
            setDirty(true);
            setTags(v);
          }}
          existing={allTags}
        />
        <span className="text-[13.5px] text-text-3">{t("grammar.form.tagsHint")}</span>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-[1fr_1.6fr] gap-2.5 border-t border-border bg-white px-4 pt-2.5 pb-[calc(10px+var(--safe-b))] shadow-[0_-6px_20px_rgba(20,60,110,.08)] md:static md:flex md:justify-end md:border-0 md:bg-transparent md:p-0 md:shadow-none">
        <Button asChild variant="secondary" className="min-h-[50px] md:min-h-12">
          <Link href={cancelHref}>{t("common.cancel")}</Link>
        </Button>
        <Button type="submit" variant="primary" disabled={saving} className="min-h-[50px] md:min-h-12 md:min-w-[200px]">
          {saving ? <Loader2 className="animate-spin" /> : <Save />}
          {saving ? t("common.saving") : editing ? t("grammar.form.saveChanges") : t("grammar.form.save")}
        </Button>
      </div>
    </form>
  );
}

function IconBtn({
  label,
  danger,
  disabled,
  onClick,
  children,
}: {
  label: string;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-full outline-none focus-visible:shadow-[var(--focus-ring)] disabled:opacity-35 md:size-9 [&_svg]:size-[18px]",
        danger ? "text-red hover:bg-red-50" : "text-blue-600 hover:bg-blue-50",
      )}
    >
      {children}
    </button>
  );
}
