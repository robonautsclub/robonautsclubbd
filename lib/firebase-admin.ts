import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getAuth, Auth } from 'firebase-admin/auth'
import { getFirestore, Firestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import type { Storage } from 'firebase-admin/storage'

// Firebase Admin configuration (env-only for serverless/Workers compatibility)
let adminApp: App | undefined
let adminAuth: Auth | undefined
let adminDb: Firestore | undefined
let adminStorage: Storage | undefined

// Load service account from environment variables only
let serviceAccount: {
  projectId: string
  clientEmail: string
  privateKey: string
} | null = null

const hasEnvCredentials = 
  process.env.FIREBASE_ADMIN_PRIVATE_KEY &&
  process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
  process.env.FIREBASE_ADMIN_PROJECT_ID

if (hasEnvCredentials) {
  // Normalize private key: env may have literal \n or real newlines; PEM must use \n
  const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY!.trim()
  const privateKey = rawKey
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim()
  serviceAccount = {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
    privateKey,
  }
  console.log('Firebase Admin SDK: Loaded from environment variables')
} else {
  console.warn('Firebase Admin SDK: Missing FIREBASE_ADMIN_* environment variables')
}

// Initialize Firebase Admin if credentials are available
if (serviceAccount) {
  try {
    // Check if already initialized
    if (getApps().length === 0) {
      adminApp = initializeApp({
        credential: cert({
          projectId: serviceAccount.projectId,
          clientEmail: serviceAccount.clientEmail,
          privateKey: serviceAccount.privateKey,
        }),
      })
      console.log('Firebase Admin SDK initialized successfully')
    } else {
      adminApp = getApps()[0]
    }

    adminAuth = getAuth(adminApp)
    adminDb = getFirestore(adminApp)
    adminStorage = getStorage(adminApp)
  } catch (error) {
    console.error('Firebase Admin initialization error:', error)
    // Don't throw - allow app to continue without Admin SDK
  }
} else {
  console.warn('Firebase Admin credentials not found. Admin SDK features will be unavailable.')
  console.warn('Please provide FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY.')
}

export { adminAuth, adminDb, adminStorage }
export default adminApp

