type BkashConfig = {
  baseUrl: string
  appKey: string
  appSecret: string
  username: string
  password: string
}

type BkashTokenResponse = {
  id_token?: string
  statusCode?: string
  statusMessage?: string
  message?: string
}

type BkashCreatePaymentResponse = {
  paymentID?: string
  bkashURL?: string
  statusCode?: string
  statusMessage?: string
  message?: string
}

type BkashExecutePaymentResponse = {
  paymentID?: string
  trxID?: string
  transactionStatus?: string
  amount?: string
  statusCode?: string
  statusMessage?: string
  message?: string
}

export type BkashCreateCheckoutPayload = {
  amount: number
  payerReference: string
  callbackUrl: string
  merchantInvoiceNumber: string
}

export type BkashCreateCheckoutResult = {
  paymentId: string
  checkoutUrl: string
}

export type BkashExecuteResult = {
  paymentId: string
  trxId: string
  transactionStatus: string
  amount: number
  raw: BkashExecutePaymentResponse
}

function getBkashConfig(): BkashConfig {
  const appKey = process.env.BKASH_CHECKOUT_URL_APP_KEY?.trim() ?? ''
  const appSecret = process.env.BKASH_CHECKOUT_URL_APP_SECRET?.trim() ?? ''
  const username = process.env.BKASH_CHECKOUT_URL_USER_NAME?.trim() ?? ''
  const password = process.env.BKASH_CHECKOUT_URL_PASSWORD?.trim() ?? ''
  const baseUrl = (
    process.env.BKASH_CHECKOUT_URL_BASE?.trim() ||
    'https://tokenized.sandbox.bka.sh/v1.2.0-beta'
  ).replace(/\/$/, '')

  if (!appKey || !appSecret || !username || !password) {
    throw new Error('bKash credentials are not fully configured in environment variables.')
  }

  return { baseUrl, appKey, appSecret, username, password }
}

function getErrorMessage(
  context: string,
  payload: { statusCode?: string; statusMessage?: string; message?: string }
): string {
  return (
    payload.message ||
    payload.statusMessage ||
    (payload.statusCode ? `${context} failed with status ${payload.statusCode}` : `${context} failed`)
  )
}

async function parseJsonSafe<T>(response: Response): Promise<T> {
  const text = await response.text()
  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error(`bKash returned invalid JSON: ${text || '<empty>'}`)
  }
}

export async function bkashGrantToken(): Promise<string> {
  const config = getBkashConfig()

  const response = await fetch(`${config.baseUrl}/tokenized/checkout/token/grant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      username: config.username,
      password: config.password,
    },
    body: JSON.stringify({
      app_key: config.appKey,
      app_secret: config.appSecret,
    }),
    cache: 'no-store',
  })

  const data = await parseJsonSafe<BkashTokenResponse>(response)
  if (!response.ok || !data.id_token || (data.statusCode && data.statusCode !== '0000')) {
    throw new Error(getErrorMessage('bKash token grant', data))
  }

  return data.id_token
}

export async function bkashCreateCheckout(
  payload: BkashCreateCheckoutPayload
): Promise<BkashCreateCheckoutResult> {
  const config = getBkashConfig()
  const token = await bkashGrantToken()

  const response = await fetch(`${config.baseUrl}/tokenized/checkout/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      authorization: token,
      'x-app-key': config.appKey,
    },
    body: JSON.stringify({
      mode: '0011',
      payerReference: payload.payerReference,
      callbackURL: payload.callbackUrl,
      amount: payload.amount.toFixed(2),
      currency: 'BDT',
      intent: 'sale',
      merchantInvoiceNumber: payload.merchantInvoiceNumber,
    }),
    cache: 'no-store',
  })

  const data = await parseJsonSafe<BkashCreatePaymentResponse>(response)
  if (!response.ok || !data.paymentID || !data.bkashURL || (data.statusCode && data.statusCode !== '0000')) {
    throw new Error(getErrorMessage('bKash create payment', data))
  }

  return {
    paymentId: data.paymentID,
    checkoutUrl: data.bkashURL,
  }
}

export async function bkashExecutePayment(paymentId: string): Promise<BkashExecuteResult> {
  const config = getBkashConfig()
  const token = await bkashGrantToken()

  const response = await fetch(`${config.baseUrl}/tokenized/checkout/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      authorization: token,
      'x-app-key': config.appKey,
    },
    body: JSON.stringify({ paymentID: paymentId }),
    cache: 'no-store',
  })

  const data = await parseJsonSafe<BkashExecutePaymentResponse>(response)
  if (!response.ok || (data.statusCode && data.statusCode !== '0000') || !data.paymentID || !data.trxID) {
    throw new Error(getErrorMessage('bKash execute payment', data))
  }

  return {
    paymentId: data.paymentID,
    trxId: data.trxID,
    transactionStatus: data.transactionStatus || 'Unknown',
    amount: Number(data.amount || 0),
    raw: data,
  }
}
