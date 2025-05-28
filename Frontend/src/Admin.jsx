import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { Label } from './components/ui/label'

const Admin = () => {
    const [users, setUsers] = useState([])
    const [message, setMessage] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [loading, setLoading] = useState(true)
    
    // Function to fetch all users
    const fetchUsers = async () => {
        setLoading(true)
        try {
            // Note: In a real app, this would require admin authentication
            const response = await axios.get('http://localhost:5002/api/users')
            setUsers(response.data)
        } catch (error) {
            console.error('Error fetching users:', error)
            setMessage('Error fetching users: ' + error.message)
        } finally {
            setLoading(false)
        }
    }
    
    // Function to delete all users
    const deleteAllUsers = async () => {
        if (!window.confirm('Are you sure you want to delete ALL users? This action cannot be undone.')) {
            return
        }
        
        try {
            await axios.delete('http://localhost:5002/api/users/delete-all')
            setMessage('All users deleted successfully')
            setUsers([])
        } catch (error) {
            setMessage('Error deleting users: ' + error.message)
        }
    }
    
    // Function to delete a specific user
    const deleteUser = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete user ${name}?`)) {
            return
        }
        
        try {
            await axios.delete(`http://localhost:5002/api/users/delete/${id}`)
            setMessage('User deleted successfully')
            fetchUsers() // Refresh the list
        } catch (error) {
            setMessage('Error deleting user: ' + error.message)
        }
    }
    
    useEffect(() => {
        fetchUsers()
    }, [])
    
    // Filter users based on search term
    const filteredUsers = users.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    
    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Panel</h1>
                    <Button 
                        variant="destructive" 
                        onClick={deleteAllUsers}
                    >
                        Delete All Users
                    </Button>
                </div>
                
                {message && (
                    <div className={`p-4 rounded-md ${message.includes('Error') ? 'bg-destructive/15 text-destructive' : 'bg-green-500/15 text-green-500'} font-medium`}>
                        {message}
                    </div>
                )}
                
                <div className="bg-card rounded-lg border border-border p-6 shadow-md">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold">User Management</h2>
                        <div className="w-1/3">
                            <Input
                                type="text"
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-background"
                            />
                        </div>
                    </div>
                    
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">Loading users...</div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            {searchTerm ? 'No users match your search' : 'No users found'}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Email</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map(user => (
                                        <tr key={user._id} className="border-b border-border hover:bg-muted/50">
                                            <td className="py-3 px-4">{user.name}</td>
                                            <td className="py-3 px-4">{user.email}</td>
                                            <td className="py-3 px-4">
                                                <Button 
                                                    variant="destructive" 
                                                    size="sm"
                                                    onClick={() => deleteUser(user._id, user.name)}
                                                >
                                                    Delete
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Admin