"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="grid min-h-dvh place-items-center p-6 text-center">
      <div className="max-w-md">
        <p className="text-red text-sm font-semibold">Lỗi 500</p>
        <h1 className="text-navy mt-1 text-2xl font-bold">Đã có lỗi xảy ra</h1>
        <p className="text-text-2 mt-2">Xin lỗi, hệ thống gặp sự cố khi hiển thị trang này. Bạn thử lại nhé.</p>
        {error.digest ? <p className="text-text-3 mt-2 text-xs">Mã lỗi: {error.digest}</p> : null}
        <button
          onClick={reset}
          className="bg-blue shadow-cta mt-6 inline-flex h-11 items-center rounded-md px-5 font-semibold text-white hover:bg-blue-600"
        >
          Thử lại
        </button>
      </div>
    </main>
  );
}
