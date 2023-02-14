import { defineStore } from 'pinia'

export const useTaskStatusStore = defineStore('taskStatus', {
  state: () => {
    return {
      working:false,
    }
  },
})