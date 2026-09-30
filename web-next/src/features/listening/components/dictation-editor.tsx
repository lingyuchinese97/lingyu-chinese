"use client";
import * as React from "react";
import { BookmarkPlus, Eraser, Highlighter, Loader2, PenLine, Redo2, Undo2, X } from "lucide-react";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toaster";
import { normalizeSpans, plainOf, type Comparison, type FormattedSpan, type PenColor } from "@/lib/dictation-compare";
import { LISTENING } from "@/lib/limits";
import { lookupWordsAction } from "../actions";

/** Tra pinyin + nghĩa (kho Từ vựng của mình) cho từ bôi vàng; nhớ kết quả trong phiên trang. */
type Lookup = { pinyin: string; meaning: string | null };
const lookupCache = new Map<string, Promise<Lookup | null>>();
function lookup(word: string) {
  let p = lookupCache.get(word);
  if (!p) {
    p = lookupWordsAction([word]).then((r) =>
      r.ok && r.data[0] ? { pinyin: r.data[0].pinyin, meaning: r.data[0].meaning } : null,
    );
    lookupCache.set(word, p);
  }
  return p;
}
type WordCard = { word: string; start: number; end: number; x: number; y: number; note: string; editing: boolean };

/**
 * Ô chép chính tả có định dạng (Bút đen / Bút đỏ / Bôi vàng, Hoàn tác / Làm lại).
 *
 * Dữ liệu là danh sách `FormattedSpan` (định dạng NGƯỜI DÙNG tự tô). Kết quả so sánh với đáp án KHÔNG nằm trong dữ liệu:
 * nó được vẽ đè bằng CSS Custom Highlight API (`::highlight(lx-wrong)`), nên sửa đúng chữ là màu đỏ của so sánh tự mất,
 * còn chữ người dùng tô bút đỏ vẫn giữ nguyên.
 *
 * Gõ chữ (kể cả bộ gõ tiếng Trung / IME) để trình duyệt tự xử lý rồi đọc lại DOM; các thao tác khác (xuống dòng, dán,
 * tô màu, hoàn tác) đi qua mô hình dữ liệu rồi vẽ lại DOM.
 */
export type EditorHandle = { focus: () => void };

/**
 * Kết quả so sánh tô ngay trong ô (CSS Custom Highlight API). Để trong component vì bộ nén CSS lúc build chưa hiểu
 * `::highlight()`.
 */
const HIGHLIGHT_CSS =
  "::highlight(lx-wrong){color:var(--color-red);background-color:var(--color-red-100)}" +
  "::highlight(lx-extra){color:#6b7a90;background-color:#eceff4}";

type Snapshot = { spans: FormattedSpan[]; sel: [number, number] };
type Fmt = { color?: PenColor; highlight?: boolean; note?: string };

// ---------- DOM ↔ dữ liệu ----------

function render(root: HTMLElement, spans: FormattedSpan[]) {
  const frag = document.createDocumentFragment();
  for (const s of spans) {
    if (!s.color && !s.highlight) frag.append(document.createTextNode(s.text));
    else {
      const el = document.createElement("span");
      if (s.color === "red") el.dataset.c = "red";
      if (s.highlight) el.dataset.h = "1";
      if (s.highlight && s.note) el.dataset.n = s.note;
      el.textContent = s.text;
      frag.append(el);
    }
  }
  // Dòng trống cuối cần một <br> để con trỏ hiện được.
  if (plainOf(spans).endsWith("\n")) {
    const br = document.createElement("br");
    br.dataset.end = "1";
    frag.append(br);
  }
  root.replaceChildren(frag);
}

const BLOCK = new Set(["DIV", "P", "LI"]);

function serialize(root: HTMLElement): FormattedSpan[] {
  const out: FormattedSpan[] = [];
  const push = (text: string, f: Fmt) => {
    if (text) out.push({ text: text.replace(new RegExp("\\u200b", "g"), ""), ...f });
  };
  const walk = (node: Node, f: Fmt) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) push(child.nodeValue ?? "", f);
      else if (child instanceof HTMLElement) {
        if (child.tagName === "BR") {
          if (!child.dataset.end) push("\n", f);
          continue;
        }
        const nf: Fmt = {
          color: child.dataset.c === "red" ? "red" : child.dataset.c === "black" ? undefined : f.color,
          highlight: child.dataset.h === "1" || f.highlight,
          note: child.dataset.n ?? f.note,
        };
        // Khối (trình duyệt tự chèn) = xuống dòng.
        if (BLOCK.has(child.tagName) && out.length && !plainOf(out).endsWith("\n")) push("\n", f);
        walk(child, nf);
      }
    }
  };
  walk(root, {});
  return normalizeSpans(out);
}

/** Các "đơn vị" theo thứ tự văn bản: nút chữ và <br> (không tính <br> đánh dấu cuối). */
function units(root: HTMLElement): (Text | HTMLBRElement)[] {
  const list: (Text | HTMLBRElement)[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let n = walker.nextNode();
  while (n) {
    if (n.nodeType === Node.TEXT_NODE) list.push(n as Text);
    else if (n instanceof HTMLBRElement && !n.dataset.end) list.push(n);
    n = walker.nextNode();
  }
  return list;
}
const unitLen = (u: Text | HTMLBRElement) => (u instanceof Text ? (u.nodeValue ?? "").length : 1);

function toOffset(root: HTMLElement, node: Node, offset: number): number {
  const list = units(root);
  let total = 0;
  if (node.nodeType === Node.TEXT_NODE) {
    for (const u of list) {
      if (u === node) return total + offset;
      total += unitLen(u);
    }
    return total;
  }
  // Điểm nằm giữa các nút con: cộng mọi đơn vị đứng trước nút con thứ `offset` (hoặc trước điểm cuối của `node`).
  const boundary = node.childNodes[offset] ?? null;
  for (const u of list) {
    const after = boundary
      ? boundary === u ||
        boundary.contains(u) ||
        !!(boundary.compareDocumentPosition(u) & Node.DOCUMENT_POSITION_FOLLOWING)
      : !node.contains(u) && !!(node.compareDocumentPosition(u) & Node.DOCUMENT_POSITION_FOLLOWING);
    if (after) return total;
    total += unitLen(u);
  }
  return total;
}

function toPoint(root: HTMLElement, off: number): [Node, number] {
  let total = 0;
  for (const u of units(root)) {
    const len = unitLen(u);
    if (u instanceof Text) {
      if (off <= total + len) return [u, off - total];
    } else if (off === total) {
      const parent = u.parentNode!;
      return [parent, Array.prototype.indexOf.call(parent.childNodes, u)];
    }
    total += len;
  }
  return [root, root.childNodes.length];
}

function getSel(root: HTMLElement): [number, number] | null {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return null;
  const r = sel.getRangeAt(0);
  if (!root.contains(r.startContainer) || !root.contains(r.endContainer)) return null;
  const a = toOffset(root, r.startContainer, r.startOffset);
  const b = toOffset(root, r.endContainer, r.endOffset);
  return a <= b ? [a, b] : [b, a];
}

function setSel(root: HTMLElement, [a, b]: [number, number]) {
  const sel = window.getSelection();
  if (!sel) return;
  const r = document.createRange();
  const [sn, so] = toPoint(root, a);
  const [en, eo] = toPoint(root, b);
  r.setStart(sn, so);
  r.setEnd(en, eo);
  sel.removeAllRanges();
  sel.addRange(r);
}

function chars(spans: FormattedSpan[]) {
  const out: { ch: string; f: Fmt }[] = [];
  for (const s of spans)
    for (const ch of s.text) out.push({ ch, f: { color: s.color, highlight: s.highlight, note: s.note } });
  return out;
}
/** Chỉ số theo code unit (như DOM) → chỉ số ký tự. */
function unitToChar(text: string, unit: number) {
  return [...text.slice(0, unit)].length;
}
function fromChars(list: { ch: string; f: Fmt }[]): FormattedSpan[] {
  return normalizeSpans(list.map((c) => ({ text: c.ch, ...c.f })));
}

// ---------- Component ----------

export const DictationEditor = React.forwardRef<
  EditorHandle,
  {
    id: string;
    spans: FormattedSpan[];
    onChange: (spans: FormattedSpan[]) => void;
    comparison: Comparison | null;
    maxLength: number;
    onSaveVocab: (text: string) => void;
    describedBy?: string;
  }
>(function DictationEditor({ id, spans, onChange, comparison, maxLength, onSaveVocab, describedBy }, ref) {
  const t = useT();
  const root = React.useRef<HTMLDivElement>(null);
  const emitted = React.useRef<string>("");
  const composing = React.useRef(false);
  const hist = React.useRef<{ stack: Snapshot[]; i: number; lastTyping: number }>({ stack: [], i: -1, lastTyping: 0 });
  const [canUndo, setCanUndo] = React.useState(false);
  const [canRedo, setCanRedo] = React.useState(false);
  const [bubble, setBubble] = React.useState<{ text: string; x: number; y: number } | null>(null);
  const [card, setCard] = React.useState<WordCard | null>(null);
  const [info, setInfo] = React.useState<{ word: string; data: Lookup | null } | null>(null);
  const [noteDraft, setNoteDraft] = React.useState("");
  const hideTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const len = plainOf(spans).length;

  React.useImperativeHandle(ref, () => ({ focus: () => root.current?.focus() }));

  const sig = (s: FormattedSpan[]) => JSON.stringify(normalizeSpans(s));
  const syncButtons = () => {
    const h = hist.current;
    setCanUndo(h.i > 0);
    setCanRedo(h.i < h.stack.length - 1);
  };
  const record = (s: FormattedSpan[], sel: [number, number], typing = false) => {
    const h = hist.current;
    const now = Date.now();
    const snap = { spans: normalizeSpans(s), sel };
    if (h.i >= 0 && sig(h.stack[h.i]!.spans) === sig(snap.spans)) return;
    h.stack = h.stack.slice(0, h.i + 1);
    // Gõ liên tục trong 0,8 giây gộp thành một bước hoàn tác.
    if (typing && now - h.lastTyping < 800 && h.stack.length > 1) h.stack[h.stack.length - 1] = snap;
    else h.stack.push(snap);
    if (h.stack.length > 200) h.stack.shift();
    h.i = h.stack.length - 1;
    h.lastTyping = typing ? now : 0;
    syncButtons();
  };
  const emit = (s: FormattedSpan[]) => {
    const n = normalizeSpans(s);
    emitted.current = sig(n);
    onChange(n);
  };

  // Dữ liệu đổi từ bên ngoài (Xóa nội dung, nạp nháp) → vẽ lại.
  React.useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (sig(spans) === emitted.current) return;
    render(el, spans);
    emitted.current = sig(spans);
    if (hist.current.i < 0) {
      hist.current = { stack: [{ spans: normalizeSpans(spans), sel: [0, 0] }], i: 0, lastTyping: 0 };
    } else record(spans, [plainOf(spans).length, plainOf(spans).length]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spans]);

  // Tô kết quả so sánh (sai / thừa) ngay trong ô, không đụng tới DOM / định dạng.
  React.useEffect(() => {
    const el = root.current;
    const reg = typeof CSS !== "undefined" && "highlights" in CSS ? CSS.highlights : null;
    if (!el || !reg || typeof Highlight === "undefined") return;
    reg.delete("lx-wrong");
    reg.delete("lx-extra");
    if (!comparison) return;
    const text = plainOf(serialize(el));
    if (text !== plainOf(spans)) return;
    const wrong: Range[] = [];
    const extra: Range[] = [];
    for (const p of comparison.parts) {
      if (p.kind !== "text" || (p.status !== "wrong" && p.status !== "extra")) continue;
      const r = document.createRange();
      const [sn, so] = toPoint(el, p.start);
      const [en, eo] = toPoint(el, p.end);
      r.setStart(sn, so);
      r.setEnd(en, eo);
      (p.status === "wrong" ? wrong : extra).push(r);
    }
    reg.set("lx-wrong", new Highlight(...wrong));
    reg.set("lx-extra", new Highlight(...extra));
    return () => {
      reg.delete("lx-wrong");
      reg.delete("lx-extra");
    };
  }, [comparison, spans]);

  // Nút nổi "Lưu vào Từ vựng" khi bôi đen một từ trong ô.
  React.useEffect(() => {
    const onSel = () => {
      const el = root.current;
      const sel = window.getSelection();
      if (
        !el ||
        !sel ||
        sel.isCollapsed ||
        !sel.rangeCount ||
        !el.contains(sel.anchorNode) ||
        !el.contains(sel.focusNode)
      )
        return setBubble(null);
      const text = sel.toString().trim();
      if (!text || text.length > 40 || /\n/.test(text)) return setBubble(null);
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      setBubble({ text, x: rect.left + rect.width / 2, y: rect.top });
    };
    document.addEventListener("selectionchange", onSel);
    const hide = () => setBubble(null);
    window.addEventListener("scroll", hide, true);
    return () => {
      document.removeEventListener("selectionchange", onSel);
      window.removeEventListener("scroll", hide, true);
    };
  }, []);

  function readDom(typing: boolean) {
    const el = root.current!;
    let next = serialize(el);
    let text = plainOf(next);
    if (!text && el.childNodes.length) el.replaceChildren();
    if (text.length > maxLength) {
      next = fromChars(chars(next).slice(0, [...text.slice(0, maxLength)].length));
      text = plainOf(next);
      render(el, next);
      setSel(el, [text.length, text.length]);
      toast.error(t("listening.dictation.tooLong"));
    }
    emit(next);
    record(next, getSel(el) ?? [text.length, text.length], typing);
  }

  /** Thay đoạn [a, b) bằng `str` (chữ mới lấy định dạng của ký tự đứng trước). */
  function replaceRange(str: string) {
    const el = root.current!;
    const cur = serialize(el);
    const text = plainOf(cur);
    const [a, b] = getSel(el) ?? [text.length, text.length];
    const room = maxLength - (text.length - (b - a));
    let ins = str;
    if (ins.length > room) {
      ins = ins.slice(0, Math.max(0, room));
      toast.error(t("listening.dictation.tooLong"));
    }
    const list = chars(cur);
    const ca = unitToChar(text, a);
    const cb = unitToChar(text, b);
    const fmt = list[ca - 1]?.f ?? {};
    const next = fromChars([...list.slice(0, ca), ...[...ins].map((ch) => ({ ch, f: fmt })), ...list.slice(cb)]);
    render(el, next);
    const pos = a + ins.length;
    setSel(el, [pos, pos]);
    emit(next);
    record(next, [pos, pos]);
  }

  function format(kind: "black" | "red" | "yellow") {
    const el = root.current!;
    const range = getSel(el);
    if (!range || range[0] === range[1]) return void toast.info(t("listening.dictation.selectFirst"));
    const cur = serialize(el);
    const text = plainOf(cur);
    const list = chars(cur);
    const ca = unitToChar(text, range[0]);
    const cb = unitToChar(text, range[1]);
    const slice = list.slice(ca, cb);
    const allYellow = slice.every((c) => c.f.highlight || !c.ch.trim());
    for (const c of slice) {
      if (kind === "red") c.f = { ...c.f, color: "red" };
      else if (kind === "black") c.f = { ...c.f, color: undefined };
      else c.f = { ...c.f, highlight: !allYellow, note: allYellow ? undefined : c.f.note };
    }
    const next = fromChars(list);
    render(el, next);
    setSel(el, range);
    emit(next);
    record(next, range);
  }

  function travel(dir: -1 | 1) {
    const h = hist.current;
    const j = h.i + dir;
    if (j < 0 || j >= h.stack.length) return;
    h.i = j;
    h.lastTyping = 0;
    const snap = h.stack[j]!;
    const el = root.current!;
    render(el, snap.spans);
    el.focus();
    setSel(el, snap.sel);
    emit(snap.spans);
    syncButtons();
  }

  function clearAll() {
    const el = root.current!;
    render(el, []);
    emit([]);
    record([], [0, 0]);
    el.focus();
  }

  /** Mở thẻ pinyin / nghĩa cho đoạn bôi vàng `el`. */
  function openCard(el: HTMLElement, editing: boolean) {
    const r = root.current;
    if (!r || !r.contains(el)) return;
    const word = (el.textContent ?? "").trim();
    if (!word || word.length > 40) return;
    const first = el.firstChild ?? el;
    const start = toOffset(r, first, 0);
    const rect = el.getBoundingClientRect();
    if (hideTimer.current) clearTimeout(hideTimer.current);
    const note = el.dataset.n ?? "";
    setCard({
      word,
      start,
      end: start + (el.textContent ?? "").length,
      x: rect.left + rect.width / 2,
      y: rect.bottom,
      note,
      editing,
    });
    setNoteDraft(note);
    if (info?.word !== word) {
      setInfo({ word, data: null });
      void lookup(word).then((data) => setInfo((cur) => (cur?.word === word ? { word, data } : cur)));
    }
  }
  const scheduleHide = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setCard((c) => (c?.editing ? c : null)), 250);
  };

  /** Gắn / xoá ghi chú cho đoạn [start, end) (theo code unit của DOM). */
  function saveNote(c: WordCard, note: string) {
    const el = root.current!;
    const cur = serialize(el);
    const text = plainOf(cur);
    const list = chars(cur);
    const ca = unitToChar(text, c.start);
    const cb = unitToChar(text, c.end);
    const clean = note.trim().slice(0, LISTENING.MAX_NOTE);
    for (const ch of list.slice(ca, cb)) ch.f = { ...ch.f, note: clean || undefined };
    const next = fromChars(list);
    render(el, next);
    emit(next);
    record(next, [c.end, c.end]);
    setCard(null);
  }

  const tool =
    "inline-flex min-h-10 items-center gap-1.5 rounded-[10px] border border-border bg-white px-3 text-[14px] font-semibold text-text outline-none hover:bg-blue-50 focus-visible:shadow-[var(--focus-ring)] disabled:opacity-40 [&_svg]:size-[18px]";
  const keep = (e: React.MouseEvent) => e.preventDefault(); // giữ vùng chọn khi bấm nút công cụ

  return (
    <div className="flex flex-col gap-2">
      <style>{HIGHLIGHT_CSS}</style>
      <div
        role="toolbar"
        aria-label={t("listening.dictation.toolbar")}
        aria-controls={id}
        className="flex flex-wrap gap-1.5"
      >
        <button
          type="button"
          className={cn(tool, "px-2.5")}
          onMouseDown={keep}
          onClick={() => travel(-1)}
          disabled={!canUndo}
          aria-label={t("listening.dictation.undo")}
          title={t("listening.dictation.undo")}
        >
          <Undo2 />
        </button>
        <button
          type="button"
          className={cn(tool, "px-2.5")}
          onMouseDown={keep}
          onClick={() => travel(1)}
          disabled={!canRedo}
          aria-label={t("listening.dictation.redo")}
          title={t("listening.dictation.redo")}
        >
          <Redo2 />
        </button>
        <button type="button" className={tool} onMouseDown={keep} onClick={() => format("black")}>
          <PenLine className="text-text" />
          {t("listening.dictation.black")}
        </button>
        <button type="button" className={tool} onMouseDown={keep} onClick={() => format("red")}>
          <PenLine className="text-red" />
          {t("listening.dictation.red")}
        </button>
        <button type="button" className={tool} onMouseDown={keep} onClick={() => format("yellow")}>
          <Highlighter className="text-amber" />
          {t("listening.dictation.yellow")}
        </button>
        <button type="button" className={tool} onMouseDown={keep} onClick={clearAll} disabled={!len}>
          <Eraser className="text-blue-600" />
          {t("listening.dictation.clearAll")}
        </button>
        <button
          type="button"
          className={cn(tool, "sm:ml-auto")}
          onMouseDown={keep}
          onClick={() => {
            const text = window.getSelection()?.toString().trim() ?? "";
            const el = root.current;
            const inside = el && getSel(el);
            if (!text || !inside || inside[0] === inside[1])
              return void toast.info(t("listening.dictation.selectFirst"));
            onSaveVocab(text.slice(0, 40));
          }}
        >
          <BookmarkPlus className="text-green-700" />
          {t("listening.dictation.saveVocab")}
        </button>
      </div>

      <div
        ref={root}
        id={id}
        role="textbox"
        aria-multiline="true"
        aria-label={t("listening.dictation.label")}
        aria-describedby={describedBy}
        aria-invalid={len > maxLength || undefined}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        lang="zh"
        onMouseOver={(e) => {
          const el = (e.target as HTMLElement).closest?.("span[data-h]");
          if (el instanceof HTMLElement) openCard(el, false);
        }}
        onMouseOut={(e) => {
          if ((e.target as HTMLElement).closest?.("span[data-h]")) scheduleHide();
        }}
        onClick={(e) => {
          const el = (e.target as HTMLElement).closest?.("span[data-h]");
          if (el instanceof HTMLElement) openCard(el, true);
        }}
        data-placeholder={t("listening.dictation.placeholder")}
        className="lx-editor min-h-[260px] w-full overflow-y-auto rounded-[14px] border-[1.5px] border-border bg-white px-4 py-3 font-cn text-[19px] leading-[1.9] break-words whitespace-pre-wrap text-text outline-none hover:border-border-strong focus-visible:border-blue focus-visible:shadow-[var(--focus-ring)] md:min-h-[300px]"
        onBeforeInput={(e) => {
          const ne = e.nativeEvent as InputEvent;
          const type = ne.inputType;
          if (type === "historyUndo" || type === "historyRedo") {
            e.preventDefault();
            return travel(type === "historyUndo" ? -1 : 1);
          }
          if (type === "insertParagraph" || type === "insertLineBreak") {
            e.preventDefault();
            return replaceRange("\n");
          }
          if (type === "insertFromPaste" || type === "insertFromDrop" || type === "insertReplacementText") {
            const data = ne.dataTransfer?.getData("text/plain") ?? ne.data ?? "";
            e.preventDefault();
            return replaceRange(data.replace(/\r\n?/g, "\n"));
          }
          if (type.startsWith("format")) return e.preventDefault();
          if (type === "insertText" && !composing.current && root.current) {
            const sel = getSel(root.current);
            const selLen = sel ? sel[1] - sel[0] : 0;
            if (len - selLen + (ne.data?.length ?? 0) > maxLength) {
              e.preventDefault();
              toast.error(t("listening.dictation.tooLong"));
            }
          }
        }}
        onInput={() => {
          if (!composing.current) readDom(true);
        }}
        onCompositionStart={() => {
          composing.current = true;
        }}
        onCompositionEnd={() => {
          composing.current = false;
          readDom(true);
        }}
        onKeyDown={(e) => {
          const mod = e.metaKey || e.ctrlKey;
          if (!mod) return;
          const k = e.key.toLowerCase();
          if (k === "z") {
            e.preventDefault();
            travel(e.shiftKey ? 1 : -1);
          } else if (k === "y") {
            e.preventDefault();
            travel(1);
          } else if (k === "b" || k === "i" || k === "u") e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          const data = e.dataTransfer.getData("text/plain");
          if (data) replaceRange(data);
        }}
      />

      {card ? (
        <div
          role="dialog"
          aria-label={t("listening.word.noteLabel", { word: card.word })}
          onMouseEnter={() => hideTimer.current && clearTimeout(hideTimer.current)}
          onMouseLeave={scheduleHide}
          style={{ left: card.x, top: card.y + 8 }}
          className="fixed z-[70] w-[280px] -translate-x-1/2 rounded-[16px] border border-[#F6DE9E] bg-white p-3.5 shadow-card"
        >
          <div className="flex items-start gap-2">
            <p lang="zh" className="min-w-0 flex-1 font-cn text-[22px] leading-tight font-bold text-navy-900">
              {card.word}
            </p>
            <button
              type="button"
              onClick={() => setCard(null)}
              aria-label={t("listening.word.close")}
              className="flex size-8 items-center justify-center rounded-full text-text-3 hover:bg-blue-50"
            >
              <X className="size-4" />
            </button>
          </div>
          {info?.word === card.word && info.data ? (
            <>
              <p className="text-[15px] text-pinyin">
                <span className="sr-only">{t("listening.word.pinyin")}: </span>
                {info.data.pinyin}
              </p>
              <p className="mt-1 text-[14.5px] text-text">
                <span className="font-semibold text-text-2">{t("listening.word.meaning")}: </span>
                {card.note || info.data.meaning || <span className="text-text-3">{t("listening.word.noMeaning")}</span>}
                {!card.note && info.data.meaning ? (
                  <span className="ml-1 text-[12.5px] text-text-3">{t("listening.word.fromVocab")}</span>
                ) : null}
              </p>
            </>
          ) : (
            <p className="flex items-center gap-2 text-[14px] text-text-3">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              {t("listening.word.loading")}
            </p>
          )}
          {card.editing ? (
            <form
              className="mt-2.5 flex flex-col gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                saveNote(card, noteDraft);
              }}
            >
              <label className="sr-only" htmlFor="lx-word-note">
                {t("listening.word.noteLabel", { word: card.word })}
              </label>
              <input
                id="lx-word-note"
                autoFocus
                value={noteDraft}
                maxLength={LISTENING.MAX_NOTE}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder={t("listening.word.notePlaceholder")}
                className="h-10 rounded-[10px] border border-border px-3 text-[14.5px] outline-none focus:border-blue"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="inline-flex h-9 items-center rounded-[10px] bg-blue-600 px-3.5 text-[14px] font-semibold text-white hover:bg-blue-700"
                >
                  {t("listening.word.save")}
                </button>
                {card.note ? (
                  <button
                    type="button"
                    onClick={() => saveNote(card, "")}
                    className="inline-flex h-9 items-center rounded-[10px] px-3 text-[14px] font-semibold text-red hover:bg-red-50"
                  >
                    {t("listening.word.remove")}
                  </button>
                ) : null}
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setCard({ ...card, editing: true })}
              className="mt-2 inline-flex h-9 items-center rounded-[10px] bg-[#FFF3D2] px-3 text-[14px] font-semibold text-[#8A5300] hover:bg-[#FFE9B0]"
            >
              {card.note ? t("listening.word.edit") : t("listening.word.add")}
            </button>
          )}
        </div>
      ) : null}
      {bubble ? (
        <button
          type="button"
          onMouseDown={keep}
          onClick={() => {
            onSaveVocab(bubble.text);
            setBubble(null);
          }}
          style={{ left: bubble.x, top: Math.max(8, bubble.y - 48) }}
          className="fixed z-[70] inline-flex min-h-10 -translate-x-1/2 items-center gap-1.5 rounded-full bg-navy px-4 text-[14px] font-semibold text-white shadow-card outline-none hover:bg-navy-900 focus-visible:shadow-[var(--focus-ring)]"
        >
          <BookmarkPlus className="size-4" />
          {t("listening.dictation.saveVocab")}
        </button>
      ) : null}
    </div>
  );
});
