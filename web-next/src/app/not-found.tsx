import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center p-6 text-center">
      <div className="max-w-md">
        <Image
          src="/brand/lingyu-mascot.png"
          alt=""
          width={220}
          height={147}
          className="mx-auto h-auto w-44"
          priority
        />
        <p className="mt-4 text-sm font-semibold text-blue-600">Lỗi 404</p>
        <h1 className="text-navy mt-1 text-2xl font-bold">Không tìm thấy trang</h1>
        <p className="text-text-2 mt-2">Trang bạn tìm không tồn tại hoặc đã được chuyển đi.</p>
        <Link
          href="/"
          className="bg-blue shadow-cta mt-6 inline-flex h-11 items-center rounded-md px-5 font-semibold text-white hover:bg-blue-600"
        >
          Về trang chủ
        </Link>
      </div>
    </main>
  );
}
