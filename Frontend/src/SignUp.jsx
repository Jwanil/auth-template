import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { Label } from './components/ui/label'
import { EyeIcon, EyeOffIcon } from 'lucide-react'

// Add this for cookie support
axios.defaults.withCredentials = true;

const SignUp = () => {
    const [username, setUsername] = useState('')  
    const [email, setEmail] = useState('')       
    const [password, setPassword] = useState('') 
    const [error, setError] = useState('')       
    const [isGoogleSignUp, setIsGoogleSignUp] = useState(false)
    const [googleData, setGoogleData] = useState(null)
    const [showPassword, setShowPassword] = useState(false)
    const navigate = useNavigate()
    const location = useLocation()
    
    useEffect(() => {
        // Check if this is a Google sign-up completion
        const params = new URLSearchParams(location.search)
        const isGoogle = params.get('google') === 'true'
        
        if (isGoogle) {
            const googleAuth = localStorage.getItem('googleAuth')
            if (googleAuth) {
                const parsedData = JSON.parse(googleAuth)
                setGoogleData(parsedData)
                setEmail(parsedData.email)
                setIsGoogleSignUp(true)
            }
        }
    }, [location])
    
    // Validation functions
    const validateEmail = (email) => {
        const validDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'aol.com', 'protonmail.com', 'mail.com'];
        const domain = email.split('@')[1];
        return validDomains.includes(domain);
    }
    
    const validatePassword = (password) => {
        // At least 8 characters, 1 uppercase, 1 number, 1 symbol
        const regex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;
        return regex.test(password);
    }
    
    const handleClick = (e) => {
        e.preventDefault()
        setError('')
        
        // Enhanced validation
        if (!username || !password) {
            setError('Username and password are required');
            return;
        }
        
        if (!isGoogleSignUp && !email) {
            setError('Email is required');
            return;
        }
        
        if (!isGoogleSignUp && !email.includes('@')) {
            setError('Please enter a valid email address');
            return;
        }
        
        if (!isGoogleSignUp && !validateEmail(email)) {
            setError('Please use a common email domain (gmail.com, yahoo.com, outlook.com, etc.)');
            return;
        }
        
        if (!validatePassword(password)) {
            setError('Password must be at least 8 characters and include at least one uppercase letter, one number, and one special character');
            return;
        }
        
        if (isGoogleSignUp && googleData) {
            // Complete Google sign-up with username and password
            axios.post('http://localhost:5002/api/users/google-login', {
                token: googleData.credential,
                username,
                password
            })
            .then(result => {
                // Clear temporary Google auth data
                localStorage.removeItem('googleAuth');
                
                // Store user info
                localStorage.setItem('user', JSON.stringify(result.data));
                
                // Redirect to welcome page
                navigate('/welcome');
            })
            .catch(err => {
                console.log(err);
                setError(err.response?.data?.message || 'Registration failed');
            })
        } else {
            // Regular sign-up
            axios.post('http://localhost:5002/api/users/register', {name: username, email, password})
                .then(result => {
                    console.log(result);
                    navigate('/SignIn');
                })
                .catch(err => {
                    console.log(err);
                    setError(err.response?.data?.message || 'Registration failed');
                })
        }
    }
    
    // Add Google Sign-In handler
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
                
                // Refresh the page with google=true parameter
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
    
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md space-y-8 p-8 bg-card rounded-xl shadow-lg border border-border">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight">
                        {isGoogleSignUp ? 'Complete Your Profile' : 'Sign Up'}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {isGoogleSignUp 
                            ? 'Please choose a username and password to complete your registration' 
                            : 'Create an account to get started'}
                    </p>
                </div>
                
                {error && (
                    <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                        {error}
                    </div>
                )}
                
                <form className="space-y-4" onSubmit={handleClick}>
                    {isGoogleSignUp && (
                        <div className="space-y-2">
                            <Label htmlFor="email-disabled">Email Address (from Google)</Label>
                            <Input
                                id="email-disabled"
                                type="email"
                                value={email}
                                disabled
                                className="opacity-70"
                            />
                        </div>
                    )}
                    
                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Choose a username"
                        />
                    </div>
                    
                    {!isGoogleSignUp && (
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                            />
                        </div>
                    )}
                    
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Create a password"
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
                        <p className="text-xs text-muted-foreground">
                            Password must contain at least 8 characters, including one uppercase letter, one number, and one special character.
                        </p>
                    </div>
                    
                    <Button type="submit" className="w-full">
                        {isGoogleSignUp ? 'Complete Sign Up' : 'Register'}
                    </Button>
                </form>
                
                {!isGoogleSignUp && (
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
                    Already have an account?{" "}
                    <Link to="/SignIn" className="text-primary hover:underline font-medium">
                        Sign In
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default SignUp