import { adminDb } from '@/lib/firebase-admin'

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
  paymentId?: string
  trxID?: string
  trxId?: string
  transactionStatus?: string
  amount?: string
  statusCode?: string
  statusMessage?: string
  message?: string
}

type BkashRefundPaymentResponse = {
  paymentID?: string
  paymentId?: string
  trxID?: string
  trxId?: string
  refundTrxID?: string
  refundTrxId?: string
  transactionStatus?: string
  statusCode?: string
  statusMessage?: string
  message?: string
}

type BkashQueryPaymentResponse = {
  paymentID?: string
  paymentId?: string
  trxID?: string
  trxId?: string
  amount?: string
  transactionStatus?: string
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
  statusCode: string
  statusMessage: string
  raw: BkashExecutePaymentResponse
}

export type BkashRefundPayload = {
  paymentId: string
  trxId: string
  amount: number
  reason: string
  sku?: string
}

export type BkashRefundResult = {
  paymentId: string
  trxId: string
  refundTrxId: string
  transactionStatus: string
  statusCode: string
  statusMessage: string
  raw: BkashRefundPaymentResponse
}

const BKASH_TOKEN_COLLECTION = 'payment_gateway_tokens'
const BKASH_TOKEN_DOC_ID = 'bkash'
const BKASH_TOKEN_TTL_MS = 60 * 60 * 1000
const BKASH_TOKEN_REFRESH_BUFFER_MS = 60 * 1000
const BKASH_HTTP_TIMEOUT_MS = 30 * 1000

let memoryTokenCache: { token: string; expiresAtMs: number } | null = null

export class BkashApiError extends Error {
  statusCode?: string
  statusMessage?: string
  noResponse: boolean

  constructor(message: string, opts?: { statusCode?: string; statusMessage?: string; noResponse?: boolean }) {
    super(message)
    this.name = 'BkashApiError'
    this.statusCode = opts?.statusCode
    this.statusMessage = opts?.statusMessage
    this.noResponse = Boolean(opts?.noResponse)
  }
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

function isTokenStillValid(expiresAtMs: number): boolean {
  return expiresAtMs - BKASH_TOKEN_REFRESH_BUFFER_MS > Date.now()
}

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), BKASH_HTTP_TIMEOUT_MS)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } catch {
    throw new BkashApiError('No response from bKash execute API.', {
      noResponse: true,
      statusMessage: 'No response from bKash execute API.',
    })
  } finally {
    clearTimeout(timeout)
  }
}

async function getCachedTokenFromStorage(): Promise<string | null> {
  if (memoryTokenCache && isTokenStillValid(memoryTokenCache.expiresAtMs)) {
    return memoryTokenCache.token
  }

  if (!adminDb) return null
  const tokenRef = adminDb.collection(BKASH_TOKEN_COLLECTION).doc(BKASH_TOKEN_DOC_ID)
  const tokenDoc = await tokenRef.get()
  if (!tokenDoc.exists) return null

  const data = tokenDoc.data() as { idToken?: string; expiresAtMs?: number } | undefined
  if (!data?.idToken || !data?.expiresAtMs || !isTokenStillValid(data.expiresAtMs)) {
    return null
  }

  memoryTokenCache = { token: data.idToken, expiresAtMs: data.expiresAtMs }
  return data.idToken
}

async function cacheGrantedToken(idToken: string): Promise<void> {
  const expiresAtMs = Date.now() + BKASH_TOKEN_TTL_MS
  memoryTokenCache = { token: idToken, expiresAtMs }

  if (!adminDb) return
  await adminDb.collection(BKASH_TOKEN_COLLECTION).doc(BKASH_TOKEN_DOC_ID).set(
    {
      idToken,
      expiresAtMs,
      grantedAtMs: Date.now(),
      updatedAt: new Date(),
    },
    { merge: true }
  )
}

export async function bkashGrantToken(): Promise<string> {
  const cachedToken = await getCachedTokenFromStorage()
  if (cachedToken) return cachedToken

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
    throw new BkashApiError(getErrorMessage('bKash token grant', data), {
      statusCode: data.statusCode,
      statusMessage: data.statusMessage || data.message,
    })
  }

  await cacheGrantedToken(data.id_token)
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
    throw new BkashApiError(getErrorMessage('bKash create payment', data), {
      statusCode: data.statusCode,
      statusMessage: data.statusMessage || data.message,
    })
  }

  return {
    paymentId: data.paymentID,
    checkoutUrl: data.bkashURL,
  }
}

export async function bkashExecutePayment(paymentId: string): Promise<BkashExecuteResult> {
  const config = getBkashConfig()
  const token = await bkashGrantToken()

  const response = await fetchWithTimeout(`${config.baseUrl}/tokenized/checkout/execute`, {
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
  const resolvedPaymentId = data.paymentID || data.paymentId
  const resolvedTrxId = data.trxID || data.trxId
  const statusCode = data.statusCode || ''
  const statusMessage = data.statusMessage || data.message || 'Unknown bKash execute status'
  const transactionStatus = data.transactionStatus || 'Unknown'

  if (!response.ok || !resolvedPaymentId || !resolvedTrxId) {
    throw new BkashApiError(getErrorMessage('bKash execute payment', data), {
      statusCode,
      statusMessage,
    })
  }

  if (!(statusCode === '0000' && statusMessage === 'Successful' && transactionStatus === 'Completed')) {
    throw new BkashApiError(statusMessage, {
      statusCode,
      statusMessage,
    })
  }

  return {
    paymentId: resolvedPaymentId,
    trxId: resolvedTrxId,
    transactionStatus,
    amount: Number(data.amount || 0),
    statusCode,
    statusMessage,
    raw: data,
  }
}

export async function bkashQueryPayment(paymentId: string): Promise<BkashExecuteResult> {
  const config = getBkashConfig()
  const token = await bkashGrantToken()

  const response = await fetch(`${config.baseUrl}/tokenized/checkout/payment/status`, {
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

  const data = await parseJsonSafe<BkashQueryPaymentResponse>(response)
  const resolvedPaymentId = data.paymentID || data.paymentId
  const resolvedTrxId = data.trxID || data.trxId || ''
  if (!response.ok || (data.statusCode && data.statusCode !== '0000') || !resolvedPaymentId) {
    throw new BkashApiError(getErrorMessage('bKash query payment', data), {
      statusCode: data.statusCode,
      statusMessage: data.statusMessage || data.message,
    })
  }

  return {
    paymentId: resolvedPaymentId,
    trxId: resolvedTrxId,
    transactionStatus: data.transactionStatus || 'Unknown',
    amount: Number(data.amount || 0),
    statusCode: data.statusCode || '',
    statusMessage: data.statusMessage || data.message || '',
    raw: data as unknown as BkashExecutePaymentResponse,
  }
}

export async function bkashRefundPayment(payload: BkashRefundPayload): Promise<BkashRefundResult> {
  const config = getBkashConfig()
  const token = await bkashGrantToken()

  const response = await fetch(`${config.baseUrl}/tokenized/checkout/payment/refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      authorization: token,
      'x-app-key': config.appKey,
    },
    body: JSON.stringify({
      paymentID: payload.paymentId,
      trxID: payload.trxId,
      amount: payload.amount.toFixed(2),
      reason: payload.reason,
      sku: payload.sku || 'event-registration',
    }),
    cache: 'no-store',
  })

  const data = await parseJsonSafe<BkashRefundPaymentResponse>(response)
  const resolvedPaymentId = data.paymentID || data.paymentId
  const resolvedTrxId = data.trxID || data.trxId
  const refundTrxId = data.refundTrxID || data.refundTrxId
  const statusCode = data.statusCode || ''
  const statusMessage = data.statusMessage || data.message || 'Unknown bKash refund status'

  if (!response.ok || !resolvedPaymentId || !resolvedTrxId || !refundTrxId || statusCode !== '0000') {
    throw new BkashApiError(getErrorMessage('bKash refund payment', data), {
      statusCode,
      statusMessage,
    })
  }

  return {
    paymentId: resolvedPaymentId,
    trxId: resolvedTrxId,
    refundTrxId,
    transactionStatus: data.transactionStatus || 'Unknown',
    statusCode,
    statusMessage,
    raw: data,
  }
}
