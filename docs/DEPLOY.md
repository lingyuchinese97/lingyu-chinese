# Triển khai LingYu Chinese (bản Next.js — `web-next/`)

Tài liệu này dành cho người **không rành DevOps**: làm lần lượt từng bước, lệnh có thể copy-paste.

- **Cách 1 — Miễn phí: Vercel + Neon** (đang dùng cho `app.lingyuchinese.com`). Không cần máy chủ, không cần thẻ.
- **Cách 2 — VPS** (máy chủ riêng, Docker): chuyển sang bất cứ lúc nào, dữ liệu mang theo được.

> Không bao giờ dán mật khẩu, connection string hay secret vào chat / issue / commit. Chỉ nhập vào trang cài đặt của Vercel/Neon
> hoặc file `.env` trên máy chủ.

---

## 0. Chuẩn bị chung

| Biến                  | Ý nghĩa                                                                      | Ví dụ                                 |
| --------------------- | ---------------------------------------------------------------------------- | ------------------------------------- |
| `DATABASE_URL`        | Kết nối Postgres                                                             | `postgres://…/neondb?sslmode=require` |
| `DATABASE_POOL_MAX`   | Số kết nối tối đa mỗi instance (Neon Free: để `5`)                           | `5`                                   |
| `BETTER_AUTH_SECRET`  | Khoá ký cookie đăng nhập, ≥ 32 ký tự. **Đổi khoá = mọi người bị đăng xuất.** | tạo bằng `openssl rand -base64 32`    |
| `BETTER_AUTH_URL`     | Địa chỉ gốc của web, **https**, không có `/` cuối                            | `https://app.lingyuchinese.com`       |
| `NEXT_PUBLIC_APP_URL` | Giống `BETTER_AUTH_URL`                                                      | `https://app.lingyuchinese.com`       |
| `ADMIN_EMAILS`        | Email được tự cấp quyền quản trị (nhiều email cách nhau bằng dấu phẩy)       | `ban@gmail.com`                       |
| `LOG_LEVEL`           | Mức log                                                                      | `info`                                |

Tạo `BETTER_AUTH_SECRET` (máy Mac/Linux, hoặc Git Bash trên Windows):

```bash
openssl rand -base64 32
```

Không có `openssl`: mở https://generate-secret.vercel.app/32 và copy chuỗi hiện ra.

---

## 1. Miễn phí: Vercel Hobby + Neon Free

### 1.1 Tạo database trên Neon

1. Vào https://neon.com → **Sign up** (đăng nhập bằng GitHub cho nhanh).
2. **Create project**: tên `lingyu`, Postgres 16/17, **Region: AWS Asia Pacific (Singapore)** (gần Việt Nam nhất).
3. Ở trang project → **Connect** → bật **Connection pooling** → copy chuỗi dạng
   `postgresql://neondb_owner:…@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`
   (host có chữ **`-pooler`**). Đây là `DATABASE_URL`.

> Lỡ để lộ chuỗi này (chụp màn hình, gửi chat…): Neon → **Roles** → `neondb_owner` → **Reset password**, rồi cập nhật lại
> `DATABASE_URL` trên Vercel.

### 1.2 Tạo project trên Vercel

1. Vào https://vercel.com → **Sign up with GitHub**.
2. **Add New… → Project** → chọn repo `lingyu-chinese` → **Import**.
3. **Root Directory**: bấm **Edit** → chọn `web-next`. (File `web-next/vercel.json` đã cố định Framework = Next.js và
   build command `pnpm db:migrate && pnpm build` — migration tự chạy mỗi lần deploy.)
4. **Environment Variables**: thêm các biến ở mục 0 (`DATABASE_URL`, `DATABASE_POOL_MAX=5`, `BETTER_AUTH_SECRET`,
   `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`, `ADMIN_EMAILS`). Lần đầu chưa có tên miền thì tạm để
   `BETTER_AUTH_URL=https://<tên-project>.vercel.app`.
5. **Deploy**. Xong mở `https://<tên-project>.vercel.app/api/health` → thấy `{"status":"ok",…}` là chạy.
6. Đăng ký tài khoản bằng email có trong `ADMIN_EMAILS` → menu có thêm mục **Quản trị**.

Sau đó mỗi lần gộp (merge) vào `main`, Vercel tự build và deploy lại. Pull request có bản xem trước (Preview) riêng.

### 1.3 Gắn tên miền riêng (Cloudflare)

Ví dụ dùng `app.lingyuchinese.com` (đang chạy) — hoặc chính `lingyuchinese.com` (xem mục 3).

1. Vercel → project → **Settings → Domains** → **Add** → nhập tên miền → Vercel hiện bản ghi DNS cần tạo.
2. Cloudflare → tên miền → **DNS → Records → Add record**:
   - Tên miền con (`app`): **Type `CNAME`**, **Name `app`**, **Target** = giá trị Vercel đưa (vd `cname.vercel-dns.com`).
   - Tên miền gốc (`@`): **Type `A`**, **Name `@`**, **IPv4** = địa chỉ IP Vercel đưa (vd `76.76.21.21`).
   - **Proxy status: DNS only** (đám mây **xám**) — để Vercel tự cấp HTTPS.
3. Đợi vài phút, Vercel báo **Valid Configuration**.
4. Sửa `BETTER_AUTH_URL` và `NEXT_PUBLIC_APP_URL` thành `https://<tên-miền>` → **Deployments → ⋯ → Redeploy**.

> Luôn mở web bằng **https://**. Mở bằng `http://` sẽ bị chặn đăng nhập ("Yêu cầu không hợp lệ") vì sai địa chỉ gốc.

### 1.4 Giới hạn của gói miễn phí

- **Vercel Hobby**: chỉ cho dự án **phi thương mại** (cá nhân). Nếu thu tiền học viên, chuyển sang gói Pro hoặc VPS (mục 2).
- **Neon Free**: giới hạn **dung lượng lưu trữ** và **giờ tính toán (compute) mỗi tháng**; database tự "ngủ" khi không dùng
  (lần mở đầu tiên sau khi ngủ chậm ~1 giây). Xem con số hiện hành tại https://neon.com/pricing (mục _Free_) — trang này thay đổi
  theo thời gian nên không ghi cứng ở đây.
- Ảnh từ vựng được nén ở trình duyệt (WebP, ≤ 1024px, thường ≤ 300KB) và lưu trong database → ảnh là thứ tốn dung lượng nhất.
  Xem dung lượng đang dùng: Neon → project → **Monitoring / Storage**.
- **Sao lưu định kỳ** về máy (Neon Free chỉ giữ lịch sử khôi phục ngắn):

  ```bash
  # Cài công cụ Postgres (Mac: brew install libpq; Ubuntu: sudo apt install postgresql-client)
  # Dùng connection string KHÔNG có "-pooler" cho pg_dump (Neon → Connect → tắt Connection pooling).
  pg_dump "postgresql://…@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require" -Fc --no-owner -f lingyu-$(date +%F).dump
  ```

  Người dùng cũng tự xuất được dữ liệu của mình: **Cài đặt → Xuất dữ liệu** (file JSON, kèm ảnh).

---

## 2. VPS (Docker + Caddy, HTTPS tự động)

Cần: 1 VPS Ubuntu 22.04/24.04 (≥ 1GB RAM, khuyên 2GB), tên miền trỏ về IP của VPS.

### 2.1 Cài Docker

```bash
ssh root@<IP-VPS>
curl -fsSL https://get.docker.com | sh
docker --version && docker compose version
```

### 2.2 Lấy code và tạo `.env`

```bash
mkdir -p /opt/lingyu && cd /opt/lingyu
git clone https://github.com/lingyuchinese97/lingyu-chinese.git .
cd web-next
cp .env.example .env
nano .env
```

Điền trong `.env` (xoá dấu `#` ở các dòng VPS):

```dotenv
BETTER_AUTH_SECRET=<openssl rand -base64 32>
BETTER_AUTH_URL=https://lingyuchinese.com
NEXT_PUBLIC_APP_URL=https://lingyuchinese.com
ADMIN_EMAILS=ban@gmail.com
DOMAIN=lingyuchinese.com
POSTGRES_PASSWORD=<openssl rand -base64 24>
```

(`DATABASE_URL` không cần điền — `docker-compose.prod.yml` tự ghép tới container Postgres.)

### 2.3 Trỏ DNS và chạy

1. Cloudflare → DNS: bản ghi **A** `@` → IP VPS, **A** `www` → IP VPS, **DNS only** (đám mây xám).
2. Mở cổng 80, 443 (nếu có tường lửa): `ufw allow 80,443/tcp && ufw allow 443/udp`.
3. Chạy:

   ```bash
   cd /opt/lingyu/web-next
   docker compose -f docker-compose.prod.yml up -d --build
   docker compose -f docker-compose.prod.yml ps        # app "healthy", caddy "running"
   curl -s https://lingyuchinese.com/api/health         # {"status":"ok",...}
   ```

   Container app tự chạy migration trước khi khởi động. Caddy tự xin chứng chỉ HTTPS (Let's Encrypt).

### 2.4 Vận hành

```bash
cd /opt/lingyu/web-next
# Xem log
docker compose -f docker-compose.prod.yml logs -f app
# Cập nhật phiên bản mới
git pull && docker compose -f docker-compose.prod.yml up -d --build
# Rollback về bản trước (xem mã commit bằng: git log --oneline)
git checkout <mã-commit> && docker compose -f docker-compose.prod.yml up -d --build
```

Quên mật khẩu admin (không vào được trang Quản trị): chạy trên máy có code + `DATABASE_URL` trỏ đúng DB:

```bash
cd web-next && pnpm install
DATABASE_URL="<url>" pnpm user:reset-password ban@gmail.com   # in mật khẩu tạm 1 lần
DATABASE_URL="<url>" pnpm user:make-admin ban@gmail.com
```

### 2.5 Sao lưu hằng ngày + thử khôi phục

```bash
cd /opt/lingyu/web-next
./scripts/backup.sh                         # tạo backups/lingyu-YYYYMMDD-HHMMSS.dump, giữ 14 bản mới nhất
crontab -e                                  # thêm dòng dưới để chạy 3 giờ sáng mỗi ngày
0 3 * * * cd /opt/lingyu/web-next && ./scripts/backup.sh >> /var/log/lingyu-backup.log 2>&1
```

Copy bản sao lưu ra **ngoài VPS** (VPS hỏng thì vẫn còn), ví dụ về máy mình:

```bash
scp root@<IP-VPS>:/opt/lingyu/web-next/backups/lingyu-*.dump ./
```

**Thử khôi phục** (nên làm 1 lần sau khi cài, để chắc bản sao lưu dùng được) — khôi phục vào một DB tạm, không đụng DB thật:

```bash
cd /opt/lingyu/web-next
C="docker compose -f docker-compose.prod.yml"
$C exec -T postgres createdb -U lingyu lingyu_restore_test
$C exec -T postgres pg_restore -U lingyu -d lingyu_restore_test --no-owner < backups/<file>.dump
$C exec -T postgres psql -U lingyu -d lingyu_restore_test -c 'select count(*) from "user"; select count(*) from vocab;'
$C exec -T postgres dropdb -U lingyu lingyu_restore_test
```

Khôi phục thật (mất dữ liệu mới hơn bản sao lưu!):

```bash
$C stop app
$C exec -T postgres pg_restore -U lingyu -d lingyu --clean --if-exists --no-owner < backups/<file>.dump
$C start app
```

### 2.6 Chuyển dữ liệu từ Neon sang VPS

```bash
# 1) Trên máy có pg_dump: sao lưu Neon (connection string KHÔNG có "-pooler")
pg_dump "postgresql://…@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require" -Fc --no-owner -f neon.dump
# Đếm số bản ghi để so sánh sau
psql "<url-neon>" -c 'select (select count(*) from "user") users, (select count(*) from vocab) vocab, (select count(*) from image) images, (select count(*) from grammar) grammar;'

# 2) Chép lên VPS và khôi phục (VPS đã chạy mục 2.3)
scp neon.dump root@<IP-VPS>:/opt/lingyu/web-next/
ssh root@<IP-VPS>
cd /opt/lingyu/web-next && C="docker compose -f docker-compose.prod.yml"
$C stop app
$C exec -T postgres pg_restore -U lingyu -d lingyu --clean --if-exists --no-owner < neon.dump
$C start app

# 3) Kiểm tra số bản ghi khớp với bước 1
$C exec -T postgres psql -U lingyu -d lingyu -c 'select (select count(*) from "user") users, (select count(*) from vocab) vocab, (select count(*) from image) images, (select count(*) from grammar) grammar;'
```

Ảnh nằm trong database nên đi theo luôn. Giữ nguyên `BETTER_AUTH_SECRET` cũ nếu không muốn mọi người phải đăng nhập lại.
Cuối cùng đổi `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL` (nếu đổi tên miền) và DNS.

---

## 3. Chuyển `lingyuchinese.com` từ trang cũ (GitHub Pages) sang bản mới

Trang cũ (thư mục `web/`) đang chạy trên GitHub Pages; bản mới ở `app.lingyuchinese.com`.

**Checklist trước khi đổi DNS**

- [ ] Bản mới đã chạy ổn ở `app.lingyuchinese.com` (đăng ký, đăng nhập, từ vựng, ôn tập, bài học, cài đặt).
- [ ] Đã xuất dữ liệu ở trang cũ: **Từ vựng → chọn tất cả → Chia sẻ → Sao chép hoặc tải file → CSV → Tải file**
      (dữ liệu trang cũ nằm trong trình duyệt từng máy — làm trên máy có dữ liệu).
- [ ] Đã nhập file CSV đó ở bản mới: **Cài đặt → Nhập dữ liệu** (ngữ pháp ở trang cũ không xuất được → nhập lại bằng tay).
- [ ] Đã có bản sao lưu database (mục 1.4 hoặc 2.5).
- [ ] Biết cách quay lại: DNS cũ của GitHub Pages (chụp màn hình bản ghi DNS hiện tại trước khi sửa).

**Các bước** (Vercel):

1. Vercel → project → **Settings → Domains** → **Add** `lingyuchinese.com` (chọn chuyển `www.lingyuchinese.com` → `lingyuchinese.com`).
2. Cloudflare → DNS: sửa bản ghi `@` (và `www`) từ GitHub Pages sang giá trị Vercel đưa (mục 1.3), **DNS only**.
3. GitHub → repo → **Settings → Pages**: xoá **Custom domain** (hoặc đổi thành `old.lingyuchinese.com` và thêm CNAME `old`
   → `lingyuchinese97.github.io` nếu muốn giữ trang cũ thêm một thời gian).
4. Vercel → Environment Variables: `BETTER_AUTH_URL` và `NEXT_PUBLIC_APP_URL` = `https://lingyuchinese.com` → **Redeploy**.
5. (Tuỳ chọn) Giữ `app.lingyuchinese.com` trong **Domains** và đặt **Redirect to** `lingyuchinese.com`.
6. Mở `https://lingyuchinese.com/api/health`, đăng nhập thử. Người đang đăng nhập ở `app.` cần đăng nhập lại một lần
   (cookie gắn theo tên miền).

Quay lại trang cũ: trả DNS về bản ghi GitHub Pages đã chụp và đặt lại Custom domain trong GitHub Pages.

---

## 4. Lộ trình sau phase đầu (chưa làm — chỉ hướng dẫn)

- **Email** (xác thực email, tự đặt lại mật khẩu): dùng dịch vụ có gói miễn phí (Resend, Brevo…) hoặc SMTP; bật
  `emailVerification` và `sendResetPassword` của Better Auth trong `src/server/auth.ts`, thêm trang "Quên mật khẩu" gửi link.
- **Đăng nhập Google**: tạo OAuth client ở Google Cloud Console, thêm `socialProviders.google` vào Better Auth
  (redirect URI `https://<tên-miền>/api/auth/callback/google`).
- **Ảnh sang S3 / Cloudflare R2**: thêm driver mới cài đặt interface `ImageStorage` (`src/server/storage/index.ts`), chọn bằng biến
  `STORAGE_DRIVER`; viết script chuyển ảnh cũ từ bảng `image` sang bucket.
- **Theo dõi lỗi**: Sentry (có gói miễn phí) hoặc GlitchTip tự host; gắn vào `src/app/global-error.tsx` và log server (pino).
