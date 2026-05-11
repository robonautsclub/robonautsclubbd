import Link from 'next/link'
import { XCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

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
      <Card className="w-full max-w-2xl border-2 border-red-200 shadow-lg">
        <CardContent className="p-8">
          <h1 className="text-2xl font-bold text-red-700 mb-3">Payment Failed</h1>
          <Alert variant="destructive" className="mb-6">
            <XCircle className="h-5 w-5" />
            <AlertTitle>Registration was not created</AlertTitle>
            <AlertDescription>
              We could not complete your payment. {error}
            </AlertDescription>
          </Alert>
          <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Link href="/events" prefetch={false}>
              Retry from Events
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
