import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

type SuccessPageProps = {
  searchParams: Promise<{
    bookingId?: string
    registrationDocId?: string
    registrationId?: string
    source?: string
  }>
}

export default async function BkashSuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams
  const bookingId = params.bookingId || ''
  const registrationId = params.registrationId || ''
  const isRobofest = params.source === 'robofest'

  return (
    <main className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-2xl border-2 border-green-200 shadow-lg">
        <CardContent className="p-8">
          <h1 className="text-2xl font-bold text-green-700 mb-3">Payment Successful</h1>
          <Alert className="mb-4 border-green-200 bg-green-50">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertTitle className="text-green-900">
              Registration Confirmed
            </AlertTitle>
            <AlertDescription className="text-green-800 space-y-2">
              {isRobofest ? (
                <>
                  <p>
                    Your payment is completed and your registration for RoboFest
                    Bangladesh 2026 is officially confirmed. A confirmation
                    E-Mail has been sent to all Team Members with your Team
                    details, along with a PDF containing information about your
                    registration.
                  </p>
                  <p className="font-medium text-green-900">
                    You can safely leave this page once you have noted your
                    Registration ID below.
                  </p>
                </>
              ) : (
                <p>
                  Your payment is completed and your event registration is now
                  confirmed. A confirmation email has been sent to your email
                  address with all details.
                </p>
              )}
            </AlertDescription>
          </Alert>
          {registrationId ? (
            <p className="text-sm text-gray-500 mb-2">
              Registration ID: <span className="font-mono font-semibold">{registrationId}</span>
            </p>
          ) : null}
          {bookingId && !isRobofest ? (
            <p className="text-sm text-gray-500 mb-6">Booking ID: {bookingId}</p>
          ) : (
            <div className="mb-6" />
          )}
          <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Link href={isRobofest ? '/robofest' : '/events'} prefetch={false}>
              {isRobofest ? 'Back to Robofest' : 'Back to Events'}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
