import { Link } from "react-router";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-8xl font-bold">404</h1>

      <h2 className="mt-4 text-3xl font-semibold text-gray-800">
        Không tìm thấy trang
      </h2>

      <p className="mt-2 max-w-md text-gray-600">
        Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
      </p>

      <Link
        to="/"
        className="mt-6 rounded-lg bg-primary px-6 py-3 font-medium text-white transition "
      >
        Quay về trang chủ
      </Link>
    </div>
  );
}
