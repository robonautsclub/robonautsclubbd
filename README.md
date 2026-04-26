# Robonauts Club - Website Documentation

A modern, full-stack web application for **Robonauts Club**, Bangladesh's premier youth robotics and STEM education platform. This Next.js-based platform enables event management, booking system, and comprehensive SEO optimization for maximum visibility in Bangladesh and worldwide.

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables & Credentials](#environment-variables--credentials)
- [Storage Solutions](#storage-solutions)
- [Project Structure](#project-structure)
- [Development](#development)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

Robonauts Club website is a comprehensive event management and booking platform that allows:
- **Event Creation & Management**: Create, edit, and delete robotics/STEM events
- **Public Event Discovery**: Browse and filter upcoming and past events
- **Booking System**: Allow users to register for events with email confirmations
- **Image Upload**: Cloudinary integration for optimized AVIF image storage
- **SEO Optimization**: Full SEO implementation for top search rankings
- **Admin Dashboard**: Secure admin interface for event management

## 🛠 Tech Stack

### Frontend
- **Next.js 16.1.1** - React framework with App Router
- **React 19.2.3** - UI library
- **TypeScript 5** - Type-safe JavaScript
- **Tailwind CSS 4** - Utility-first CSS framework
- **Lucide React** - Icon library
- **React Icons** - Additional icon sets
- **Date-fns** - Date manipulation library

### Backend & Services
- **Next.js API Routes** - Server-side API endpoints
- **Server Actions** - Next.js server-side data mutations
- **Firebase Authentication** - User authentication
- **Firebase Firestore** - Database (NoSQL)
- **Firebase Admin SDK** - Server-side Firebase operations

### Storage & Media
- **Cloudinary** - Image upload and optimization (AVIF format)
- **Firebase Storage** - Alternative image storage (if needed)

### Email Service
- **Brevo** - Transactional email service

### Additional Libraries
- **Leaflet & React Leaflet** - Interactive maps
- **XLSX** - Excel file export for bookings
- **CLSX & Tailwind Merge** - Dynamic className utilities

## ✨ Features

### Public Features
- 🏠 **Homepage**: Showcase of services and courses
- 📅 **Events Page**: Browse all events (upcoming and past)
- 📝 **Event Details**: Detailed event information with booking form
- 📧 **Email Confirmations**: Automatic booking confirmation emails
- 🔍 **SEO Optimized**: Full metadata, structured data, sitemap
- 📱 **Responsive Design**: Mobile-first, fully responsive

### Admin Features
- 🔐 **Secure Dashboard**: Protected admin routes with role-based access
- 🔑 **Role-Based Access Control (RBAC)**: Super Admin and Admin roles
- ➕ **Event Management**: Create, edit, delete events (with permission checks)
- 📚 **Course Management**: Create, edit, delete, and archive courses
- 📊 **Booking Management**: View and export event bookings
- 🖼️ **Image Upload**: Direct image upload with AVIF conversion
- 🏷️ **Tags System**: Categorize events with tags
- 📧 **Email Notifications**: Send booking confirmations
- 👤 **Profile Management**: Update display name and password
- 🔔 **Notifications System**: Real-time notifications for database changes
- 👥 **User Management** (Super Admin only): Create, edit, and delete admin users

### Role-Based Access Control

The system implements a comprehensive RBAC system with two roles:

#### Super Admin
- **Definition**: Defined via `SUPER_ADMIN_EMAILS` environment variable
- **Permissions**:
  - Full access to all events (create, update, delete any event)
  - Full access to all courses (create, update, delete, archive any course)
  - User management (create, update, delete admin users)
  - Access to Members management page
  - Can view all notifications

#### Admin
- **Definition**: Any authenticated user not in the Super Admin email list
- **Permissions**:
  - Can create events
  - Can only update/delete events they created
  - Can create courses
  - Can only update/delete/archive courses they created
  - Cannot manage users
  - Cannot access Members page
  - Can view all notifications

#### Security Features
- 🔒 **Firebase Custom Claims**: Roles stored in Firebase Custom Claims (server-side only)
- 🔒 **Automatic Role Assignment**: Roles assigned automatically on login and token refresh
- 🔒 **Firestore Security Rules**: Database-level permission enforcement
- 🔒 **Backend Permission Checks**: Server-side validation for all operations
- 🔒 **Email Protection**: Email addresses cannot be changed by any user (including Super Admin)

### SEO Features
- 📄 **Dynamic Metadata**: Page-specific SEO optimization
- 🗺️ **Sitemap**: Auto-generated XML sitemap
- 🤖 **Robots.txt**: Search engine crawling configuration
- 📊 **Structured Data**: JSON-LD schema for rich snippets
- 🌍 **Geographic SEO**: Bangladesh and Dhaka location targeting
- 🌐 **Social Media**: Open Graph and Twitter Cards

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20.x or higher
- **pnpm** (recommended) or npm/yarn
- **Git**

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd robonautsclub
   ```

2. **Install dependencies**
```bash
   pnpm install
   # or
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory (see [Environment Variables](#environment-variables--credentials) section)

4. **Run the development server**
   ```bash
pnpm dev
# or
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔐 Environment Variables & Credentials

Create a `.env.local` file in the root directory with the following variables. For Firebase Admin SDK (server-side courses/events, Firestore), you must set all three: `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, and `FIREBASE_ADMIN_PRIVATE_KEY` (or use `lib/firebase-service-account.json`).

### Required Variables

#### Firebase Configuration (Client-side)
```env
# Firebase Client SDK Configuration
# Get these from Firebase Console > Project Settings > General > Your apps
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

#### Firebase Admin SDK (Server-side)
**Option 1: Environment Variables (Recommended for Production)**
```env
# Firebase Admin SDK - Service Account Credentials
# Get these from Firebase Console > Project Settings > Service Accounts
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account_email@your_project.iam.gserviceaccount.com
# Important: private key must be on ONE line; use literal \n for line breaks (not real newlines)
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourPrivateKeyLinesJoinedWithBackslashN\n-----END PRIVATE KEY-----\n"
```
**Note:** Do not split `FIREBASE_ADMIN_PRIVATE_KEY` across multiple lines in `.env`—most loaders only read the first line and you will get "Invalid PEM formatted message". Use one line with `\n` (backslash + n) between the key lines.

**Option 2: JSON File (Alternative for Development)**
- Download service account JSON from Firebase Console
- Save as `lib/firebase-service-account.json`
- **Note**: This file is gitignored and should NOT be committed

#### Cloudinary Configuration
```env
# Cloudinary Image Upload Service
# Format: cloudinary://api_key:api_secret@cloud_name
# Get this from Cloudinary Dashboard > Settings > Product Environment Credentials
CLOUDINARY_URL=cloudinary://your_api_key:your_api_secret@your_cloud_name
```

#### Email Service (Brevo)
```env
# Brevo API key - required for registration confirmation emails
# Get your API key from https://app.brevo.com/settings/keys/api
BREVO_API_KEY=your_brevo_api_key_here

# Optional: Custom from address (must be from a verified domain in Brevo)
# If not set, defaults to SITE_CONFIG name and noreply email
# Verify your domain at https://app.brevo.com/settings/senders/domains
BREVO_FROM_EMAIL=Robonauts Club <noreply@robonautsclub.com>
```

#### Site Configuration
```env
# Your production website URL (for SEO and absolute URLs)
NEXT_PUBLIC_SITE_URL=https://robonautsclub.com

# Super Admin Emails (comma-separated)
# Users with these emails will be assigned 'superAdmin' role
# All other authenticated users will be assigned 'admin' role
SUPER_ADMIN_EMAILS=admin1@company.com,admin2@company.com,admin3@company.com
```

### Complete .env.local Example

```env
# Site Configuration
NEXT_PUBLIC_SITE_URL=https://robonautsclub.com

# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyExample...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=robonautsclub.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=robonautsclub
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=robonautsclub.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# Firebase Admin SDK
FIREBASE_ADMIN_PROJECT_ID=robonautsclub
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk@robonautsclub.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"

# Cloudinary
CLOUDINARY_URL=cloudinary://123456789012345:abcdefghijklmnopqrstuvwxyz@dvxxa4sho

# Brevo Email Service (registration confirmation emails)
BREVO_API_KEY=your_brevo_api_key_here
# Optional: use a verified sender; see https://app.brevo.com/settings/senders/domains
BREVO_FROM_EMAIL=Robonauts Club <noreply@robonautsclub.com>

# Super Admin Emails (comma-separated, no spaces)
SUPER_ADMIN_EMAILS=admin1@company.com,admin2@company.com,admin3@company.com
```

## 🗄️ Storage Solutions

### Firebase Firestore
- **Purpose**: Primary database for events, bookings, user data, and notifications
- **Collections**:
  - `events` - Event information (title, date, description, image, tags, createdBy, etc.)
  - `bookings` - Event registrations with user details
  - `courses` - Course information (title, level, blurb, image, createdBy, isArchived, etc.)
  - `notifications` - System notifications for database changes
- **Access**: Server-side via Firebase Admin SDK, Client-side via Firebase Client SDK
- **Security**: Role-based access control enforced via Firestore Security Rules

### Cloudinary
- **Purpose**: Image storage and optimization
- **Features**:
  - Automatic AVIF format conversion
  - Image optimization
  - CDN delivery
  - Folder organization (`events/` folder)
- **Max File Size**: 5MB
- **Allowed Formats**: JPEG, PNG, WebP, GIF
- **Upload Location**: Server-side API route (`/api/upload-image`)

### Firebase Storage (Optional)
- Available if needed for additional file storage
- Configured but not actively used (images use Cloudinary)

## 📁 Project Structure

```
robonautsclub/
├── app/                          # Next.js App Router
│   ├── about/                   # About page
│   │   ├── layout.tsx          # About page metadata
│   │   ├── MapClient.tsx       # Interactive map component
│   │   └── page.tsx            # About page content
│   ├── api/                     # API routes
│   │   ├── admin/              # Admin-only API routes
│   │   │   └── users/          # User management (Super Admin only)
│   │   ├── auth/               # Authentication API routes
│   │   │   ├── assign-role/   # Role assignment endpoint
│   │   │   └── profile/       # Profile update endpoint
│   │   ├── notifications/      # Notifications API
│   │   └── upload-image/       # Cloudinary image upload endpoint
│   ├── dashboard/               # Admin dashboard (protected)
│   │   ├── events/             # Event management
│   │   │   ├── [id]/          # Individual event management
│   │   │   ├── CreateEventForm.tsx
│   │   │   ├── EditEventForm.tsx
│   │   │   └── page.tsx
│   │   ├── courses/            # Course management
│   │   │   ├── CreateCourseForm.tsx
│   │   │   ├── EditCourseForm.tsx
│   │   │   └── page.tsx
│   │   ├── members/            # User management (Super Admin only)
│   │   │   ├── CreateUserForm.tsx
│   │   │   ├── EditUserForm.tsx
│   │   │   └── page.tsx
│   │   ├── profile/            # Profile management
│   │   │   └── page.tsx
│   │   ├── actions.ts          # Server actions for dashboard
│   │   ├── Notifications.tsx    # Notifications component
│   │   └── layout.tsx          # Dashboard layout
│   ├── events/                  # Public events pages
│   │   ├── [id]/              # Event detail page
│   │   │   ├── BookingForm.tsx
│   │   │   ├── EventImage.tsx
│   │   │   └── page.tsx
│   │   ├── actions.ts          # Public server actions
│   │   └── page.tsx            # Events listing page
│   ├── login/                   # Login page
│   ├── layout.tsx              # Root layout with metadata
│   ├── page.tsx                # Homepage
│   ├── robots.ts               # Robots.txt generation
│   └── sitemap.ts              # Sitemap generation
├── components/                   # React components
│   ├── CourseCard.tsx          # Course/Event card component
│   ├── FAQAccordion.tsx        # FAQ component
│   ├── Feed.tsx                # Homepage feed
│   ├── Footer.tsx              # Site footer
│   ├── Hero.tsx                # Hero section
│   ├── Navbar.tsx              # Navigation bar
│   ├── OrganizationSchema.tsx  # SEO structured data
│   └── StructuredData.tsx      # Reusable structured data
├── lib/                          # Utility libraries
│   ├── auth.ts                 # Authentication utilities (RBAC helpers)
│   ├── auth-client.ts          # Client-side auth utilities
│   ├── cloudinary.ts           # Cloudinary configuration
│   ├── email.ts                # Email service (Resend)
│   ├── firebase-admin.ts       # Firebase Admin SDK setup
│   ├── firebase.ts             # Firebase Client SDK setup
│   ├── notifications.ts        # Notification creation helper
│   ├── seo.ts                  # SEO utilities and schemas
│   └── utils.ts                # General utilities
├── types/                        # TypeScript type definitions
│   ├── booking.ts              # Booking type
│   ├── course.ts               # Course type
│   └── event.ts                # Event type
├── firestore.rules              # Firestore security rules (RBAC)
├── public/                       # Static assets
│   ├── images/                 # Image assets
│   └── ...
├── middleware.ts                 # Next.js middleware (auth protection)
├── next.config.ts               # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Dependencies and scripts
```

## 💻 Development

### Available Scripts

```bash
# Development server
pnpm dev          # Start development server on http://localhost:3000

# Production build
pnpm build        # Build the application for production
pnpm start        # Start production server

# Code quality
pnpm lint         # Run ESLint
```

### Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow TypeScript and ESLint rules
   - Write descriptive commit messages

3. **Test locally**
   ```bash
   pnpm dev
   ```

4. **Build test**
   ```bash
   pnpm build
   ```

## 🚀 Deployment

### Vercel (Recommended)

1. **Push to GitHub/GitLab/Bitbucket**

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your repository

3. **Configure Environment Variables**
   - Add all variables from `.env.local` to Vercel project settings
   - For `FIREBASE_ADMIN_PRIVATE_KEY`, ensure proper escaping of newlines

4. **Deploy**
   - Vercel will automatically deploy on every push to main branch

### Other Platforms

#### Cloudflare (OpenNext + Workers/Pages)
- Do not use `@cloudflare/next-on-pages` (deprecated and requires Edge runtime on all dynamic routes).
- Build command:
  - `pnpm cf:build`
- Deploy command (Workers):
  - `pnpm cf:deploy`
- Preview locally:
  - `pnpm cf:preview`
- If deploying from Cloudflare Pages UI, set build command to `pnpm cf:build` and do not run `npx @cloudflare/next-on-pages@1`.

#### Netlify
- Use Next.js build command: `next build`
- Output directory: `.next`
- Add all environment variables in Netlify dashboard

#### Self-Hosted (VPS/Server)
- Build the application: `pnpm build`
- Run production server: `pnpm start`
- Use PM2 or similar process manager
- Configure reverse proxy (Nginx/Apache)
- Set up SSL certificate (Let's Encrypt)

### Environment Variables for Production

⚠️ **Important**: Never commit `.env.local` to version control. Always set environment variables in your hosting platform's dashboard.

## 🔧 Troubleshooting

### Firebase Issues

**Problem**: Firebase not initializing
- ✅ Check all `NEXT_PUBLIC_FIREBASE_*` variables are set
- ✅ Verify Firebase project is active
- ✅ Ensure Firestore database is enabled

**Problem**: Admin SDK not working
- ✅ Check `FIREBASE_ADMIN_*` variables or JSON file exists
- ✅ Verify service account has proper permissions
- ✅ Ensure private key includes `\n` escape sequences

**Problem**: Role not assigned correctly
- ✅ Verify `SUPER_ADMIN_EMAILS` environment variable is set
- ✅ Restart the Next.js server after adding/updating `SUPER_ADMIN_EMAILS`
- ✅ Check server console logs for role assignment messages
- ✅ Log out and log back in to trigger role assignment
- ✅ Verify email matches exactly (case-insensitive) in `SUPER_ADMIN_EMAILS`

### Cloudinary Issues

**Problem**: Image upload failing
- ✅ Verify `CLOUDINARY_URL` is correctly formatted
- ✅ Check image file size (max 5MB)
- ✅ Verify file type is allowed (JPEG, PNG, WebP, GIF)

### Email Issues

**Problem**: Emails not sending
- ✅ Verify `RESEND_API_KEY` is set
- ✅ Check Resend account has verified domain (for custom from email)
- ✅ Verify API key has proper permissions

### Build Issues

**Problem**: Build failing
- ✅ Clear `.next` folder: `rm -rf .next`
- ✅ Clear node_modules: `rm -rf node_modules && pnpm install`
- ✅ Check TypeScript errors: `pnpm build`
- ✅ Verify all environment variables are set

**Problem**: Route handler errors with `params`
- ✅ In Next.js 15+, `params` is a Promise and must be awaited
- ✅ Use `const { id } = await params` instead of `const { id } = params`

### SEO Issues

**Problem**: Metadata not showing
- ✅ Verify `NEXT_PUBLIC_SITE_URL` is set
- ✅ Check metadata in page source (View Page Source)
- ✅ Validate structured data with [Google Rich Results Test](https://search.google.com/test/rich-results)

## 📝 Additional Notes

### Role-Based Access Control (RBAC)

The system uses Firebase Custom Claims for role management:

1. **Role Assignment**: Happens automatically on login via `/api/auth/assign-role`
2. **Super Admin**: Emails defined in `SUPER_ADMIN_EMAILS` environment variable
3. **Admin**: All other authenticated users
4. **Token Refresh**: Roles are re-assigned on token refresh
5. **Security**: Custom claims are set server-side only, cannot be modified from client

### Profile Management

- **Display Name**: Can be updated by any admin
- **Password**: Can be changed by any admin
- **Email**: Cannot be changed (permanent for security)
- **Role**: Managed by system, cannot be changed by users

### Notifications System

- **Automatic Notifications**: Created for all database changes:
  - Event creation/update/deletion
  - Course creation/update/deletion/archiving
  - User creation/update/deletion (Super Admin only)
  - Profile updates
- **Auto-Mark as Read**: All notifications marked as read when dropdown is opened
- **Real-time Updates**: Notifications refresh every 30 seconds
- **Visible to**: All admins and super admins

### User Management (Super Admin Only)

- **Create Users**: Super Admin can create new admin users
- **Update Users**: Can update display name, password, and disable/enable accounts
- **Delete Users**: Can permanently delete user accounts
- **Email Restriction**: Even Super Admin cannot change user email addresses

### Security
- 🔒 Never commit `.env.local` or `firebase-service-account.json`
- 🔒 Keep API keys secure and rotate regularly
- 🔒 Use environment variables in production
- 🔒 Admin routes are protected by middleware
- 🔒 Role-based access control (RBAC) enforced at multiple levels:
  - Firebase Custom Claims (server-side only)
  - Firestore Security Rules (database level)
  - Backend permission checks (application level)
- 🔒 Email addresses are permanent and cannot be changed
- 🔒 Role assignment happens automatically on login (no client-side mutation)
- 🔒 `SUPER_ADMIN_EMAILS` must be server-side only (not `NEXT_PUBLIC_`)

### Performance
- ⚡ Images are optimized with Cloudinary (AVIF format)
- ⚡ Next.js automatic code splitting
- ⚡ Server-side rendering for better SEO
- ⚡ Static generation where possible

### Browser Support
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

## 🔔 Notifications System

The platform includes a comprehensive notification system that tracks all database changes:

### Notification Types
- **Event Changes**: Created, updated, or deleted events
- **Course Changes**: Created, updated, deleted, or archived courses
- **User Changes**: Created, updated, or deleted users (Super Admin actions)
- **Profile Updates**: When users update their profile information

### Features
- **Real-time Updates**: Notifications refresh every 30 seconds
- **Auto-Mark as Read**: All notifications automatically marked as read when dropdown opens
- **Unread Badge**: Shows count of unread notifications
- **Color-Coded**: Different colors for different notification types
- **Change Tracking**: Shows what specific fields were changed

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Custom Claims](https://firebase.google.com/docs/auth/admin/custom-claims)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Resend Documentation](https://resend.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 📄 License

Robonauts Club

## 👥 Contributors

[Add contributor information]

## 📞 Support

For support, email info@robonautsclub.com or contact the development team.

---
