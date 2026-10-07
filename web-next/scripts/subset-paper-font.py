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
