import api from '@/utils/api'

// ==================
// Types
// ==================
export interface Profile {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'MANAGER' | 'STAFF'
  status: 'ACTIVE' | 'INACTIVE'
  avatarUrl?: string
  lastLogin?: string
  createdAt: string
  updatedAt: string
  permissions?: string[]
}

export interface UpdateProfileData {
  name?: string
  email?: string
  avatarUrl?: string
  password?: string
}

// ==================
// Profile API
// ==================
export const profileApi = {
  // 👤 Get current logged-in user profile
  getProfile: () => {
    return api.get<{ data: Profile }>('/auth/profile')
  },

  // ✏️ Update profile of current user
  updateProfile: (data: UpdateProfileData) => {
    return api.put<{ data: Profile }>('/auth/profile', data)
  },

  // 🔑 Change password
  changePassword: (currentPassword: string, newPassword: string) => {
    return api.post('/profile/change-password', {
      currentPassword,
      newPassword,
    })
  },

  // 📸 Update avatar
  uploadAvatar: (file: File) => {
    const formData = new FormData()
    formData.append('avatar', file)

    return api.post<{ data: { avatarUrl: string } }>('/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

export default profileApi