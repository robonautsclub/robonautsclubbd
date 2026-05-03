import Link from 'next/link'

type FailPageProps = {
  searchParams: Promise<{
    error?: string
  }>
}

export default async function BkashFailPage({ searchParams }: FailPageProps) {
  const params = await searchParams
  const error = params.error || 'Payment failed. Please try again.'

  return (
    <main className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl rounded-2xl border-2 border-red-200 bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-red-700 mb-3">Payment Failed</h1>
        <p className="text-gray-700 mb-2">
          We could not complete your payment, so your registration was not created.
        </p>
        <p className="text-sm text-gray-500 mb-6">{error}</p>
        <Link
          href="/events"
          className="inline-flex items-center rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
        >
          Retry from Events
        </Link>
      </div>
    </main>
  )
}
