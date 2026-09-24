# LingYu Chinese — Web

Web app ôn tập từ vựng tiếng Trung, dựng theo **LingYu_Chinese_Web_UI_Handoff.docx** + `reference_screens`.
Scope: Auth · Trang chủ · Từ vựng · Ôn tập (+ Cài đặt tối thiểu). Module chưa làm đã ẩn.

## Chạy thử
Không cần build. ES modules nên phải chạy qua HTTP server (không mở trực tiếp file://):

```bash
cd lingyu-web
python3 -m http.server 8080      # hoặc: npx serve .
# mở http://localhost:8080
```

## Cấu trúc
```
index.html
src/
  main.js                      # khai báo route + guard
  routes/router.js             # hash router (params, query, guard, beforeLeave)
  styles/{tokens,base,layout,auth,pages}.css
  components/layout/appShell.js   # Sidebar, TopUser, Breadcrumb, PageShell
  components/ui/{icons,feedback}.js  # icon SVG, Toast, Modal/Confirm, Menu
  features/auth/        login, register, verifyEmail, verifySuccess, forgotPassword, googleAuth, authShell
  features/home/        home
  features/vocabulary/  list (search/filter/tag/sort/pagination/bulk delete), form (thêm/sửa, ảnh, tag)
  features/review/      setup, session, result, grading
  features/settings/    settings
  services/api/         config, storage, authApi, vocabApi, reviewApi, sampleData
  assets/{brand,icons,decor}
```

## Routes
| Route | Màn |
|---|---|
| `/login` `/register` `/verify-email` `/verify-success` `/forgot-password` | Auth |
| `/home` | Trang chủ |
| `/vocabulary` · `/vocabulary/new` · `/vocabulary/:id/edit` | Từ vựng |
| `/review/setup` · `/review/session` · `/review/result` | Ôn tập |
| `/settings` | Cài đặt |

## Nối backend thật
Toàn bộ dữ liệu đi qua `src/services/api/*`. Bản hiện tại là **mock** (localStorage + IndexedDB, theo từng user).
Giữ nguyên chữ ký hàm, thay phần thân bằng lời gọi REST/Firebase/Supabase — UI không cần sửa.
- `authApi`: register → verifyEmail (OTP 6 số, hết hạn 5 phút, gửi lại sau 60s, tối đa 5 lần sai), login (khóa 60s sau 5 lần sai), loginWithGoogle, requestPasswordReset (không tiết lộ email tồn tại).
- `vocabApi`: list({q, tag, sort, page, pageSize}), get, create, update, remove(ids), toggleFavorite, setStatus, listTags, stats, pool.
- `reviewApi`: createSession(config), checkAnswer, saveProgress, completeSession, getActiveSession (resume khi refresh), getLastResult.
- `config.js`: `SHOW_DEMO_OTP` — bản mock hiện mã OTP trên màn Verify; tắt khi có email thật.

## Chấm đáp án
- Nghĩa Việt: không phân biệt hoa/thường, chấp nhận từng nghĩa tách bằng `,` `;` `/`.
- Chữ Hán: so khớp chính xác (bỏ khoảng trắng).
- Pinyin: chấp nhận dấu thanh hoặc số (`ni3 hao3` = `nǐ hǎo`), `v` = `ü`, bỏ khoảng trắng.

## Ghi chú asset
- Logo/mascot dùng nguyên PNG gốc (`assets/brand`), `object-fit: contain`. Logo gốc có nền trắng nên dùng `mix-blend-mode: multiply` để hòa nền — nếu có bản PNG nền trong suốt thì thay file là xong.
- Chỉ có 1 file mascot (vẫy tay trong bong bóng) nên mọi vị trí mascot (sidebar, hero, kết quả) dùng chung file này. Có thêm mascot cầm sách / “Well Done” thì thay đường dẫn trong `BRAND` (appShell.js).
