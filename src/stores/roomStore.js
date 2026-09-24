import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useRoomStore = defineStore('rooms', () => {
  const rooms = ref([])

  const roomMap = computed(() => {
    const map = new Map()
    rooms.value.forEach(r => map.set(r.id, r))
    return map
  })

  function addRoom(room) {
    rooms.value.push({
      id: room.id || Date.now().toString(),
      name: room.name,
      location: room.location || '',
      capacity: room.capacity || 30
    })
  }

  function updateRoom(id, updates) {
    const index = rooms.value.findIndex(r => r.id === id)
    if (index !== -1) {
      rooms.value[index] = { ...rooms.value[index], ...updates }
    }
  }

  function removeRoom(id) {
    rooms.value = rooms.value.filter(r => r.id !== id)
  }

  function importRooms(data) {
    rooms.value = data.map(r => ({
      id: r.id || Date.now().toString() + Math.random(),
      name: r.name,
      location: r.location || '',
      capacity: r.capacity || 30
    }))
  }

  function clearAll() {
    rooms.value = []
  }

  return {
    rooms,
    roomMap,
    addRoom,
    updateRoom,
    removeRoom,
    importRooms,
    clearAll
  }
})
