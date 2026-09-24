"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="grid min-h-dvh place-items-center p-6 text-center">
      <div className="max-w-md">
        <p className="text-sm font-semibold text-red">Lỗi 500</p>
        <h1 className="mt-1 text-2xl font-bold text-navy">Đã có lỗi xảy ra</h1>
        <p className="mt-2 text-text-2">Xin lỗi, hệ thống gặp sự cố khi hiển thị trang này. Bạn thử lại nhé.</p>
        {error.digest ? <p className="mt-2 text-xs text-text-3">Mã lỗi: {error.digest}</p> : null}
        <button
          onClick={reset}
          className="mt-6 inline-flex h-11 items-center rounded-md bg-blue px-5 font-semibold text-white shadow-cta hover:bg-blue-600"
        >
          Thử lại
        </button>
      </div>
    </main>
  );
}
