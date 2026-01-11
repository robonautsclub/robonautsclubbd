# Firestore Security Rules Setup

## Issue
The application is getting "Missing or insufficient permissions" errors because Firestore security rules are not configured or are too restrictive.

## Solution

### Step 1: Deploy Firestore Security Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Rules**
4. Copy the contents of `firestore.rules` file in this project
5. Paste it into the Firebase Console rules editor
6. Click **Publish** to deploy the rules

### Step 2: Rules Explanation

The provided rules allow:

#### Events Collection
- **Read**: Public access (anyone can read events for public pages)
- **Write**: Only authenticated users can create/update/delete events

#### Bookings Collection
- **Read**: Public access (for verification pages)
- **Create**: Public access (for booking forms)
- **Update/Delete**: Only authenticated users (for dashboard management)

#### Courses Collection
- **Read**: Public access to non-archived courses, authenticated users can read all
- **Write**: Only authenticated users can create/update/delete courses

### Step 3: Verify Rules

After deploying, test the application:
- Public pages should be able to read events
- Booking forms should be able to create bookings
- Dashboard should be able to manage all collections

### Alternative: Temporary Development Rules (NOT FOR PRODUCTION)

If you need to test quickly during development, you can use these permissive rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**⚠️ WARNING**: These rules allow anyone to read and write to your database. Only use for development and testing. Never deploy to production.

### Production Recommendations

For production, consider:
1. Adding more specific rules based on user roles
2. Adding validation for data structure
3. Implementing rate limiting
4. Adding audit logging

## Troubleshooting

If you still see permission errors after deploying rules:

1. **Check Firebase Console**: Verify rules are published
2. **Check Browser Console**: Look for specific error codes
3. **Verify Authentication**: Ensure users are authenticated when required
4. **Check Collection Names**: Ensure collection names match exactly (case-sensitive)

## Related Files

- `firestore.rules` - Security rules file
- `hooks/useRealtimeEvents.ts` - Client-side Firestore queries
- `lib/firebase.ts` - Firebase client initialization
- `lib/firebase-admin.ts` - Firebase Admin SDK (bypasses rules)
