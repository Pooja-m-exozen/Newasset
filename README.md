# FacilioTrack - Facility Management Platform

A comprehensive facility management platform with full authentication system, built with Next.js, TypeScript, and Tailwind CSS.

## Features

### 🔐 Authentication System
- **User Registration** - Complete registration flow with validation
- **User Login** - Secure login with remember me functionality
- **Password Reset** - Forgot password and reset password flows
- **Profile Management** - Update profile information and change password
- **Protected Routes** - Automatic authentication checks
- **Session Management** - JWT token-based authentication

### 🏢 Facility Management
- **Dashboard** - Real-time overview of facility operations
- **Asset Management** - Track and monitor facility assets
- **User Management** - Manage user accounts and permissions
- **Location Management** - Organize facilities by location
- **Reports & Analytics** - Generate insights and reports
- **Audit Trails** - Track system activities and changes

## Authentication API Endpoints

The application integrates with the following API endpoints:

### Auth Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Send password reset link
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/update-profile` - Update user profile
- `PUT /api/auth/update-password` - Change user password

## Pages & Routes

### Public Pages
- `/` - Landing page
- `/login` - User login
- `/register` - User registration
- `/forgot-password` - Forgot password form
- `/reset-password?token=xxx` - Reset password with token

### Protected Pages
- `/dashboard` - Main dashboard (requires authentication)
- `/profile` - User profile management
- `/manageusers` - User management
- `/assets` - Asset management
- `/locations` - Location management
- `/reports` - Reports and logs
- `/analytics` - Analytics dashboard

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd facilio-track
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create .env.local file
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Authentication Flow

### Registration Flow
1. User visits `/register`
2. Fills out registration form with validation
3. Submits to `POST /api/auth/register`
4. Receives success message and redirects to login

### Login Flow
1. User visits `/login`
2. Enters credentials with validation
3. Submits to `POST /api/auth/login`
4. Receives JWT token and redirects to dashboard

### Password Reset Flow
1. User visits `/forgot-password`
2. Enters email address
3. Submits to `POST /api/auth/forgot-password`
4. Receives reset link via email
5. Clicks link to `/reset-password?token=xxx`
6. Sets new password via `POST /api/auth/reset-password`

### Profile Management
1. User visits `/profile` (protected route)
2. Can update profile information
3. Can change password
4. All changes require authentication

## Security Features

- **JWT Token Authentication** - Secure token-based sessions
- **Password Validation** - Strong password requirements
- **Form Validation** - Client and server-side validation
- **Protected Routes** - Automatic authentication checks
- **Secure Storage** - Tokens stored in localStorage
- **Error Handling** - Comprehensive error messages

## Demo Credentials

For testing purposes, you can use these demo credentials:
- **Email:** demo@faciliotrack.com
- **Password:** demo123

## API Configuration

The application is configured to work with the production API at `https://digitalasset.zenapi.co.in/api`. 

### Environment Configuration

- **Development**: Runs locally at `http://localhost:3000` (no basePath)
- **Production**: Deployed at `https://exozen.co.in/v1/asset` (with basePath automatically applied)

### Deployment Configuration

The application automatically handles different environments:

1. **Development**: No basePath, accessible at `http://localhost:3000/login`
2. **Production**: BasePath `/v1/asset` automatically applied, accessible at `https://exozen.co.in/v1/asset/login`
3. **API Endpoints**: All API calls point to `https://digitalasset.zenapi.co.in/api`
4. **Routing**: Uses Next.js router for proper basePath handling

### Troubleshooting Login Issues

**Local Development (http://localhost:3000):**
- Login page should be accessible at `http://localhost:3000/login`
- No basePath applied in development mode

**Production (https://exozen.co.in/v1/asset):**
- Login page should be accessible at `https://exozen.co.in/v1/asset/login`
- BasePath is automatically applied in production mode

**Common Issues:**
1. If you get "page not found" locally, restart the development server after config changes
2. Ensure the application is deployed at the correct path: `https://exozen.co.in/v1/asset`
3. Check that all redirects use Next.js router instead of `window.location.href`

### Expected API Response Format

```typescript
interface AuthResponse {
  success: boolean
  message: string
  token?: string
  user?: {
    id: string
    name: string
    email: string
    role?: string
  }
}
```

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   ├── forgot-password/   # Forgot password page
│   ├── reset-password/    # Reset password page
│   ├── dashboard/         # Dashboard (protected)
│   ├── profile/           # Profile management (protected)
│   └── layout.tsx         # Root layout with AuthProvider
├── components/            # Reusable components
│   ├── ProtectedRoute.tsx # Authentication wrapper
│   ├── sidebar.tsx        # Navigation sidebar
│   └── ui/               # UI components
├── contexts/              # React contexts
│   └── AuthContext.tsx    # Authentication context
├── lib/                   # Utility libraries
│   ├── api.ts            # API service functions
│   └── utils.ts          # Utility functions
```

## Technologies Used

- **Next.js 14** - React framework with app router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **React Context** - State management
- **JWT** - JSON Web Tokens for authentication

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
