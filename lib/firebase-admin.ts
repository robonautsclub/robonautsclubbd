import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getAuth, Auth } from 'firebase-admin/auth'
import { getFirestore, Firestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import type { Storage } from 'firebase-admin/storage'
import { readFileSync } from 'fs'
import { join } from 'path'

// Firebase Admin configuration
// Supports both JSON file and environment variables
let adminApp: App | undefined
let adminAuth: Auth | undefined
let adminDb: Firestore | undefined
let adminStorage: Storage | undefined

// Try to load service account from environment variables first, then JSON file as fallback
let serviceAccount: {
  projectId: string
  clientEmail: string
  privateKey: string
} | null = null

// Priority 1: Check environment variables first
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
  // Priority 2: Fallback to JSON file if environment variables are not available
  try {
    const serviceAccountPath = join(process.cwd(), 'lib', 'firebase-service-account.json')
    const serviceAccountFile = readFileSync(serviceAccountPath, 'utf8')
    const serviceAccountData = JSON.parse(serviceAccountFile)
    
    serviceAccount = {
      projectId: serviceAccountData.project_id,
      clientEmail: serviceAccountData.client_email,
      privateKey: serviceAccountData.private_key.replace(/\\n/g, '\n'),
    }
    console.log('Firebase Admin SDK: Loaded from service account JSON file')
  } catch {
    // Neither environment variables nor JSON file available
    console.warn('Firebase Admin SDK: No credentials found in environment variables or JSON file')
  }
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
  console.warn('Please provide either:')
  console.warn('  1. lib/firebase-service-account.json file, or')
  console.warn('  2. FIREBASE_ADMIN_* environment variables')
}

export { adminAuth, adminDb, adminStorage }
export default adminApp

