

# e-DigiVault — Property Documentation Platform

## Overview
A mobile-first property documentation app for Karnataka, India with splash screen, onboarding carousel, OTP login, registration flow, and tabbed dashboard.

## Screens & Flow

### 1. Splash Screen (`/splash` — default route)
- White background with centered 280px medium-blue circle containing "e-DigiVault" in gold
- Auto-redirects to `/onboarding` after 2 seconds

### 2. Onboarding Carousel (`/onboarding`)
- 3 swipeable pages with illustration placeholders, titles in blue, descriptions in grey italic
- Back arrow, Skip button, circular next button, dot indicators
- Pages: "Upload with Confidence", "Safe and Secure", "Track Everything"
- Skip or finish → `/login`

### 3. Login (`/login`)
- Mobile number input with Send OTP button
- OTP input with show/hide toggle and Resend Code link
- Register bottom sheet with 6-digit OTP boxes and Verify button
- Any 6-digit OTP accepted → `/register-type`

### 4. Registration Type (`/register-type`)
- 3 cards: Individual, Organization, Land Aggregator (2+1 grid)
- Selected card turns medium-blue with white text; unselected is light purple-blue
- Bottom sheet with Terms & Conditions checkbox → Continue → `/register-form`

### 5. Registration Form (`/register-form`)
- Placeholder form screen for user details

### 6. Dashboard & Tab Screens
- `/dashboard` (Home), `/properties`, `/transactions`, `/settings`
- Fixed bottom tab bar with 4 tabs (Home, Properties, Transactions, Settings)

## Technical Setup
- **API layer** (`src/lib/api.ts`): fetchList, fetchOne, createRecord, updateRecord via ERPNext proxy
- **AuthContext**: stores client_id, phone, name; hardcodes "CL-00001" after registration
- **Theme**: Light blue #3B82F6 primary, white backgrounds, Inter font, mobile-first layout
- **Routing**: React Router v6 with all specified routes

## Design System
- All buttons: #3B82F6 filled with white text, rounded-lg, full-width on mobile
- Touch targets ≥ 44px, consistent 16-20px horizontal padding
- Bottom sheets slide up with blue top border
- Flat design with no heavy shadows

