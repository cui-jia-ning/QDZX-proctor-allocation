import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useStudentStore = defineStore('students', () => {
  const students = ref([])
  const rooms = ref([])

  const subjectCombos = computed(() => {
    const combos = new Set()
    students.value.forEach(s => {
      if (s.subjectCombo) combos.add(s.subjectCombo)
    })
    return Array.from(combos).sort()
  })

  const studentsByCombo = computed(() => {
    const groups = new Map()
    students.value.forEach(s => {
      const combo = s.subjectCombo || '未分科'
      if (!groups.has(combo)) {
        groups.set(combo, [])
      }
      groups.get(combo).push(s)
    })
    return groups
  })

  function importStudents(data) {
    students.value = data.map((s, idx) => ({
      id: s.id || `stu_${idx}`,
      name: s.name,
      class: s.class || '',
      studentId: s.studentId || '',
      subjectCombo: s.subjectCombo || '',
      roomId: s.roomId || '',
      seatNumber: s.seatNumber || ''
    }))
  }

  function generateRooms(perRoom = 30) {
    const newRooms = []
    let roomNum = 1

    for (const [combo, students] of studentsByCombo.value) {
      // Shuffle students for random distribution
      const shuffled = [...students].sort(() => Math.random() - 0.5)
      
      const roomCount = Math.ceil(shuffled.length / perRoom)
      
      for (let i = 0; i < roomCount; i++) {
        const start = i * perRoom
        const end = Math.min(start + perRoom, shuffled.length)
        const roomStudents = shuffled.slice(start, end)
        
        const roomId = `room_${roomNum}`
        const roomName = `第${roomNum}考场`
        
        newRooms.push({
          id: roomId,
          name: roomName,
          location: '',
          capacity: roomStudents.length,
          subjectCombo: combo
        })
        
        // Assign students to this room
        roomStudents.forEach((student, seatIdx) => {
          const studentIdx = students.value.findIndex(s => s.id === student.id)
          if (studentIdx !== -1) {
            students.value[studentIdx].roomId = roomId
            students.value[studentIdx].seatNumber = String(seatIdx + 1).padStart(2, '0')
          }
        })
        
        roomNum++
      }
    }
    
    rooms.value = newRooms
    return newRooms
  }

  function updateRoom(roomId, updates) {
    const index = rooms.value.findIndex(r => r.id === roomId)
    if (index !== -1) {
      rooms.value[index] = { ...rooms.value[index], ...updates }
    }
  }

  function clearAll() {
    students.value = []
    rooms.value = []
  }

  return {
    students,
    rooms,
    subjectCombos,
    studentsByCombo,
    importStudents,
    generateRooms,
    updateRoom,
    clearAll
  }
})
