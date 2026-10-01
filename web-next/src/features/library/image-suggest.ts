/**
 * Ảnh gợi ý cho từ trong Thư viện LingYu — lấy từ Wikimedia (ảnh giấy phép tự do, không cần khoá API):
 * 1. Wikidata: mục có nhãn tiếng Trung khớp từ → ảnh đại diện (P18) — chính xác nhất (苹果 → ảnh quả táo).
 * 2. Wikimedia Commons: tìm file ảnh theo chữ Hán.
 * Admin chọn một ảnh → máy chủ tải bản thu nhỏ từ upload.wikimedia.org (chỉ host này), kiểm tra như ảnh tải lên,
 * lưu vào DB kèm ghi công tác giả + giấy phép. Người học xem ảnh qua API của app, không gọi ra ngoài.
 * `LIBRARY_IMAGE_SOURCE=fake` (chỉ dùng cho e2e): trả ảnh mẫu, không gọi mạng.
 */
import { IMAGE } from "@/lib/limits";
import { LibraryError } from "./service";

export type ImageSuggestion = { title: string; thumb: string; credit: string };

const WIKIDATA = "https://www.wikidata.org/w/api.php";
const COMMONS = "https://commons.wikimedia.org/w/api.php";
const UPLOAD_HOST = "upload.wikimedia.org";
const UA = "LingYuChinese/1.0 (https://github.com/lingyuchinese97/lingyu-chinese)";
const NO_IMAGE = "Không tải được ảnh gợi ý này. Hãy chọn ảnh khác.";
const FAKE_PNG = "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEUlEQVR4nGN4YKCPFTEMLQkAVdlPwTWPoE8AAAAASUVORK5CYII=";

type Fetch = typeof fetch;
const fake = () => process.env.LIBRARY_IMAGE_SOURCE === "fake";

async function getJson(f: Fetch, base: string, params: Record<string, string>) {
  const url = `${base}?${new URLSearchParams({ format: "json", formatversion: "2", origin: "*", ...params })}`;
  const r = await f(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(6000),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return (await r.json()) as Record<string, unknown>;
}

/** Tên file Commons hợp lệ ("File:…"), không ký tự điều khiển. */
export const isFileTitle = (t: string) => /^File:[^\x00-\x1f|#<>[\]{}]{1,240}$/u.test(t);
const stripHtml = (s: string) =>
  s
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
export const isUploadUrl = (u: string) => {
  try {
    const x = new URL(u);
    return x.protocol === "https:" && x.hostname === UPLOAD_HOST;
  } catch {
    return false;
  }
};

type Info = { title: string; url: string; credit: string };
type ImageInfoPage = {
  title?: string;
  imageinfo?: {
    thumburl?: string;
    mime?: string;
    extmetadata?: Record<string, { value?: string } | undefined>;
  }[];
};

/** Bản thu nhỏ + ghi công cho các file (ảnh động / video / PDF bị bỏ). */
async function imageInfo(f: Fetch, titles: string[], width: number): Promise<Info[]> {
  if (!titles.length) return [];
  const d = await getJson(f, COMMONS, {
    action: "query",
    prop: "imageinfo",
    iiprop: "url|mime|extmetadata",
    iiextmetadatafilter: "Artist|LicenseShortName",
    iiurlwidth: String(width),
    titles: titles.join("|"),
  });
  const pages = ((d.query as { pages?: ImageInfoPage[] } | undefined)?.pages ?? []) as ImageInfoPage[];
  const byTitle = new Map(pages.map((p) => [p.title ?? "", p]));
  const out: Info[] = [];
  for (const t of titles) {
    const ii = byTitle.get(t)?.imageinfo?.[0];
    if (!ii?.thumburl || !isUploadUrl(ii.thumburl)) continue;
    if (!/^image\/(jpeg|png|webp|svg\+xml)$/.test(ii.mime ?? "")) continue;
    const artist = stripHtml(ii.extmetadata?.Artist?.value ?? "").slice(0, 120);
    const license = stripHtml(ii.extmetadata?.LicenseShortName?.value ?? "").slice(0, 60);
    const credit = [artist, license, "Wikimedia Commons"].filter(Boolean).join(" · ");
    out.push({ title: t, url: ii.thumburl, credit });
  }
  return out;
}

/** File ảnh P18 của các mục Wikidata có nhãn tiếng Trung khớp từ. */
async function wikidataFiles(f: Fetch, hanzi: string): Promise<string[]> {
  const s = await getJson(f, WIKIDATA, {
    action: "wbsearchentities",
    search: hanzi,
    language: "zh",
    uselang: "zh",
    type: "item",
    limit: "5",
  });
  const ids = ((s.search as { id?: string }[] | undefined) ?? [])
    .map((x) => x.id ?? "")
    .filter((id) => /^Q\d+$/.test(id));
  if (!ids.length) return [];
  const e = await getJson(f, WIKIDATA, { action: "wbgetentities", ids: ids.join("|"), props: "claims" });
  const ents = (e.entities ?? {}) as Record<
    string,
    { claims?: { P18?: { mainsnak?: { datavalue?: { value?: unknown } } }[] } }
  >;
  return ids.flatMap((id) =>
    (ents[id]?.claims?.P18 ?? [])
      .map((c) => c.mainsnak?.datavalue?.value)
      .filter((v): v is string => typeof v === "string")
      .slice(0, 2)
      .map((v) => `File:${v}`),
  );
}

async function commonsFiles(f: Fetch, hanzi: string): Promise<string[]> {
  const d = await getJson(f, COMMONS, {
    action: "query",
    list: "search",
    srsearch: `${hanzi} filetype:bitmap`,
    srnamespace: "6",
    srlimit: "8",
  });
  return ((d.query as { search?: { title?: string }[] } | undefined)?.search ?? []).map((x) => x.title ?? "");
}

/** Tối đa `limit` ảnh gợi ý cho một từ (lỗi mạng → danh sách rỗng, không chặn admin). */
export async function suggestImages(hanzi: string, limit = 8, f: Fetch = fetch): Promise<ImageSuggestion[]> {
  const q = hanzi.replace(/[^\p{Script=Han}]/gu, "").slice(0, 20);
  if (!q) return [];
  if (fake())
    return [1, 2, 3].map((i) => ({
      title: `File:LingYu mẫu ${i}.png`,
      thumb: `data:image/png;base64,${FAKE_PNG}`,
      credit: `Ảnh mẫu ${i} · CC0 · Wikimedia Commons`,
    }));
  const safe = <T>(p: Promise<T[]>) =>
    p.catch((e: unknown) => (console.warn("[library] image suggest:", e), [] as T[]));
  const [wd, cm] = await Promise.all([safe(wikidataFiles(f, q)), safe(commonsFiles(f, q))]);
  const titles = [...new Set([...wd, ...cm])].filter(isFileTitle).slice(0, 12);
  const infos = await safe(imageInfo(f, titles, 360));
  return infos.slice(0, limit).map((i) => ({ title: i.title, thumb: i.url, credit: i.credit }));
}

/** Tải ảnh gợi ý admin đã chọn (bản rộng 800px) — chỉ từ upload.wikimedia.org, tối đa IMAGE.MAX_BYTES. */
export async function downloadSuggestedImage(
  title: string,
  f: Fetch = fetch,
): Promise<{ bytes: Buffer; credit: string }> {
  if (!isFileTitle(title)) throw new LibraryError("validation", NO_IMAGE);
  if (fake())
    return { bytes: Buffer.from(FAKE_PNG, "base64"), credit: `${title.slice(5, -4)} · CC0 · Wikimedia Commons` };
  let info: Info | undefined;
  try {
    [info] = await imageInfo(f, [title], 800);
  } catch {
    info = undefined;
  }
  if (!info) throw new LibraryError("validation", NO_IMAGE);
  const r = await f(info.url, {
    headers: { "User-Agent": UA },
    redirect: "error",
    signal: AbortSignal.timeout(10000),
  }).catch(() => null);
  if (!r?.ok) throw new LibraryError("validation", NO_IMAGE);
  const len = Number(r.headers.get("content-length") ?? 0);
  if (len > IMAGE.MAX_BYTES) throw new LibraryError("validation", NO_IMAGE);
  const bytes = Buffer.from(await r.arrayBuffer());
  if (bytes.length > IMAGE.MAX_BYTES) throw new LibraryError("validation", NO_IMAGE);
  return { bytes, credit: info.credit };
}
