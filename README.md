# 🔐 Custom Authentication System

A full-stack custom authentication system built with **Next.js, TypeScript, Prisma, PostgreSQL, and Brevo**.

The goal of this project is to understand and implement authentication from the ground up, including secure password handling, database sessions, email verification, OTP verification, password recovery, and protected routes.

## ✨ Features

### Authentication

* User registration and login
* Secure password hashing
* Database-backed session management
* Secure HttpOnly cookies
* Logout functionality
* Protected/private routes
* Redirect authenticated users away from the authentication page

### 📧 Email Verification

* 6-digit email verification OTP
* OTP expiration after 10 minutes
* Maximum OTP verification attempts
* Resend verification OTP
* Hashed OTP storage
* Prevent unverified users from logging in
* Automatically handle existing unverified accounts

### 🔑 Password Recovery

* Forgot password flow
* Password reset using OTP
* OTP expiration and attempt limits
* Secure password update
* Invalidate existing sessions after password reset

### 👑 Authorization

* User and Admin roles
* Server-side authentication checks
* Admin-only route protection

## 🛠️ Tech Stack

* **Next.js 16** — Full-stack React framework
* **TypeScript** — Type safety
* **Prisma** — Database ORM
* **PostgreSQL / Neon** — Database
* **Tailwind CSS** — Styling
* **Brevo** — Transactional emails
* **Server Actions** — Server-side authentication operations
* **Node.js Crypto** — OTP and token hashing

## 🔄 Authentication Flow

### Signup

```text
Signup
  ↓
Check if user exists
  ↓
┌──────────────────────────────┐
│ Does user already exist?     │
└──────────────────────────────┘
       ↓ YES              ↓ NO
       ↓                  ↓
Check email verified   Hash Password
       ↓                  ↓
  ┌───────────────┐    Create User
  │ Is verified?  │       ↓
  └───────────────┘    Generate OTP
    ↓ YES       ↓ NO       ↓
    ↓           ↓       Hash & Store OTP
  Return       Delete       ↓
  "Please      old OTP   Send OTP with Brevo
  Login"          ↓         ↓
                  Generate  Verify Email
                  new OTP       ↓
                     ↓       Create Session
                  Store OTP       ↓
                     ↓       Access Private
               Send OTP with      Routes
                  Brevo
                     ↓
               Verify Email
                     ↓
               Create Session
                     ↓
               Access Private
                  Routes
```

If a user already exists:

* **Verified user** → registration is rejected and the user is asked to log in.
* **Unverified user** → the previous verification OTP is replaced with a new OTP and sent again.

### Login

```text
Login
  ↓
Find User by Email
  ↓
┌──────────────────────────────┐
│ Does user exist?             │
└──────────────────────────────┘
       ↓ NO               ↓ YES
       ↓                  ↓
Invalid email/password   Verify Password
                            ↓
                    ┌───────────────────┐
                    │ Is password valid?│
                    └───────────────────┘
                       ↓ NO       ↓ YES
                       ↓          ↓
                 Invalid email/   Check Email
                 password         Verification
                                      ↓
                              ┌─────────────────┐
                              │ Email verified? │
                              └─────────────────┘
                                ↓ NO       ↓ YES
                                ↓          ↓
                         Ask user to      Create Session
                         verify email          ↓
                                           Login Success
```

### Email Verification

```text
Enter OTP
   ↓
Find Verification Token
   ↓
┌──────────────────────────────┐
│ Token exists?                │
└──────────────────────────────┘
      ↓ NO               ↓ YES
      ↓                  ↓
  Invalid OTP        Check Expiration
                          ↓
                  ┌─────────────────┐
                  │ Token expired?  │
                  └─────────────────┘
                    ↓ YES      ↓ NO
                    ↓          ↓
               Delete Token   Hash Submitted OTP
                                  ↓
                           ┌────────────────┐
                           │ OTP matches?   │
                           └────────────────┘
                             ↓ NO      ↓ YES
                             ↓         ↓
                       Increment     Mark Email
                       Attempts      Verified
                             ↓         ↓
                       Reject OTP   Delete Token
                                       ↓
                                  Create Session
                                       ↓
                                    Login
```

### Forgot Password

```text
Forgot Password
  ↓
Find User by Email
  ↓
┌──────────────────────────────┐
│ Does user exist?             │
└──────────────────────────────┘
       ↓ NO               ↓ YES
       ↓                  ↓
Return Generic       Delete Previous
Response             Reset OTP
                          ↓
                     Generate OTP
                          ↓
                    Hash & Store OTP
                          ↓
                   Send OTP with Brevo
                          ↓
                     Enter Reset OTP
                          ↓
                   Verify Reset OTP
                          ↓
                  ┌─────────────────┐
                  │ OTP valid?      │
                  └─────────────────┘
                    ↓ NO       ↓ YES
                    ↓          ↓
               Increment     Hash New
               Attempts      Password
                    ↓          ↓
                 Reject      Update User
                              Password
                                 ↓
                           Delete Reset OTP
                                 ↓
                         Invalidate Sessions
                                 ↓
                              Login Again
```

## 🗄️ Database

The application uses three main Prisma models:

* **User** — stores account information and roles
* **Session** — stores authenticated user sessions
* **VerificationToken** — stores email verification and password reset OTP hashes

## ⚙️ Getting Started

Clone the repository and install dependencies:

```bash
npm install
```

Run Prisma migrations:

```bash
npx prisma migrate dev
```

Generate Prisma Client:

```bash
npx prisma generate
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## 🔐 Environment Variables

Create a `.env` file:

```env
DATABASE_URL="your_database_url"

BREVO_API_KEY="your_brevo_api_key"
BREVO_SENDER_EMAIL="your_verified_email"
BREVO_SENDER_NAME="My Custom Auth"

NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Never expose `BREVO_API_KEY` to the client.

## 🚧 Future Improvements

* Server-side rate limiting
* Resend OTP cooldown
* Zod input validation
* Session cleanup
* Security/audit logging
* Two-factor authentication
* OAuth authentication

## 👩‍💻 Author

**Asia Ashraf**

Full-Stack Web Developer

* GitHub: https://github.com/asia272
* Portfolio: https://asia-ashraf.vercel.app/
