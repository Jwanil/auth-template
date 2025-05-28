import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { Checkbox } from './components/ui/checkbox'
import { Label } from './components/ui/label'

const OTPVerification = ({ userId }) => {
    const [otp, setOtp] = useState('')
    const [rememberDevice, setRememberDevice] = useState(false)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [resendDisabled, setResendDisabled] = useState(false)
    const [countdown, setCountdown] = useState(0)
    const navigate = useNavigate()
    
    const handleVerify = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        
        try {
            const response = await axios.post('http://localhost:5002/api/users/verify-otp', {
                userId,
                otp,
                rememberDevice
            })
            
            // Store user info in localStorage
            localStorage.setItem('user', JSON.stringify(response.data))
            
            // Redirect to welcome page
            navigate('/welcome')
        } catch (error) {
            setError(error.response?.data?.message || 'Verification failed')
        } finally {
            setLoading(false)
        }
    }
    
    const handleResendOTP = async () => {
        if (resendDisabled) return
        
        setMessage('')
        setError('')
        
        try {
            const response = await axios.post('http://localhost:5002/api/users/resend-otp', {
                userId
            })
            
            setMessage('OTP has been resent to your email')
            setResendDisabled(true)
            setCountdown(120) // 2 minutes
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to resend OTP')
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
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Verify OTP</h1>
                    <p className="text-sm text-muted-foreground">
                        A one-time password has been sent to your email. Please enter it below.
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
                
                <form onSubmit={handleVerify} className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="otp">One-Time Password</Label>
                            <button 
                                type="button" 
                                onClick={handleResendOTP}
                                disabled={resendDisabled}
                                className="text-xs text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
                            >
                                {resendDisabled 
                                    ? `Resend in ${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, '0')}` 
                                    : 'Resend OTP'}
                            </button>
                        </div>
                        <Input
                            id="otp"
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="Enter 6-digit OTP"
                            maxLength={6}
                            className="bg-background"
                            required
                        />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        <Checkbox 
                            id="remember-device" 
                            checked={rememberDevice}
                            onCheckedChange={setRememberDevice}
                        />
                        <Label 
                            htmlFor="remember-device"
                            className="text-sm font-normal text-muted-foreground"
                        >
                            Remember this device (skip OTP next time)
                        </Label>
                    </div>
                    
                    <Button 
                        type="submit"
                        className="w-full"
                        disabled={loading}
                    >
                        {loading ? 'Verifying...' : 'Verify'}
                    </Button>
                </form>
            </div>
        </div>
    )
}

export default OTPVerification