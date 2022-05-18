import { defineStore } from 'pinia'

export const useMessageStore = defineStore('message', {
  state: () => {
    return { 
        message: '',
        // 'success' | 'warning' | 'info' | 'error'
        type: 'success',
    }
  },
  actions:{
    
    send(message:string,type:string) {
      this.message=message
      this.type=type
    },
  }
})