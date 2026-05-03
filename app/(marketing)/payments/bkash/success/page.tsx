import Link from 'next/link'

type SuccessPageProps = {
  searchParams: Promise<{
    bookingId?: string
  }>
}

export default async function BkashSuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams
  const bookingId = params.bookingId || ''

  return (
    <main className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl rounded-2xl border-2 border-green-200 bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-green-700 mb-3">Payment Successful</h1>
        <p className="text-gray-700 mb-3">
          Your payment is completed and your event registration is now confirmed.
        </p>
        <p className="text-gray-700 mb-6">
          A confirmation email has been sent to your email address with all details.
        </p>
        {bookingId ? (
          <p className="text-sm text-gray-500 mb-6">Booking ID: {bookingId}</p>
        ) : null}
        <Link
          href="/events"
          prefetch={false}
          className="inline-flex items-center rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
        >
          Back to Events
        </Link>
      </div>
    </main>
  )
}
