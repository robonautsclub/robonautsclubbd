import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'

// Validate required Firebase environment variables
const requiredEnvVars = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Check for missing or incomplete environment variables
const missingVars: string[] = []
const envVarMap: Record<string, string> = {
  apiKey: 'NEXT_PUBLIC_FIREBASE_API_KEY',
  authDomain: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  projectId: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  storageBucket: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'NEXT_PUBLIC_FIREBASE_APP_ID',
}

Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value || value.trim() === '' || value.length < 5) {
    missingVars.push(envVarMap[key] || `NEXT_PUBLIC_FIREBASE_${key.toUpperCase()}`)
  }
})

if (missingVars.length > 0) {
  console.error('Missing or incomplete Firebase environment variables:', missingVars.join(', '))
  console.error('Please check your .env.local file and ensure all Firebase config values are complete.')
}

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: requiredEnvVars.apiKey || '',
  authDomain: requiredEnvVars.authDomain || '',
  projectId: requiredEnvVars.projectId || '',
  storageBucket: requiredEnvVars.storageBucket || '',
  messagingSenderId: requiredEnvVars.messagingSenderId || '',
  appId: requiredEnvVars.appId || '',
}

// Initialize Firebase (singleton pattern)
let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null

try {
  if (getApps().length === 0) {
    // Only initialize if we have the minimum required config
    if (firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId) {
      app = initializeApp(firebaseConfig)
    } else {
      console.error('Firebase initialization skipped: Missing required configuration values')
    }
  } else {
    app = getApps()[0]
  }

  // Only create auth and firestore instances if app is initialized
  if (app) {
    auth = getAuth(app)
    db = getFirestore(app)
  }
} catch (error) {
  console.error('Firebase initialization error:', error)
  console.error('Please verify your Firebase configuration in .env.local')
}

// Export auth and firestore instances (may be null if initialization failed)
export { auth, db }
export default app

