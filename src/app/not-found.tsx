import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <div className="text-6xl font-bold text-gray-200 dark:text-gray-700 mb-4">404</div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Page not found
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="px-6 py-2.5 bg-rose-500 text-white font-medium rounded-lg hover:bg-rose-600 transition-colors"
      >
        Go home
      </Link>
    </div>
  );
}
