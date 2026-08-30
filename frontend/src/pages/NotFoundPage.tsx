import { Link } from "react-router";
import { useTranslation } from "react-i18next";

export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-8xl font-bold">{t("notFound.title")}</h1>

      <h2 className="mt-4 text-3xl font-semibold text-gray-800">
        {t("notFound.heading")}
      </h2>

      <p className="mt-2 max-w-md text-gray-600">
        {t("notFound.message")}
      </p>

      <Link
        to="/"
        className="mt-6 rounded-lg bg-primary px-6 py-3 font-medium text-white transition "
      >
        {t("notFound.backHome")}
      </Link>
    </div>
  );
}
