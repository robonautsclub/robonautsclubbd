import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center bg-brand-light">
      <div className="max-w-lg py-12">
        <div className="text-8xl font-bold text-brand-red mb-6 select-none">
          404
        </div>
        <h1 className="text-3xl font-semibold mb-2 text-brand-dark">
          Page Not Found
        </h1>
        <p className="mb-8 text-gray-700">
          Sorry, we couldn&apos;t find the page you were looking for. <br />
          It may have been moved or does not exist.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg px-6 py-3 bg-brand-blue text-white font-semibold hover:bg-indigo-700 transition-colors duration-200 no-underline"
        >
          Go back home
        </Link>
      </div>
    </main>
  );
}
