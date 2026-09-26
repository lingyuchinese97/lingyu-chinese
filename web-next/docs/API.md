# REST API `/api/v1`

API cho app điện thoại / app khác. Dùng chung logic (service) với giao diện web nên kết quả giống hệt.

**Swagger**: https://lingyuchinese.com/api-docs (xem và gọi thử từng route) · OpenAPI 3.1: https://lingyuchinese.com/api/openapi.json
— cả hai cần **tài khoản riêng của trang tài liệu** (`API_DOCS_USER` / `API_DOCS_PASSWORD`, hỏi người quản trị), khác tài khoản LingYu.

## Quy ước chung

- **Đăng nhập**: dùng phiên Better Auth (cookie). App khác đăng nhập bằng
  `POST /api/auth/sign-in/email` với `{ "email": "...", "password": "..." }`, lưu cookie `Set-Cookie` trả về và gửi kèm mọi
  request sau. Đăng xuất: `POST /api/auth/sign-out`.
- **Thân request** (POST/PUT/DELETE có dữ liệu) phải là JSON: `Content-Type: application/json`. Không phải JSON → `415`.
- **Kết quả**: thành công `{ "ok": true, "data": ... }`; lỗi `{ "ok": false, "message": "...", "fieldErrors"?: { "field": "..." } }`.
- **Mã HTTP**: `200` thành công · `201` đã tạo · `400` dữ liệu sai (có `fieldErrors` khi do kiểm tra dữ liệu) · `401` chưa đăng nhập ·
  `404` không có hoặc **không phải của mình** · `409` không có gì để ôn · `415` thân không phải JSON · `500` lỗi máy chủ.
- **Ngôn ngữ thông báo** theo lựa chọn của người dùng (`GET|PUT /api/v1/me/locale`, `vi` | `en`).
- Không bao giờ gửi `userId`: mọi dữ liệu lấy theo người đang đăng nhập.

## Từ vựng `/api/v1/vocab`

| Route                            | Việc                                                                                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /vocab`                     | Danh sách. Query: `q`, `tag`, `radical` (1–214), `sort` (`newest`\|`oldest`\|`pinyin`\|`favorite`), `page`, `pageSize` (1–100, mặc định 20) |
| `POST /vocab`                    | Thêm từ → `201 { id }`                                                                                                                      |
| `GET /vocab/{id}`                | Một từ                                                                                                                                      |
| `PUT /vocab/{id}`                | Sửa toàn bộ (cùng dạng như thêm) → từ sau khi sửa                                                                                           |
| `DELETE /vocab/{id}`             | Xoá → `{ removed: 1 }`                                                                                                                      |
| `POST /vocab/{id}/favorite`      | Bật / tắt yêu thích → `{ isFavorite }`                                                                                                      |
| `GET /vocab/tags`                | Tag và số từ `[{ id, name, count }]`                                                                                                        |
| `GET /vocab/stats`               | `{ total, learned, needReview, latest }`                                                                                                    |
| `POST /vocab/sample`             | Thêm bộ từ mẫu → `{ added }`                                                                                                                |
| `POST /vocab/delete`             | `{ ids }` → `{ removed }`                                                                                                                   |
| `POST /vocab/status`             | `{ ids, status: "learned"\|"review" }` → `{ updated }`                                                                                      |
| `POST /vocab/add-tags`           | `{ ids, tags }` → `{ updated }`                                                                                                             |
| `POST /vocab/shares`             | Chia sẻ `{ ids, emails }` → kết quả từng email                                                                                              |
| `GET /vocab/shares/sent`         | Lời mời đã gửi                                                                                                                              |
| `GET /vocab/shares/received`     | Lời mời nhận được                                                                                                                           |
| `POST /vocab/shares/{id}/accept` | Chấp nhận `{ keepTags?: true, extraTags?: [] }` → `{ added, skipped, total }`                                                               |
| `POST /vocab/shares/{id}/reject` | Từ chối → `{ rejected: true }`                                                                                                              |

Dạng một từ khi thêm / sửa:

```json
{ "hanzi": "他", "pinyin": "tā", "meaningVi": "anh ấy", "note": "", "tags": ["HSK1"], "radicals": [9] }
```

Ví dụ lỗi kiểm tra dữ liệu (`400`):

```json
{
  "ok": false,
  "message": "Vui lòng kiểm tra lại các trường bắt buộc.",
  "fieldErrors": { "hanzi": "Hán tự phải chứa ít nhất một chữ Hán.", "pinyin": "Vui lòng nhập pinyin." }
}
```

## Luyện nghe `/api/v1/listening`

Luồng: người dùng dán link, **tự nhập đáp án tham khảo** (không lấy phụ đề), chép chính tả, so sánh, sửa, lưu bài làm.

| Route                              | Việc                                                                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `GET /listening/exercises`         | Bài làm của tôi. Query: `q` (tiêu đề, bài chép, đáp án, ghi chú, thẻ), `tag`, `sort` (`newest`\|`oldest`), `page`, `pageSize` |
| `POST /listening/exercises`        | Lưu bài làm → `201` bài làm (kết quả so sánh + điểm do **server** tính)                                                       |
| `GET /listening/exercises/{id}`    | Một bài làm                                                                                                                   |
| `PUT /listening/exercises/{id}`    | Sửa toàn bộ; đáp án / bài chép đổi → chấm lại                                                                                 |
| `DELETE /listening/exercises/{id}` | Xoá (không xoá từ vựng đã lưu từ bài này) → `{ deleted: true }`                                                               |
| `GET /listening/tags`              | Thẻ và số bài `[{ id, name, count }]`                                                                                         |
| `POST /listening/compare`          | `{ referenceAnswer, userAnswer }` → kết quả so sánh (không lưu)                                                               |

Bài làm gửi lên:

```json
{
  "title": "Hội thoại chào hỏi – Bài 1",
  "tags": ["HSK1", "Hội thoại"],
  "contentUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "segmentStart": 12,
  "segmentEnd": 45,
  "playbackSpeed": 1,
  "referenceAnswer": "你好，我是小雨。",
  "referencePinyin": "Nǐ hǎo, wǒ shì Xiǎoyǔ.",
  "userAnswer": "你好，我叫小雨。",
  "formattedUserAnswer": [{ "text": "你好，" }, { "text": "我叫", "color": "red" }, { "text": "小雨。" }],
  "notes": "Cần lưu ý 我是 và 我叫."
}
```

- `contentUrl`: link YouTube hoặc link file âm thanh / video (.mp3, .m4a, .mp4…); để trống được. Link khác → `400`.
- Giới hạn: tiêu đề 100 ký tự; đáp án, pinyin, bài chép, ghi chú 2.000 ký tự mỗi ô; tối đa 10 thẻ; `playbackSpeed` ∈ 0.5 / 0.75 / 1 / 1.25 / 1.5.
- `formattedUserAnswer` là **định dạng người dùng tự tô** (bút đỏ `color: "red"`, bôi vàng `highlight: true`), tách hẳn khỏi kết quả
  so sánh. Nếu lệch với `userAnswer`, server tự căn lại theo `userAnswer`.
- Kết quả so sánh (`comparisonResult`, cũng là dạng trả về của `/compare`): mỗi chữ Hán (hoặc mỗi từ Latin) là một "chữ"; dấu câu,
  khoảng trắng không tính; không phân biệt hoa / thường. `parts` theo thứ tự bài chép: `{ kind: "text", status: "correct" | "wrong" |
"extra" | "neutral", start, end, expected? }` hoặc `{ kind: "missing", text, at }`. Điểm = `correct / total` (số chữ của đáp án).

## Tài khoản `/api/v1/me`

| Route                 | Việc                                                                                            |
| --------------------- | ----------------------------------------------------------------------------------------------- |
| `GET /me`             | Hồ sơ `{ id, name, email, role, locale }`                                                       |
| `PUT /me`             | Đổi tên `{ name }`                                                                              |
| `DELETE /me`          | Xoá tài khoản + toàn bộ dữ liệu `{ password }` (không hoàn tác được)                            |
| `POST /me/password`   | Đổi mật khẩu `{ current, password }` — thiết bị khác bị đăng xuất                               |
| `GET /me/export`      | Toàn bộ dữ liệu học tập (cùng dạng file "Xuất dữ liệu")                                         |
| `POST /me/import`     | Thân = nội dung file đã xuất (≤ 30MB) → gộp, không ghi đè; trả báo cáo thêm / bỏ qua            |
| `GET\|PUT /me/locale` | Ngôn ngữ `vi` \| `en`                                                                           |
| `GET /home`           | Số liệu Trang chủ (từ, câu, ngữ pháp, hôm nay, thẻ đến hạn, bài ôn dở, tiến độ bài học, chuông) |

## Ngữ pháp `/api/v1/grammar`

| Route                              | Việc                                                                                                                                                                         |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /grammar`                     | Danh sách. Query: `q`, `tag` (id thẻ), `sort` (`updated`\|`newest`\|`oldest`\|`az`\|`za`), `view` (`all`\|`saved`)                                                           |
| `POST /grammar`                    | Thêm → `201` ngữ pháp                                                                                                                                                        |
| `GET /grammar/{id}`                | Chủ sở hữu → `{ mode: "owner", grammar }` (có `personalNote`); người nhận có lời mời đang chờ (`?share=`) → `mode: "preview"` (không có ghi chú cá nhân); người khác → `404` |
| `PUT /grammar/{id}` · `DELETE`     | Sửa toàn bộ · xoá                                                                                                                                                            |
| `PUT /grammar/{id}/note`           | Ghi chú cá nhân `{ content }` (riêng tư, không bao giờ chia sẻ; rỗng = xoá)                                                                                                  |
| `PUT /grammar/{id}/bookmark`       | Lưu / bỏ lưu `{ saved }`                                                                                                                                                     |
| `GET\|POST /grammar/{id}/shares`   | Đã gửi cho ai · chia sẻ `{ emails }`                                                                                                                                         |
| `GET\|POST /grammar/tags`          | Thẻ + số bài · tạo `{ name }` (trùng → `409`)                                                                                                                                |
| `PUT\|DELETE /grammar/tags/{id}`   | Đổi tên · xoá thẻ                                                                                                                                                            |
| `GET /grammar/shares/received`     | Lời mời đang chờ tôi                                                                                                                                                         |
| `GET /grammar/shares/{id}/tags`    | Thẻ của người gửi                                                                                                                                                            |
| `POST /grammar/shares/{id}/accept` | `{ keepTags?, extraTags? }` → bản riêng `{ id, title }`; đã trả lời → `409`                                                                                                  |
| `POST /grammar/shares/{id}/reject` | Từ chối                                                                                                                                                                      |
| `POST /grammar/sample`             | Thêm ngữ pháp mẫu → `{ added }`                                                                                                                                              |

Thân thêm / sửa: `{ title, meaning?, structure? (mỗi dòng một cấu trúc, tối đa 4), notes?, personalNote?, examples?: [{ chinese, pinyin?, vietnamese? }], tags? }`.

## Ôn dịch câu `/api/v1/sentences`

| Route                                            | Việc                                                                                                                                 |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `GET /sentences`                                 | Kho câu. Query: `q`, `tag` (tên tag hoặc `__fav`), `page`, `pageSize`                                                                |
| `POST /sentences`                                | Thêm `{ chinese, pinyin?, vietnamese, note?, tags? }` → `201`                                                                        |
| `GET\|PUT\|DELETE /sentences/{id}`               | Xem · sửa · xoá                                                                                                                      |
| `POST /sentences/{id}/favorite`                  | Bật / tắt Yêu thích                                                                                                                  |
| `GET /sentences/tags`                            | Tag + số câu                                                                                                                         |
| `POST /sentences/delete` · `/status` · `/sample` | Xoá nhiều `{ ids }` · đổi trạng thái `{ ids, status }` · thêm câu mẫu                                                                |
| `GET /sentences/review/pool?tags=a,b`            | Số câu có thể ôn                                                                                                                     |
| `GET /sentences/review/last-config`              | Thiết lập gần nhất                                                                                                                   |
| `POST /sentences/review/sessions`                | Tạo bài `{ direction: "vi-zh"\|"zh-vi"\|"mixed", count, tags?, showPinyin?, showHint?, sentenceIds? }` → `201`; không có câu → `409` |
| `GET\|DELETE /sentences/review/sessions/active`  | Bài đang làm · bỏ bài                                                                                                                |
| `GET /sentences/review/sessions/last-result`     | Kết quả gần nhất (+ `wrongIds`)                                                                                                      |
| `POST /sentences/review/sessions/{id}/answer`    | `{ index, answer }`                                                                                                                  |
| `POST …/skip` · `…/override` · `…/hint`          | `{ index }` — bỏ qua · tính là đúng (máy chấm sai) · gợi ý chữ Hán                                                                   |
| `POST …/remember`                                | `{ index, remembered }` → câu thành Đã thuộc / Cần ôn                                                                                |
| `POST …/move` · `…/complete`                     | Chuyển câu `{ index }` · nộp bài (chưa làm hết → `400`)                                                                              |

## Bộ thủ, Bài học, Thông báo

| Route                                   | Việc                                                                   |
| --------------------------------------- | ---------------------------------------------------------------------- |
| `GET /radicals?q=`                      | 214 bộ thủ kèm `known`                                                 |
| `GET /radicals/{num}`                   | Một bộ (1–214) + chữ ví dụ                                             |
| `PUT /radicals/{num}/known`             | `{ known }`                                                            |
| `GET /lessons`                          | Danh sách bài + tiến độ                                                |
| `GET /lessons/{id}`                     | Nội dung bài (theo ngôn ngữ người dùng) + tiến độ từng phần            |
| `POST /lessons/{id}/sections/{section}` | `{ answers: (0–3 \| null)[] }` → **server tự chấm** `{ score, total }` |
| `GET /notifications`                    | 20 thông báo mới nhất, `unread`, lời mời còn chờ                       |
| `POST /notifications/read`              | `{ ids? }` (bỏ trống = tất cả) → `{ unread }`                          |

## Phát âm `/api/v1/pronunciation`

| Route                              | Việc                                                                                                                                             |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET /pronunciation`               | Nội dung: `initials`, `finals` (nhóm + âm), `tones`, `sandhi` (quy tắc + ví dụ). Chữ có sẵn `vi` / `en`                                          |
| `GET /pronunciation/practice`      | Tạo bài tự luyện. Query: `mode` (bắt buộc), `count` (1–20, mặc định 10) → `{ mode, questions }`                                                  |
| `GET /pronunciation/notes`         | Ghi chú phát âm của tôi (mới sửa trước)                                                                                                          |
| `POST /pronunciation/notes`        | Không `topic` → ghi chú tự do (`title`, `content` bắt buộc) → `201`. Có `topic` → lưu ghi chú mục đó → `200` (nội dung rỗng = xoá, `data: null`) |
| `GET /pronunciation/notes/{id}`    | Một ghi chú                                                                                                                                      |
| `PUT /pronunciation/notes/{id}`    | Sửa `{ title?, content }`                                                                                                                        |
| `DELETE /pronunciation/notes/{id}` | Xoá → `{ deleted: true }`                                                                                                                        |

- `mode`: `listen-choose` · `listen-type` · `speak-compare` · `pairs` · `read-words` · `sandhi`. Bài tự luyện không lưu điểm nên
  câu hỏi có kèm `answer`; chấm pinyin gõ tay chấp nhận số thanh (`ba1` ≡ `bā`, `lv4` ≡ `lǜ`). `speak` là chữ Hán để máy đọc.
- `topic`: `initial:b`, `final:ang`, `tone:3`, `sandhi:third-two`, `sandhi:third-two:0` (ví dụ thứ 1), `sandhi:general`. Mỗi mục một
  ghi chú. Giới hạn: tiêu đề 100, nội dung 2.000 ký tự, tối đa 500 ghi chú.

## Tiến độ học tập `/api/v1/progress`, Tìm kiếm `/api/v1/search`

Mọi số liệu chỉ của người đang đăng nhập (người khác không bao giờ thấy). Ngày tính theo giờ Việt Nam (UTC+7).

| Route                                      | Việc                                                                                                                                                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET /progress`                            | `{ summary, today }` — tổng thời gian học, chênh lệch với tuần trước, bài học / từ vựng / ngữ pháp (`done\|learned`, `total`, `percent`), kỹ năng, chuỗi ngày, mục tiêu                    |
| `GET /progress/daily?days=7\|30\|90`       | Số phút học từng ngày                                                                                                                                                                      |
| `GET /progress/history?kind=&days=&limit=` | Lịch sử học tập mới nhất trước (`kind`: `vocab_review`, `grammar_review`, `sentence_review`, `translation`, `reading`, `lesson`, `listening`, `pronunciation`, `vocab_add`, `grammar_add`) |
| `GET /progress/vocab`                      | Từ vựng theo HSK 1–7 (`learned`, `inBank`, `total`, `percent`) và theo tag                                                                                                                 |
| `GET /progress/grammar`                    | Ngữ pháp theo HSK (tag “HSK n”) và theo tag                                                                                                                                                |
| `GET\|PUT /progress/goals`                 | Mục tiêu `{ minutes_day (5–600), lessons_week (1–50), vocab_month (1–2000) }`; khoá lạ / ngoài giới hạn → `400`                                                                            |
| `POST /progress/ping`                      | Nhịp đếm thời gian học (web gửi mỗi 60 giây khi đang mở trang). Cộng tối đa 60 giây mỗi nhịp, nghỉ > 2 phút không cộng                                                                     |
| `POST /progress/activity`                  | Ghi hoạt động làm ở máy khách (hiện chỉ `pronunciation`): `{ kind, title, correct?, total?, durationSec? }` → `201`                                                                        |
| `GET /search?q=&limit=`                    | Tìm chung: `{ vocab, grammar, sentences, lessons, radicals, total }`                                                                                                                       |

Các hoạt động khác (ôn từ, ôn câu, bài học, luyện nghe, thêm từ / ngữ pháp) được server tự ghi khi gọi API tương ứng.

## Quản trị `/api/v1/admin` (chỉ admin)

Người dùng thường → `403`. Không trả mật khẩu hay nội dung học của người dùng (chỉ số lượng).

| Route                       | Việc                                                                                                                                   |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /admin/stats`          | `{ totalUsers, admins, disabled, newUsers7d, activeUsers7d, content: { vocab, sentences, grammar, listening } }`                       |
| `GET /admin/users?q=&page=` | Danh sách người dùng (tìm theo tên / email, 20 người / trang): `id, name, email, role, disabledAt, createdAt, lastLoginAt, vocabCount` |
| `GET /admin/users/{id}`     | Hồ sơ (`emailVerified`, `locale`…) + `counts: { vocab, sentences, grammar, listening }`                                                |

## Ôn tập `/api/v1/review`

| Route                                 | Việc                                                                                  |
| ------------------------------------- | ------------------------------------------------------------------------------------- |
| `GET /review/pool?tags=a,b`           | Số từ có thể ôn theo tag (bỏ trống = mọi từ) → `{ count }`                            |
| `GET /review/due-count`               | Số thẻ đến hạn → `{ count }`                                                          |
| `GET /review/last-config`             | Thiết lập ôn tự chọn gần nhất (hoặc `null`)                                           |
| `POST /review/sessions`               | Tạo bài (bỏ bài đang dở nếu có) → `201` phiên. Không có từ / thẻ để ôn → `409`        |
| `GET /review/sessions/active`         | Bài đang làm (hoặc `null`)                                                            |
| `DELETE /review/sessions/active`      | Bỏ bài đang làm → `{ abandoned: true }`                                               |
| `GET /review/sessions/last-result`    | Kết quả bài đã nộp gần nhất (hoặc `null`), có `wrongVocabIds`                         |
| `POST /review/sessions/{id}/answer`   | `{ index, answer }` → phiên đã chấm                                                   |
| `POST /review/sessions/{id}/rate`     | Chỉ bài đến hạn, câu đúng: `{ index, rating: 2 (Khó) \| 3 (Được) \| 4 (Dễ) }` → phiên |
| `POST /review/sessions/{id}/move`     | `{ index }` → `{ index }` thực tế (không vượt quá câu chưa làm đầu tiên)              |
| `POST /review/sessions/{id}/complete` | Nộp bài (phải làm hết, nếu chưa → `400`) → kết quả                                    |

Tạo bài:

```json
{ "kind": "custom", "count": 10, "mode": "meaning", "tags": ["HSK1"] }
{ "kind": "due", "mode": "mixed" }
```

`mode`: `meaning` (cho chữ Hán + pinyin, đoán nghĩa) · `hanzi` (cho nghĩa + pinyin, viết chữ Hán) · `pinyin` (cho chữ Hán + nghĩa,
viết pinyin) · `mixed`. Bài tự chọn có thể thay `tags` bằng `vocabIds` (danh sách id từ) và thêm `label`.

Phiên trả về **không chứa đáp án** của câu chưa làm; câu đã trả lời có thêm `reveal` (từ đầy đủ, từ khác khớp câu trả lời, đánh giá):

```json
{
  "id": "…",
  "kind": "due",
  "status": "active",
  "total": 1,
  "currentIndex": 0,
  "correctCount": 0,
  "wrongCount": 0,
  "config": { "tags": [], "count": 1, "mode": "meaning", "showImage": true, "label": "Thẻ đến hạn hôm nay" },
  "questions": [
    {
      "promptType": "meaning",
      "prompt": { "hanzi": "他", "pinyin": "tā", "imageId": null },
      "answered": false,
      "userAnswer": null,
      "isCorrect": null
    }
  ]
}
```

Luồng một bài: `POST /review/sessions` → với mỗi câu `POST …/answer` (bài đến hạn: câu đúng có thể `POST …/rate`) →
`POST …/complete`.
