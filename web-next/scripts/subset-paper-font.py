#!/usr/bin/env python3
"""
Tạo font chữ Khải cho giấy ô vuông / câu hỏi Đọc hiểu: LXGW WenKai (SIL OFL 1.1) cắt còn đúng các chữ có trong
dữ liệu bài đọc (src/data/reading/passages.ts) + dấu câu, để không phải tải cả font ~8MB.

Chạy lại sau khi thêm / sửa bài đọc (test tests/unit/paper-font.test.ts báo nếu thiếu chữ):
  pip install fonttools brotli
  python3 scripts/subset-paper-font.py
"""
import pathlib
import re

from fontTools import subset

ROOT = pathlib.Path(__file__).resolve().parent.parent
FILES = ROOT / "node_modules/@fontsource/lxgw-wenkai/files"
# Nét thường (500) cho chữ trong bài, nét đậm (700) cho tiêu đề / câu hỏi.
FACES = {"paper-kai.woff2": "lxgw-wenkai-latin-500-normal.woff2", "paper-kai-bold.woff2": "lxgw-wenkai-latin-700-normal.woff2"}
OUT_DIR = ROOT / "public/fonts"
CHARS = ROOT / "public/fonts/paper-kai.chars.txt"

text = (ROOT / "src/data/reading/passages.ts").read_text(encoding="utf-8")
han = set(re.findall(r"[　-〿㐀-鿿＀-￯“”‘’…—·]", text))
chars = "".join(sorted(han)) + " 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz:;,.!?()_-"

OUT_DIR.mkdir(parents=True, exist_ok=True)
for out_name, src_name in FACES.items():
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.layout_features = ["*"]
    opts.name_IDs = ["*"]
    opts.notdef_outline = True
    font = subset.load_font(str(FILES / src_name), opts)
    sub = subset.Subsetter(opts)
    sub.populate(text=chars)
    sub.subset(font)
    out = OUT_DIR / out_name
    subset.save_font(font, str(out), opts)
    print(f"{len(han)} chữ → {out.relative_to(ROOT)} ({out.stat().st_size // 1024} KB)")
CHARS.write_text("".join(sorted(han)) + "\n", encoding="utf-8")

# ---------- Bộ chia nhỏ cho chữ bất kỳ (ô Chép chính tả, …) ----------
# Nét thường cắt thành nhiều gói ~300 chữ theo GB2312 (6.763 chữ thông dụng) + dấu câu; mỗi gói một @font-face có
# `unicode-range` → trình duyệt chỉ tải gói chứa chữ đang hiện. Gói 0 = dấu câu + chữ trong bài đọc.
def gb2312_hanzi():
    out = []
    for hi in range(0xB0, 0xF8):
        for lo in range(0xA1, 0xFF):
            try:
                out.append(bytes([hi, lo]).decode("gb2312"))
            except UnicodeDecodeError:
                pass
    return out

punct = [chr(c) for c in list(range(0x3000, 0x3040)) + list(range(0xFF01, 0xFF5F))] + list("“”‘’…—·")
first = sorted(set(punct) | {c for c in han if "㐀" <= c <= "鿿"})
rest = [c for c in dict.fromkeys(gb2312_hanzi()) if c not in set(first)]
CHUNK = 300
groups = [first] + [rest[i : i + CHUNK] for i in range(0, len(rest), CHUNK)]

KAI_DIR = OUT_DIR / "kai"
KAI_DIR.mkdir(parents=True, exist_ok=True)
for old in KAI_DIR.glob("*.woff2"):
    old.unlink()
base = subset.load_font(str(FILES / "lxgw-wenkai-latin-500-normal.woff2"), subset.Options())
cmap = base.getBestCmap()
css = [
    "/* Sinh tự động bởi scripts/subset-paper-font.py — LXGW WenKai (SIL OFL 1.1) chia gói theo unicode-range. */",
]
covered = []
for i, g in enumerate(groups):
    g = [c for c in g if ord(c) in cmap]
    if not g:
        continue
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.layout_features = ["*"]
    opts.notdef_outline = False
    font = subset.load_font(str(FILES / "lxgw-wenkai-latin-500-normal.woff2"), opts)
    sub = subset.Subsetter(opts)
    sub.populate(text="".join(g))
    sub.subset(font)
    name = f"kai-{i:02d}.woff2"
    subset.save_font(font, str(KAI_DIR / name), opts)
    ranges = ",".join(f"U+{ord(c):X}" for c in sorted(g))
    css.append(
        f'@font-face{{font-family:"LingYu Kai";font-style:normal;font-weight:400 600;font-display:swap;'
        f'src:url("/fonts/kai/{name}") format("woff2");unicode-range:{ranges}}}'
    )
    covered += g
(ROOT / "src/app/kai-font.css").write_text("\n".join(css) + "\n", encoding="utf-8")
(KAI_DIR / "chars.txt").write_text("".join(sorted(set(covered))) + "\n", encoding="utf-8")
total = sum(f.stat().st_size for f in KAI_DIR.glob("*.woff2")) // 1024
print(f"{len(covered)} chữ → {len(list(KAI_DIR.glob('*.woff2')))} gói trong public/fonts/kai ({total} KB tổng)")
