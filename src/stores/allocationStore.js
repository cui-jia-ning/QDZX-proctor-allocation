import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAllocationStore = defineStore('allocation', () => {
  const allocations = ref([])

  const allocationMap = computed(() => {
    const map = new Map()
    allocations.value.forEach(a => {
      const key = `${a.examId}_${a.roomId}`
      map.set(key, a)
    })
    return map
  })

  function setAllocation(allocation) {
    const key = `${allocation.examId}_${allocation.roomId}`
    const existing = allocations.value.findIndex(a => 
      a.examId === allocation.examId && a.roomId === allocation.roomId
    )
    if (existing !== -1) {
      allocations.value[existing] = { ...allocations.value[existing], ...allocation }
    } else {
      allocations.value.push({
        examId: allocation.examId,
        roomId: allocation.roomId,
        teacherIds: allocation.teacherIds || [],
        locked: allocation.locked || false
      })
    }
  }

  function updateTeachers(examId, roomId, teacherIds) {
    const allocation = allocations.value.find(a => 
      a.examId === examId && a.roomId === roomId
    )
    if (allocation) {
      allocation.teacherIds = teacherIds
    }
  }

  function toggleLock(examId, roomId) {
    const allocation = allocations.value.find(a => 
      a.examId === examId && a.roomId === roomId
    )
    if (allocation) {
      allocation.locked = !allocation.locked
    }
  }

  function importAllocations(data) {
    allocations.value = data.map(a => ({
      examId: a.examId,
      roomId: a.roomId,
      teacherIds: a.teacherIds || [],
      locked: a.locked || false
    }))
  }

  function clearAll() {
    allocations.value = []
  }

  function clearUnlocked() {
    allocations.value = allocations.value.filter(a => a.locked)
  }

  return {
    allocations,
    allocationMap,
    setAllocation,
    updateTeachers,
    toggleLock,
    importAllocations,
    clearAll,
    clearUnlocked
  }
})
