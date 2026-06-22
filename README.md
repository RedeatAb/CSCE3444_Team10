
# Flex Pay & Meal Swap – Sprint 1

## Project Overview
Flex Pay & Meal Swap is a mobile application for University of North Texas (UNT) students that enables secure Flex Pay transactions, digital EUID identification, meal swaps, and account management.

Sprint 1 focused on establishing the authentication, payment, security, backend infrastructure, and UI foundation of the application.

---

## Sprint 1 Goals
- Build core authentication flows
- Configure Firebase backend infrastructure
- Implement secure QR and NFC payment systems
- Create Digital EUID functionality
- Establish security controls and session management
- Build foundational UI following UNT branding standards
- Prepare testing and Sprint 1 demonstration assets

---

## Technology Stack

### Frontend
- React Native
- Expo
- Firebase SDK

### Backend
- Firebase Authentication
- Cloud Firestore
- Firebase Cloud Functions
- Firebase Cloud Messaging (FCM)

### Security
- JWT Authentication
- TLS 1.3
- HTTPS Enforcement
- Replay Attack Prevention
- Optional Two-Factor Authentication
- Biometric Authentication (Face ID / Touch ID)

---

## Features Delivered

### Authentication
- User Registration with UNT email validation (`@my.unt.edu`)
- Login with email/EUID and password
- Forgot Password workflow
- EUID Linking (3-step verification process)
- Optional Email-based Two-Factor Authentication
- Face ID / Touch ID biometric login

### Flex Pay
- Digital EUID Card with signed JWT QR code
- QR Code Payment Processing
- NFC Tap-to-Pay Support
- Real-Time Flex Balance Updates
- In-Person Payment Options Screen

### Security
- HTTPS/TLS 1.3 Enforcement
- JWT Signing and Validation
- Session Timeout (30-minute inactivity)
- 24-hour JWT expiration
- Replay Attack Protection

### Backend
- Firestore Database Setup
- Cloud Functions Deployment
- Firebase Authentication Configuration
- Firebase Cloud Messaging Integration

### UI/UX
- UNT Brand Theme (#1A6E44)
- Navigation Shell
- Bottom Tab Navigation
- Mobile Responsive Screens

---

## Completed Sprint 1 Deliverables

### Backend
- Firestore collections:
  - users
  - transactions
  - orders
  - swap_offers

- Cloud Functions:
  - signQRToken
  - processSwapTransfer
  - updateFlexBalance

### Authentication Screens
- Sign Up
- Login
- Forgot Password
- EUID Linking

### Payment Features
- QR Payment Flow
- NFC Payment Flow
- Digital EUID Card
- Balance Display

### Security Features
- JWT Verification
- Session Management
- Two-Factor Authentication
- Biometric Authentication

---

## Performance Targets Achieved

| Feature | Result |
|----------|---------|
| QR Payment Processing | Average 1.8 seconds |
| NFC Payment Processing | Average 1.4 seconds |
| Flex Balance Updates | Within 5 seconds |
| JWT Refresh | Every 30 seconds |
| Session Timeout | 30 minutes |
| JWT Expiration | 24 hours |

---

## Testing

### Unit Testing
- Forgot Password screen
- 9/9 test cases passed

### Integration Testing
- Cloud Functions validated
- Authentication workflows tested
- QR and NFC payment flows verified

### Security Testing
- JWT validation
- Replay attack prevention
- Authentication rule verification

---

## Sprint 1 Team Contributions

| Member | Primary Areas |
|----------|---------------|
| Jacob | Registration, Digital EUID, Security Infrastructure, UI Foundation |
| Jeff | Login, Notifications, Session Management, Payment Screens |
| Riket | Forgot Password, Cloud Functions, QR/NFC Payments, Testing |
| Redeat | EUID Linking, 2FA, Biometric Login, Sprint Documentation |

---

## Sprint 1 Outcome

Sprint 1 successfully established the application's core architecture, authentication system, secure payment infrastructure, and UNT-branded user interface. The project is now prepared for Sprint 2 development, which will focus on meal swap functionality, transaction workflows, notifications, and additional user features.
