/**
 * So sánh bài chép chính tả với đáp án tham khảo (dùng CHUNG cho: nút "Kiểm tra đáp án", popup "Lưu bài làm", màn
 * "Bài làm của tôi" và server khi lưu) — cùng một hàm nên highlight / điểm giống hệt nhau ở mọi nơi.
 *
 * - Đơn vị so sánh ("chữ"): mỗi chữ Hán là 1 chữ; chữ Latin / số liền nhau (vd pinyin "hǎo") là 1 chữ.
 *   Khoảng trắng và dấu câu KHÔNG tính (không bắt lỗi dấu ，/ ,), chỉ hiển thị bình thường.
 * - Không phân biệt hoa/thường; ký tự full-width được đổi về thường (NFKC). Dấu thanh pinyin vẫn phải đúng.
 * - Căn chỉnh bằng LCS: phần khớp = Đúng; trong mỗi khoảng lệch, cặp chữ đáp án ↔ chữ bài làm = Sai (đỏ),
 *   chữ đáp án còn dư = Thiếu (vàng), chữ bài làm còn dư = Thừa (xám).
 * - Điểm = số chữ Đúng / số chữ của đáp án.
 *
 * Trạng thái so sánh (`status`) tách hẳn với định dạng người dùng tự tô (bút đỏ / bôi vàng — `FormattedSpan`):
 * màu đỏ của so sánh chỉ có nghĩa "không khớp đáp án".
 */

export type DiffStatus = "correct" | "wrong" | "missing" | "extra";

/** Một đoạn để hiển thị bài làm: văn bản của người dùng (hoặc chữ bị thiếu chèn vào) kèm trạng thái. */
export type DiffPart =
  | {
      kind: "text";
      text: string;
      status: Exclude<DiffStatus, "missing"> | "neutral";
      start: number;
      end: number;
      expected?: string;
    }
  | { kind: "missing"; text: string; at: number };

export type Comparison = {
  parts: DiffPart[];
  correct: number;
  wrong: number;
  missing: number;
  extra: number;
  /** Số chữ của đáp án. */
  total: number;
  /** 0–100, làm tròn. */
  percent: number;
};

type Token = { key: string; start: number; end: number };

const HAN = /\p{Script=Han}/u;
const WORD = /[\p{L}\p{M}\p{N}]/u;

/** Tách chữ: mỗi chữ Hán 1 token, chuỗi chữ cái / số liền nhau 1 token; bỏ khoảng trắng + dấu câu. */
export function tokenize(text: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  while (i < text.length) {
    const cp = text.codePointAt(i)!;
    const ch = String.fromCodePoint(cp);
    const len = ch.length;
    if (HAN.test(ch)) {
      out.push({ key: norm(ch), start: i, end: i + len });
      i += len;
    } else if (WORD.test(ch)) {
      let j = i + len;
      while (j < text.length) {
        const c = String.fromCodePoint(text.codePointAt(j)!);
        if (!WORD.test(c) || HAN.test(c)) break;
        j += c.length;
      }
      out.push({ key: norm(text.slice(i, j)), start: i, end: j });
      i = j;
    } else i += len;
  }
  return out;
}

function norm(s: string) {
  return s.normalize("NFKC").normalize("NFC").toLowerCase();
}

export type Op = { op: "eq"; a: number; b: number } | { op: "del"; a: number } | { op: "ins"; b: number };

/**
 * Dãy thao tác biến a → b theo LCS (eq / del = chỉ có ở a / ins = chỉ có ở b). Cắt phần đầu/cuối giống nhau trước
 * nên sửa vài chữ trong bài dài vẫn nhanh (chạy lại mỗi lần gõ).
 */
export function lcsOps<T>(a: readonly T[], b: readonly T[], eq: (x: T, y: T) => boolean = Object.is): Op[] {
  let pre = 0;
  while (pre < a.length && pre < b.length && eq(a[pre]!, b[pre]!)) pre++;
  let suf = 0;
  while (suf < a.length - pre && suf < b.length - pre && eq(a[a.length - 1 - suf]!, b[b.length - 1 - suf]!)) suf++;
  const n = a.length - pre - suf;
  const m = b.length - pre - suf;
  const ops: Op[] = [];
  for (let i = 0; i < pre; i++) ops.push({ op: "eq", a: i, b: i });
  if (n || m) {
    // dp[i][j] = LCS của a[pre+i..], b[pre+j..] (bảng phẳng, (n+1)*(m+1)).
    const w = m + 1;
    const dp = new Uint16Array((n + 1) * w);
    for (let i = n - 1; i >= 0; i--)
      for (let j = m - 1; j >= 0; j--)
        dp[i * w + j] = eq(a[pre + i]!, b[pre + j]!)
          ? dp[(i + 1) * w + j + 1]! + 1
          : Math.max(dp[(i + 1) * w + j]!, dp[i * w + j + 1]!);
    let i = 0;
    let j = 0;
    while (i < n && j < m) {
      if (eq(a[pre + i]!, b[pre + j]!)) {
        ops.push({ op: "eq", a: pre + i, b: pre + j });
        i++;
        j++;
      } else if (dp[(i + 1) * w + j]! >= dp[i * w + j + 1]!) ops.push({ op: "del", a: pre + i++ });
      else ops.push({ op: "ins", b: pre + j++ });
    }
    while (i < n) ops.push({ op: "del", a: pre + i++ });
    while (j < m) ops.push({ op: "ins", b: pre + j++ });
  }
  for (let k = suf; k > 0; k--) ops.push({ op: "eq", a: a.length - k, b: b.length - k });
  return ops;
}

type Mark = { status: Exclude<DiffStatus, "missing">; expected?: string };

export function compareDictation(reference: string, answer: string): Comparison {
  const ref = tokenize(reference);
  const ans = tokenize(answer);
  const ops = lcsOps(
    ref.map((t) => t.key),
    ans.map((t) => t.key),
  );

  const marks = new Map<number, Mark>(); // chỉ số token bài làm → trạng thái
  const missingAt: { beforeToken: number; text: string }[] = [];
  let correct = 0;
  let wrong = 0;
  let missing = 0;
  let extra = 0;

  // Gom từng khoảng lệch giữa hai lần khớp để ghép cặp Sai.
  let dels: number[] = [];
  let inss: number[] = [];
  const flush = (nextAnsToken: number) => {
    const pairs = Math.min(dels.length, inss.length);
    for (let k = 0; k < pairs; k++) {
      const r = ref[dels[k]!]!;
      marks.set(inss[k]!, { status: "wrong", expected: reference.slice(r.start, r.end) });
      wrong++;
    }
    for (let k = pairs; k < inss.length; k++) {
      marks.set(inss[k]!, { status: "extra" });
      extra++;
    }
    const rest = dels.slice(pairs);
    if (rest.length) {
      missingAt.push({
        beforeToken: nextAnsToken,
        text: rest.map((d) => reference.slice(ref[d]!.start, ref[d]!.end)).join(""),
      });
      missing += rest.length;
    }
    dels = [];
    inss = [];
  };
  for (const o of ops) {
    if (o.op === "eq") {
      flush(o.b);
      marks.set(o.b, { status: "correct" });
      correct++;
    } else if (o.op === "del") dels.push(o.a);
    else inss.push(o.b);
  }
  flush(ans.length);

  // Dựng các đoạn hiển thị theo thứ tự văn bản của người dùng; ký tự không phải chữ = neutral.
  const parts: DiffPart[] = [];
  const pushText = (text: string, status: Mark["status"] | "neutral", start: number, expected?: string) => {
    if (!text) return;
    const last = parts[parts.length - 1];
    if (last?.kind === "text" && last.status === status && status !== "wrong" && last.end === start) {
      last.text += text;
      last.end = start + text.length;
    } else
      parts.push({ kind: "text", text, status, start, end: start + text.length, ...(expected ? { expected } : {}) });
  };
  let pos = 0;
  let mi = 0;
  for (let k = 0; k <= ans.length; k++) {
    const tok = ans[k];
    const tokStart = tok ? tok.start : answer.length;
    // Chữ bị thiếu đặt ngay trước token k (sau phần dấu câu / khoảng trắng đứng trước nó).
    if (tok) pushText(answer.slice(pos, tokStart), "neutral", pos);
    while (mi < missingAt.length && missingAt[mi]!.beforeToken === k) {
      parts.push({ kind: "missing", text: missingAt[mi]!.text, at: tok ? tokStart : pos });
      mi++;
    }
    if (!tok) {
      pushText(answer.slice(pos), "neutral", pos);
      break;
    }
    const m = marks.get(k)!;
    pushText(answer.slice(tok.start, tok.end), m.status, tok.start, m.expected);
    pos = tok.end;
  }

  const total = ref.length;
  return { parts, correct, wrong, missing, extra, total, percent: total ? Math.round((correct / total) * 100) : 0 };
}

/** Tóm tắt để lưu / hiển thị điểm: "Đúng 5/6 chữ (83%)". */
export type ComparisonSummary = Omit<Comparison, "parts">;
export function summarize(c: Comparison): ComparisonSummary {
  const { parts: _parts, ...rest } = c;
  return rest;
}

// ---------- Định dạng người dùng tự tô (tách khỏi kết quả so sánh) ----------

export type PenColor = "black" | "red";
export type FormattedSpan = { text: string; color?: PenColor; highlight?: boolean };

export const plainOf = (spans: readonly FormattedSpan[]) => spans.map((s) => s.text).join("");

/** Gộp đoạn liền kề cùng định dạng, bỏ đoạn rỗng, chuẩn hoá mặc định (đen, không bôi) thành không có thuộc tính. */
export function normalizeSpans(spans: readonly FormattedSpan[]): FormattedSpan[] {
  const out: FormattedSpan[] = [];
  for (const s of spans) {
    if (!s.text) continue;
    const f: FormattedSpan = { text: s.text };
    if (s.color === "red") f.color = "red";
    if (s.highlight) f.highlight = true;
    const last = out[out.length - 1];
    if (last && last.color === f.color && !!last.highlight === !!f.highlight) last.text += f.text;
    else out.push(f);
  }
  return out;
}

/**
 * Văn bản đổi (sửa trong popup / màn Bài làm) → giữ định dạng của các ký tự còn nguyên, ký tự mới lấy định dạng mặc định.
 */
export function reformat(old: readonly FormattedSpan[], nextText: string): FormattedSpan[] {
  const oldChars: { ch: string; color?: PenColor; highlight?: boolean }[] = [];
  for (const s of old) for (const ch of s.text) oldChars.push({ ch, color: s.color, highlight: s.highlight });
  const newChars = [...nextText];
  if (oldChars.map((c) => c.ch).join("") === nextText) return normalizeSpans(old);
  const ops = lcsOps(
    oldChars.map((c) => c.ch),
    newChars,
  );
  const spans: FormattedSpan[] = [];
  for (const o of ops) {
    if (o.op === "eq")
      spans.push({ text: newChars[o.b]!, color: oldChars[o.a]!.color, highlight: oldChars[o.a]!.highlight });
    else if (o.op === "ins") spans.push({ text: newChars[o.b]! });
  }
  return normalizeSpans(spans);
}
