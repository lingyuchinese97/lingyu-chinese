# Sinh web/src/services/data/radicalMap.js từ Unihan (Unicode 9.0).
# Cách chạy:
#   npm pack ncr-unicode-data-ucd-9.0.0 && tar xzf ncr-unicode-data-ucd-9.0.0-9.0.0.tgz
#   python3 web/tools/build_radicals.py web/src/services/data/radicalMap.js   (chạy ở thư mục chứa package/)
import re, json, collections, sys
P = "package/"
def fields(fname, keys):
    out = collections.defaultdict(dict)
    for line in open(P + fname, encoding="utf-8"):
        if line.startswith("#") or not line.strip(): continue
        cp, k, v = line.rstrip("\n").split("\t", 2)
        if k in keys: out[chr(int(cp[2:], 16))][k] = v
    return out
irg = fields("Unihan_IRGSources.txt", {"kRSUnicode"})
rd = fields("Unihan_Readings.txt", {"kHanyuPinlu", "kMandarin"})
om = fields("Unihan_OtherMappings.txt", {"kGB0"})

def pinlu(ch):
    v = rd.get(ch, {}).get("kHanyuPinlu")
    if not v: return None, 0
    best = max(re.findall(r"([^\s(]+)\((\d+)\)", v), key=lambda t: int(t[1]))
    total = sum(int(n) for n in re.findall(r"\((\d+)\)", v))
    return best[0], total

chars = set(c for c in rd if "kHanyuPinlu" in rd[c]) | set(c for c in om if "kGB0" in om[c])
by_rad = collections.defaultdict(list)
pinyin = {}
for ch in chars:
    rs = irg.get(ch, {}).get("kRSUnicode")
    if not rs: continue
    first = rs.split()[0]
    m = re.match(r"(\d+)'?\.(-?\d+)", first)
    if not m: continue
    rad = int(m.group(1))
    py, freq = pinlu(ch)
    if not py:
        mand = rd.get(ch, {}).get("kMandarin")
        py = mand.split()[0] if mand else ""
    gb = om.get(ch, {}).get("kGB0")
    # Chữ giản thể (có trong GB2312) lên trước, rồi theo tần suất; chữ phồn thể vẫn tra được nhưng xếp sau.
    by_rad[rad].append((0 if gb else 1, -freq, gb or "9999", ch, py))

rad_chars, ex_py = {}, {}
for rad in sorted(by_rad):
    items = sorted(by_rad[rad])
    rad_chars[rad] = "".join(i[3] for i in items)
    for _, _, _, ch, py in items[:12]:
        if py: ex_py[ch] = py

# Dạng giản thể của bộ (vd 149' → 讠)
simp = {}
for line in open(P + "CJKRadicals.txt", encoding="utf-8"):
    if line.startswith("#") or not line.strip(): continue
    num, _, uni = [x.strip() for x in line.split(";")]
    if num.endswith("'"): simp[int(num[:-1])] = chr(int(uni, 16))

n_chars = sum(len(v) for v in rad_chars.values())
js = ("// TỰ SINH từ Unicode Unihan 9.0 (kRSUnicode, kHanyuPinlu, kGB0) — không sửa tay.\n"
      "// Nguồn: gói npm ncr-unicode-data-ucd-9.0.0. Script: tools/build_radicals.py\n"
      f"// {n_chars} chữ (GB2312 + bảng tần suất Hán ngữ hiện đại). Trong từng bộ: chữ giản thể thông dụng trước.\n\n"
      "/** Số bộ → chuỗi các chữ thuộc bộ đó (chữ thông dụng trước). */\n"
      f"export const RADICAL_CHARS = {json.dumps({str(k): v for k, v in rad_chars.items()}, ensure_ascii=False, separators=(',', ':'))};\n\n"
      "/** Pinyin của các chữ ví dụ (12 chữ đầu mỗi bộ). */\n"
      f"export const EXAMPLE_PINYIN = {json.dumps(ex_py, ensure_ascii=False, separators=(',', ':'))};\n\n"
      "/** Dạng giản thể chính thức của bộ (CJKRadicals.txt), vd 149 → 讠. */\n"
      f"export const SIMPLIFIED_FORM = {json.dumps({str(k): v for k, v in simp.items()}, ensure_ascii=False, separators=(',', ':'))};\n")
open(sys.argv[1], "w", encoding="utf-8").write(js)
print("chars", n_chars, "radicals", len(rad_chars), "bytes", len(js.encode()))
