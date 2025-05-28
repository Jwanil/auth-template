import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { Label } from './components/ui/label'
import { EyeIcon, EyeOffIcon } from 'lucide-react'

const ResetPassword = () => {
    const location = useLocation()
    const [email, setEmail] = useState(location.state?.email || '')
    const [token, setToken] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [resendDisabled, setResendDisabled] = useState(false)
    const [countdown, setCountdown] = useState(0)
    const navigate = useNavigate()
    
    const handleResetPassword = async (e) => {
        e.preventDefault()
        setError('')
        setMessage('')
        
        // Basic validation
        if (!email || !token || !newPassword || !confirmPassword) {
            setError('All fields are required')
            return
        }
        
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match')
            return
        }
        
        // Validate password complexity
        const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;
        if (!passwordRegex.test(newPassword)) {
            setError('Password must be at least 8 characters and include at least one uppercase letter, one number, and one special character')
            return
        }
        
        try {
            const response = await axios.post('http://localhost:5002/api/users/reset-password', {
                email,
                token,
                newPassword
            })
            
            setMessage(response.data.message)
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/SignIn')
            }, 3000)
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password')
        }
    }
    
    const handleResendCode = async () => {
        if (resendDisabled) return
        
        if (!email || !email.includes('@')) {
            setError('Please enter a valid email address')
            return
        }
        
        try {
            const response = await axios.post('http://localhost:5002/api/users/forgot-password', {
                email: email
            })
            
            setMessage('Reset code has been resent to your email')
            setResendDisabled(true)
            setCountdown(120) // 2 minutes
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend code')
        }
    }
    
    useEffect(() => {
        let timer
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000)
        } else if (countdown === 0 && resendDisabled) {
            setResendDisabled(false)
        }
        
        return () => clearTimeout(timer)
    }, [countdown, resendDisabled])
    
    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <div className="w-full max-w-md space-y-6 p-6 bg-card rounded-lg shadow-lg border border-border">
                <div className="space-y-2 text-center">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Reset Password</h1>
                    <p className="text-sm text-muted-foreground">
                        Enter the reset code sent to your email and create a new password
                    </p>
                </div>
                
                {error && (
                    <div className="p-3 rounded-md bg-destructive/15 text-destructive font-medium text-sm">
                        {error}
                    </div>
                )}
                
                {message && (
                    <div className="p-3 rounded-md bg-green-500/15 text-green-500 font-medium text-sm">
                        {message}
                    </div>
                )}
                
                <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            className="bg-background"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="token">Reset Code</Label>
                            <button 
                                type="button" 
                                onClick={handleResendCode}
                                disabled={resendDisabled}
                                className="text-xs text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
                            >
                                {resendDisabled 
                                    ? `Resend in ${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, '0')}` 
                                    : 'Resend Code'}
                            </button>
                        </div>
                        <Input
                            id="token"
                            type="text"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            placeholder="Enter the 6-digit code from your email"
                            className="bg-background"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <div className="relative">
                            <Input
                                id="newPassword"
                                type={showPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                                className="bg-background pr-10"
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
                    
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <div className="relative">
                            <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                className="bg-background pr-10"
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? (
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
                        Reset Password
                    </Button>
                    
                    <div className="text-center">
                        <a href="/SignIn" className="text-sm text-primary hover:underline">
                            Back to Login
                        </a>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default ResetPassword