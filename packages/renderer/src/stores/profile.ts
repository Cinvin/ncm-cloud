import { defineStore } from 'pinia'

export const useProfileStore = defineStore('profile', {
  state: () => {
    return { 
        userId: 0,
        nickname: '',
        avatarUrl: '',
        signature: '',
    }
  },
})