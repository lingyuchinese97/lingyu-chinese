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
SRC = ROOT / "node_modules/@fontsource/lxgw-wenkai/files/lxgw-wenkai-latin-500-normal.woff2"
OUT = ROOT / "public/fonts/paper-kai.woff2"
CHARS = ROOT / "public/fonts/paper-kai.chars.txt"

text = (ROOT / "src/data/reading/passages.ts").read_text(encoding="utf-8")
han = set(re.findall(r"[　-〿㐀-鿿＀-￯“”‘’…—·]", text))
chars = "".join(sorted(han)) + " 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz:;,.!?()_-"

OUT.parent.mkdir(parents=True, exist_ok=True)
opts = subset.Options()
opts.flavor = "woff2"
opts.layout_features = ["*"]
opts.name_IDs = ["*"]
opts.notdef_outline = True
font = subset.load_font(str(SRC), opts)
sub = subset.Subsetter(opts)
sub.populate(text=chars)
sub.subset(font)
subset.save_font(font, str(OUT), opts)
CHARS.write_text("".join(sorted(han)) + "\n", encoding="utf-8")
print(f"{len(han)} chữ → {OUT.relative_to(ROOT)} ({OUT.stat().st_size // 1024} KB)")
