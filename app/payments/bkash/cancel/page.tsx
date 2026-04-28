import Link from 'next/link'

export default function BkashCancelPage() {
  return (
    <main className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl rounded-2xl border-2 border-amber-200 bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-amber-700 mb-3">Payment Cancelled</h1>
        <p className="text-gray-700 mb-6">
          You cancelled the payment, so your registration was not created. You can try again anytime.
        </p>
        <Link
          href="/events"
          className="inline-flex items-center rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
        >
          Back to Events
        </Link>
      </div>
    </main>
  )
}
