# REST API `/api/v1`

API cho app điện thoại / app khác. Dùng chung logic (service) với giao diện web nên kết quả giống hệt.

**Swagger**: https://lingyuchinese.com/api-docs (xem và gọi thử từng route) · OpenAPI 3.1: https://lingyuchinese.com/api/openapi.json

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
