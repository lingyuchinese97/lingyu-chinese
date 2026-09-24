"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="vi">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "grid",
          placeItems: "center",
          minHeight: "100vh",
          margin: 0,
          background: "#F6FBFF",
          color: "#0E1F3F",
        }}
      >
        <div style={{ textAlign: "center", padding: 24 }}>
          <h1 style={{ color: "#073B8C" }}>Đã có lỗi xảy ra</h1>
          <p>Hệ thống gặp sự cố. Vui lòng tải lại trang.</p>
          <button
            onClick={reset}
            style={{
              marginTop: 16,
              height: 44,
              padding: "0 20px",
              borderRadius: 12,
              border: 0,
              background: "#1595F5",
              color: "#fff",
              fontWeight: 600,
            }}
          >
            Thử lại
          </button>
        </div>
      </body>
    </html>
  );
}
