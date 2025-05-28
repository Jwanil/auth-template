import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'
import OTPVerification from './OTPVerification'
import { GoogleLogin } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { Label } from './components/ui/label'
import { Checkbox } from './components/ui/checkbox'
import { EyeIcon, EyeOffIcon } from 'lucide-react'

// Add this near the top of your file
axios.defaults.withCredentials = true;

const SignIn = () => {
    const [identifier, setIdentifier] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [requireOTP, setRequireOTP] = useState(false)
    const [userId, setUserId] = useState(null)
    const [showForgotPassword, setShowForgotPassword] = useState(false)
    const [forgotEmail, setForgotEmail] = useState('')
    const [forgotPasswordMessage, setForgotPasswordMessage] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const navigate = useNavigate()
    
    const handleClick = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        
        // Basic validation
        if (!identifier || !password) {
            setError('Username/Email and password are required')
            setLoading(false)
            return
        }
        
        try {
            const response = await axios.post('http://localhost:5002/api/users/login', {
                identifier, 
                password
            })
            
            // Check if OTP verification is required
            if (response.data.requireOTP) {
                setUserId(response.data.userId)
                setRequireOTP(true)
            } else {
                // Store user info in localStorage
                localStorage.setItem('user', JSON.stringify(response.data))
                // Redirect to welcome page
                navigate('/welcome')
            }
        } catch (err) {
            console.log(err)
            setError(err.response?.data?.message || 'Invalid credentials')
        } finally {
            setLoading(false)
        }
    }
    
    const handleForgotPassword = async (e) => {
        e.preventDefault()
        setForgotPasswordMessage('')
        
        if (!forgotEmail || !forgotEmail.includes('@')) {
            setForgotPasswordMessage('Please enter a valid email address')
            return
        }
        
        try {
            const response = await axios.post('http://localhost:5002/api/users/forgot-password', {
                email: forgotEmail
            })
            
            setForgotPasswordMessage(response.data.message)
            
            // Add this code to redirect to the reset password page
            setTimeout(() => {
                navigate('/reset-password', { state: { email: forgotEmail } })
            }, 2000) // Redirect after 2 seconds so user can see the success message
        } catch (err) {
            setForgotPasswordMessage(err.response?.data?.message || 'Failed to process request')
        }
    }
    
    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            // Decode the credential to get user info
            const decoded = jwtDecode(credentialResponse.credential);
            
            // Send the token to your backend
            const response = await axios.post('http://localhost:5002/api/users/google-login', {
                token: credentialResponse.credential
            });
            
            // Check if profile setup is needed
            if (response.data.needsProfile) {
                // Store Google auth data in localStorage temporarily
                localStorage.setItem('googleAuth', JSON.stringify({
                    email: response.data.email,
                    googleId: response.data.googleId,
                    credential: credentialResponse.credential
                }));
                
                // Redirect to profile setup page
                navigate('/SignUp?google=true');
            } else {
                // Store user info in localStorage
                localStorage.setItem('user', JSON.stringify(response.data));
                
                // Redirect to welcome page
                navigate('/welcome');
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Google login failed');
        }
    };
    
    // If OTP verification is required, show the OTP component
    if (requireOTP) {
        return <OTPVerification userId={userId} />
    }
    
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md space-y-8 p-8 bg-card rounded-xl shadow-lg border border-border">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight">Sign In</h1>
                    <p className="text-sm text-muted-foreground">Enter your credentials to access your account</p>
                </div>
                
                {error && (
                    <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                        {error}
                    </div>
                )}
                
                {!showForgotPassword ? (
                    // Regular login form
                    <form className="space-y-4" onSubmit={handleClick}>
                        <div className="space-y-2">
                            <Label htmlFor="identifier">Username or Email</Label>
                            <Input
                                id="identifier"
                                type="text"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                placeholder="Enter your username or email"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <button 
                                    type="button"
                                    onClick={() => setShowForgotPassword(true)}
                                    className="text-xs text-primary hover:underline"
                                >
                                    Forgot Password?
                                </button>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOffIcon className="h-4 w-4" />
                                    ) : (
                                        <EyeIcon className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <Button 
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </form>
                ) : (
                    // Forgot password form
                    <form className="space-y-4" onSubmit={handleForgotPassword}>
                        <div className="space-y-2">
                            <Label htmlFor="forgotEmail">Email Address</Label>
                            <Input
                                id="forgotEmail"
                                type="email"
                                value={forgotEmail}
                                onChange={(e) => setForgotEmail(e.target.value)}
                                placeholder="Enter your registered email"
                            />
                        </div>
                        {forgotPasswordMessage && (
                            <div className={`p-3 rounded-md ${forgotPasswordMessage.includes('sent') ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'} text-sm`}>
                                {forgotPasswordMessage}
                            </div>
                        )}
                        <Button 
                            type="submit"
                            className="w-full"
                        >
                            Reset Password
                        </Button>
                        <button 
                            type="button"
                            onClick={() => setShowForgotPassword(false)}
                            className="w-full text-sm text-primary hover:underline"
                        >
                            Back to Login
                        </button>
                    </form>
                )}
                
                {!showForgotPassword && (
                    <>
                        <div className="relative flex items-center justify-center">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border" />
                            </div>
                            <div className="relative bg-card px-4 text-xs uppercase text-muted-foreground">
                                Or continue with
                            </div>
                        </div>
                        
                        <div className="flex justify-center">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => setError('Google login failed')}
                                useOneTap
                            />
                        </div>
                    </>
                )}
                
                <div className="text-center text-sm">
                    Don't have an account?{" "}
                    <Link to="/SignUp" className="text-primary hover:underline font-medium">
                        Sign Up
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default SignIn