# Authentication Template

A complete authentication system with OTP verification, Google OAuth, and password reset functionality.

## Features

- User registration with email verification
- Login with OTP verification
- Google OAuth integration
- Password reset functionality
- User settings management
- Admin panel for user management
- Secure authentication with JWT
- Trusted device management

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Nodemailer for email services
- Google Auth Library for OAuth

### Frontend
- React.js
- React Router for navigation
- Axios for API requests
- ShadCN UI components
- Tailwind CSS for styling
- React Hook Form for form handling

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Google Cloud Platform account (for OAuth)
- Gmail account (for email services)

# Authentication Template Setup Guide

This guide provides step-by-step instructions for setting up and integrating this authentication template into a new project.

## Table of Contents

1. [Project Structure Setup](#1-project-structure-setup)
2. [Backend Setup](#2-backend-setup)
3. [Frontend Setup](#3-frontend-setup)
4. [Google OAuth Setup](#4-google-oauth-setup)
5. [Email Service Setup](#5-email-service-setup)
6. [Starting the Application](#6-starting-the-application)
7. [Integrating with Existing Projects](#7-integrating-with-existing-projects)
8. [Troubleshooting](#8-troubleshooting)

## 1. Project Structure Setup

Create the basic folder structure for your new project:

```bash
mkdir my-new-project
cd my-new-project
mkdir Backend Frontend
```

## 2. Backend Setup
### 2.1 Copy Backend Files
Copy the entire Backend folder from the template to your new project:

```
cp -R /path/to/auth-template/Backend/* ./Backend/
```
### 2.2 Install Dependencies
```bash
cd Backend
npm install
```
This will install all required dependencies defined in package.json:

- express
- mongoose
- bcrypt
- jsonwebtoken
- nodemailer
- cors
- dotenv
- cookie-parser
- google-auth-library
- and other dependencies

### 2.3 Configure Environment Variables
Create a .env file in the Backend folder with the following variables:

```.env content

PORT=5002
MONGO_URI=mongodb://127.0.0.1:27017/your_new_database_name
JWT_SECRET=your_new_jwt_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
EMAIL_USER=your_email@gmail.com
EMAIL_APP_PASSWORD=your_app_password
```
Important Notes:

- PORT : You can change this to any available port
- MONGO_URI :
  - For local MongoDB: mongodb://127.0.0.1:27017/your_database_name
  - For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/your_database_name
- JWT_SECRET : Generate a secure random string (at least 64 characters)
  - You can use this command: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
- GOOGLE_CLIENT_ID : You'll get this from Google Cloud Console (see Section 4)
- EMAIL_USER : Your Gmail address
- EMAIL_APP_PASSWORD : App password generated from your Google account

### 2.4 Database Setup
Ensure MongoDB is installed and running on your system:

```bash
# Check if MongoDB is running
mongod --version
```
If using a local MongoDB instance:

```bash
# Start MongoDB (if not running as a service)
mongod --dbpath /path/to/data/db
```
If using MongoDB Atlas:

1. Create an account at MongoDB Atlas
2. Create a new cluster
3. Set up database access (username/password)
4. Set up network access (IP whitelist)
5. Get your connection string and update the MONGO_URI in your .env file

## 3. Frontend Setup

### 3.1 Copy Frontend Files
```bash
cp -R /path/to/auth-template/Frontend/* ./Frontend/
```
### 3.2 Install Dependencies
```bash
cd Frontend
npm install
```
This will install all required dependencies defined in package.json:

- react
- react-dom
- react-router-dom
- axios
- @react-oauth/google
- jwt-decode
- react-hook-form
- lucide-react
- tailwind CSS components
- and other dependencies

### 3.3 Configure Environment Variables
Create a .env file in the Frontend folder:

```
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```
### 3.4 Update API Endpoints
If you're using a different port for your backend or deploying to a different URL, update all API endpoint URLs in your frontend components:

1. Search for instances of http://localhost:5002 in your frontend code
2. Replace with your new backend URL (e.g., http://localhost:your_port or https://your-api-domain.com )
Key files to check:

- src/SignIn.jsx
- src/SignUp.jsx
- src/OTPVerification.jsx
- src/ResetPassword.jsx
- src/UserSettings.jsx

## 4. Google OAuth Setup

### 4.1 Create a Google Cloud Project
1. Go to Google Cloud Console
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Dashboard"
4. Click "+ ENABLE APIS AND SERVICES"
5. Search for and enable "Google+ API" and "Google Identity Services"

### 4.2 Configure OAuth Consent Screen
1. Go to "APIs & Services" > "OAuth consent screen"
2. Select User Type (External or Internal)
3. Fill in the required information:
   - App name
   - User support email
   - Developer contact information
4. Click "Save and Continue"
5. Add scopes: select .../auth/userinfo.email and .../auth/userinfo.profile
6. Click "Save and Continue"
7. Add test users (if using External user type)
8. Click "Save and Continue"

### 4.3 Create OAuth Client ID
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Application type: Web application
4. Name: Your application name
5. Authorized JavaScript origins:
   - Add http://localhost:3000 (for development)
   - Add your production domain if applicable
6. Authorized redirect URIs:
   - Add http://localhost:3000 (for development)
   - Add your production domain if applicable
7. Click "Create"

### 4.4 Update Client ID in Your Project
1. Copy the generated Client ID
2. Update in Backend .env file: GOOGLE_CLIENT_ID=your_new_client_id
3. Update in Frontend .env file: REACT_APP_GOOGLE_CLIENT_ID=your_new_client_id
4. Update in Frontend src/index.js if the client ID is hardcoded

## 5. Email Service Setup

### 5.1 Configure Gmail for SMTP

1. Use a Gmail account for sending emails
2. Enable 2-factor authentication:
   - Go to your Google Account > Security
   - Enable 2-Step Verification
3. Generate an App Password:
   - Go to your Google Account > Security > App Passwords
   - Select "Mail" as the app and "Other" as the device (name it something like "Auth Template")
   - Click "Generate"
4. Copy the 16-character password
5. Use this password in your .env file as EMAIL_APP_PASSWORD

### 5.2 Update Email Templates

Modify Backend/services/emailService.js to update the sender email and templates as needed:

- Update the from field in the email options
- Customize the email templates (HTML and text versions)
- Adjust the expiry times if needed

## 6. Starting the Application

### 6.1 Start Backend
```bash
cd Backend
npm run dev
```
Your backend should start on the configured port (default: 5002).

### 6.2 Start Frontend
```bash
cd Frontend
npm start
```
Your frontend should start on port 3000 and automatically open in your browser.

## 7. Integrating with Existing Projects

### 7.1 Backend Integration

1. Copy the necessary components :
   
   - models/userModel.js : Contains the user schema and authentication methods
   - routes/userRoutes.js : Contains all authentication routes
   - services/emailService.js : Handles email sending for OTP and password reset
   - middleware/authMiddleware.js : Protects routes requiring authentication
2. Update your main Express app :
```javascript
// In your main server file (e.g., index.js or server.js)
import userRoutes from './routes/userRoutes.js';

// Add middleware
app.use(cors({ origin: 'your-frontend-url', credentials: 
true }));
app.use(express.json());
app.use(cookieParser());

// Add user routes
app.use('/api/users', userRoutes);
```
3. Protect routes using the authMiddleware :
```javascript
// In your route files
import { protect } from '../middleware/authMiddleware.js';

// Example of a protected route
router.get('/profile', protect, (req, res) => {
  // This route is only accessible to authenticated users
  res.json(req.user);
});
```
### 7.2 Frontend Integration
1. Copy the authentication components :
   
   - SignIn.jsx
   - SignUp.jsx
   - OTPVerification.jsx
   - ResetPassword.jsx
   - UserSettings.jsx
   - Required UI components from components/ui/
2. Update your React Router :
```javascript
// In your App.jsx or routing configuration
import { BrowserRouter, Routes, Route } from 
'react-router-dom';
import SignIn from './SignIn';
import SignUp from './SignUp';
import OTPVerification from './OTPVerification';
import ResetPassword from './ResetPassword';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/verify-otp" element=
        {<OTPVerification />} />
        <Route path="/reset-password/:token" element=
        {<ResetPassword />} />
        {/* Your other routes */}
      </Routes>
    </BrowserRouter>
  );
}
```
3. Add Google OAuth Provider :
```javascript
// In your index.js
import { GoogleOAuthProvider } from '@react-oauth/google';

const root = ReactDOM.createRoot(document.getElementById
('root'));
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId="your-google-client-id">
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
```
4. Add authentication state management :
Implement a context or state management solution to track authentication state across your application.


## 8. Troubleshooting

### 8.1 Backend Issues
- MongoDB Connection Errors :
  
  - Ensure MongoDB is running
  - Check your connection string in the .env file
  - Verify network access if using MongoDB Atlas
- Email Sending Failures :
  
  - Verify your Gmail credentials
  - Ensure 2FA is enabled and you're using an App Password
  - Check if your Gmail account has any security restrictions
- Google OAuth Verification Errors :
  
  - Ensure your GOOGLE_CLIENT_ID is correct
  - Check that you've enabled the necessary APIs in Google Cloud Console

### 8.2 Frontend Issues
- API Connection Errors :
  
  - Verify the backend URL in your API calls
  - Check that CORS is properly configured on the backend
  - Ensure credentials are being sent with requests
- Google Login Button Not Working :
  
  - Verify your Google Client ID is correct
  - Check browser console for errors
  - Ensure the Google OAuth Provider is properly set up
- Routing Issues :
  
  - Check your React Router configuration
  - Ensure all components are properly imported
  - Verify path names match between frontend and backend
  
### 8.3 Common Error Messages
- "MongoDB connection error" : Check your MongoDB connection string and ensure MongoDB is running
- "Email sending failed" : Verify your email credentials and check for any Gmail security restrictions
- "Invalid Google token" : Ensure your Google Client ID is correct and properly configured
- "CORS error" : Update your CORS configuration in the backend to allow requests from your frontend origin
For additional help or questions, please refer to the documentation of the individual libraries used in this project or create an issue in the GitHub repository.

