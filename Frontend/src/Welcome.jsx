import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from './components/ui/button'

const Welcome = () => {
    const [user, setUser] = useState(null)
    const navigate = useNavigate()
    
    useEffect(() => {
        // Check if user is logged in
        const loggedInUser = localStorage.getItem('user')
        if (loggedInUser) {
            const foundUser = JSON.parse(loggedInUser)
            setUser(foundUser)
        } else {
            // Redirect to login if not logged in
            navigate('/SignIn')
        }
    }, [])
    
    const handleLogout = () => {
        // Clear user from localStorage and state
        localStorage.removeItem('user')
        setUser(null)
        navigate('/SignIn')
    }
    
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-lg p-8 bg-card rounded-xl shadow-lg border border-border text-center space-y-8">
                <div className="space-y-4">
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
                        Welcome, {user?.name}!
                    </h1>
                    <p className="text-xl text-muted-foreground">
                        You have successfully logged in to your account.
                    </p>
                </div>
                
                <div className="p-6 bg-muted/50 rounded-lg border border-border">
                    <p className="text-lg font-medium mb-2">Account Information</p>
                    <p className="text-muted-foreground mb-1">Email: {user?.email}</p>
                    <p className="text-muted-foreground">Username: {user?.name}</p>
                </div>
                
                <div className="pt-4">
                    <Button 
                        variant="destructive" 
                        size="lg"
                        onClick={handleLogout}
                        className="px-8"
                    >
                        Logout
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default Welcome