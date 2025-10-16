import React, { useState, useEffect } from 'react'
import { getAuthToken } from '../utils/auth'
import { FiUser, FiMail, FiLock, FiSave, FiX, FiCamera, FiSettings, FiShield, FiUsers, FiBarChart, FiDatabase } from 'react-icons/fi'
import './UserProfile.css'

export default function UserProfile({ onClose }) {
  const [user, setUser] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [userStats, setUserStats] = useState(null)
  
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    fullName: '',
    bio: '',
    avatar: ''
  })
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchUserProfile()
    fetchUserStats()
  }, [])

  const fetchUserProfile = async () => {
    try {
      // Try sessionStorage first (tab-specific), then localStorage
      const token = getAuthToken();
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const response = await fetch('http://localhost:3001/api/auth/me', {
        headers
      })
      
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setProfileData({
          username: data.user.username || '',
          email: data.user.email || '',
          fullName: data.user.name || data.user.username || '',
          bio: data.user.bio || '',
          avatar: data.user.avatar || ''
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const fetchUserStats = async () => {
    try {
      // Try sessionStorage first (tab-specific), then localStorage
      const token = getAuthToken();
      if (!token) return
      const response = await fetch('http://localhost:3001/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } })

      if (response.ok) {
        const data = await response.json()
        
        // Simple stats for all users
        const stats = {
          accountCreated: data.user.createdAt,
          lastLogin: data.user.lastLogin,
          role: data.user.role
        }

        setUserStats(stats)
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
    }
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    
    try {
      // Try sessionStorage first (tab-specific), then localStorage
      const token = getAuthToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const response = await fetch('http://localhost:3001/api/auth/profile', {
        method: 'PUT',
        headers: {
          ...headers
        },
        body: JSON.stringify({
          name: profileData.fullName || profileData.username,
          bio: profileData.bio
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setUser(data.user)
        setIsEditing(false)
        alert('✅ Profile updated successfully!')
      } else {
        setErrors({ general: data.message || 'Failed to update profile' })
      }
    } catch (error) {
      setErrors({ general: 'Error updating profile' })
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' })
      setLoading(false)
      return
    }
    
    if (passwordData.newPassword.length < 6) {
      setErrors({ newPassword: 'Password must be at least 6 characters' })
      setLoading(false)
      return
    }
    
    try {
      // Try sessionStorage first (tab-specific), then localStorage
      const token = getAuthToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const response = await fetch('http://localhost:3001/api/auth/change-password', {
        method: 'PUT',
        headers: {
          ...headers
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        alert('✅ Password changed successfully!')
        setIsChangingPassword(false)
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      } else {
        setErrors({ general: data.message || 'Failed to change password' })
      }
    } catch (error) {
      setErrors({ general: 'Error changing password' })
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    if (!file.type.startsWith('image/')) {
      alert('❌ Please upload an image file')
      return
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert('❌ Image size should be less than 5MB')
      return
    }
    
    const formData = new FormData()
    formData.append('avatar', file)
    formData.append('name', profileData.fullName || profileData.username)
    formData.append('bio', profileData.bio)
    
    try {
      setLoading(true)
      // Try sessionStorage first (tab-specific), then localStorage
      const token = getAuthToken();
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const response = await fetch('http://localhost:3001/api/auth/profile', {
        method: 'PUT',
        headers: headers,
        body: formData
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setProfileData({ ...profileData, avatar: data.user.avatar })
        setUser({ ...user, avatar: data.user.avatar })
        alert('✅ Avatar updated successfully!')
      } else {
        alert('❌ Failed to upload avatar')
      }
    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert('❌ Error uploading avatar')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="profile-overlay" onClick={(e) => {
      if (e.target.className === 'profile-overlay') {
        onClose()
      }
    }}>
      <div className="profile-container">
        <div className="profile-header">
          <h2><FiUser /> User Profile</h2>
          <button className="profile-close-btn" onClick={onClose}>
            <FiX size={24} />
          </button>
        </div>

        <div className="profile-content">
          <div className="profile-avatar-section">
            <div className="avatar-wrapper">
              {profileData.avatar ? (
                <img src={profileData.avatar} alt="Avatar" className="profile-avatar" />
              ) : (
                <div className="profile-avatar-placeholder">
                  <FiUser size={64} />
                </div>
              )}
              <label className="avatar-upload-btn" htmlFor="avatar-upload">
                <FiCamera size={20} />
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
            <div className="profile-info-header">
              <h3>{user.fullName || user.username}</h3>
              <div className="profile-role-badge">
                {user.role === 'admin' ? (
                  <span className="admin-role">
                    <FiShield size={16} /> Administrator
                  </span>
                ) : (
                  <span className="user-role">
                    <FiUser size={16} /> User
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Simple Account Info Section */}
          {userStats && (
            <div className="profile-stats-section">
              <h4>
                <FiUser size={18} /> Account Information
              </h4>
              
              <div className="stats-grid">
                <div className="stat-item">
                  <FiUser size={20} />
                  <div>
                    <span className="stat-number">
                      {userStats.accountCreated ? 
                        new Date(userStats.accountCreated).toLocaleDateString() : 
                        'N/A'
                      }
                    </span>
                    <span className="stat-label">Member Since</span>
                  </div>
                </div>
                <div className="stat-item">
                  <FiSettings size={20} />
                  <div>
                    <span className="stat-number">
                      {userStats.lastLogin ? 
                        new Date(userStats.lastLogin).toLocaleDateString() : 
                        'Never'
                      }
                    </span>
                    <span className="stat-label">Last Login</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isChangingPassword ? (
            <form onSubmit={handleProfileUpdate} className="profile-form">
              <div className="form-group">
                <label><FiUser /> Username</label>
                <input
                  type="text"
                  value={profileData.username}
                  onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="form-group">
                <label><FiMail /> Email</label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="form-group">
                <label><FiUser /> Full Name</label>
                <input
                  type="text"
                  value={profileData.fullName}
                  onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="form-group">
                <label><FiSettings /> Bio</label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              </div>

              {errors.general && (
                <div className="error-message">{errors.general}</div>
              )}

              <div className="profile-actions">
                {!isEditing ? (
                  <>
                    <button type="button" className="btn-edit" onClick={() => setIsEditing(true)}>
                      <FiSettings /> Edit Profile
                    </button>
                    <button type="button" className="btn-password" onClick={() => setIsChangingPassword(true)}>
                      <FiLock /> Change Password
                    </button>
                  </>
                ) : (
                  <>
                    <button type="submit" className="btn-save" disabled={loading}>
                      <FiSave /> {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => {
                        setIsEditing(false)
                        setProfileData({
                          username: user.username || '',
                          email: user.email || '',
                          fullName: user.fullName || '',
                          bio: user.bio || '',
                          avatar: user.avatar || ''
                        })
                        setErrors({})
                      }}
                    >
                      <FiX /> Cancel
                    </button>
                  </>
                )}
              </div>
            </form>
          ) : (
            <form onSubmit={handlePasswordChange} className="profile-form">
              <div className="form-group">
                <label><FiLock /> Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                  required
                />
              </div>

              <div className="form-group">
                <label><FiLock /> New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Enter new password (min 6 characters)"
                  required
                />
                {errors.newPassword && (
                  <span className="field-error">{errors.newPassword}</span>
                )}
              </div>

              <div className="form-group">
                <label><FiLock /> Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                  required
                />
                {errors.confirmPassword && (
                  <span className="field-error">{errors.confirmPassword}</span>
                )}
              </div>

              {errors.general && (
                <div className="error-message">{errors.general}</div>
              )}

              <div className="profile-actions">
                <button type="submit" className="btn-save" disabled={loading}>
                  <FiSave /> {loading ? 'Changing...' : 'Change Password'}
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    setIsChangingPassword(false)
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    })
                    setErrors({})
                  }}
                >
                  <FiX /> Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}