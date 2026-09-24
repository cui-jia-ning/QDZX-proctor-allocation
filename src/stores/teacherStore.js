import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useTeacherStore = defineStore('teachers', () => {
  const teachers = ref([])

  const teacherMap = computed(() => {
    const map = new Map()
    teachers.value.forEach(t => map.set(t.id, t))
    return map
  })

  function addTeacher(teacher) {
    teachers.value.push({
      id: teacher.id || Date.now().toString(),
      name: teacher.name,
      subject: teacher.subject,
      department: teacher.department || '',
      unavailableSlots: teacher.unavailableSlots || []
    })
  }

  function updateTeacher(id, updates) {
    const index = teachers.value.findIndex(t => t.id === id)
    if (index !== -1) {
      teachers.value[index] = { ...teachers.value[index], ...updates }
    }
  }

  function removeTeacher(id) {
    teachers.value = teachers.value.filter(t => t.id !== id)
  }

  function importTeachers(data) {
    teachers.value = data.map(t => ({
      id: t.id || Date.now().toString() + Math.random(),
      name: t.name,
      subject: t.subject,
      department: t.department || '',
      unavailableSlots: t.unavailableSlots || []
    }))
  }

  function clearAll() {
    teachers.value = []
  }

  return {
    teachers,
    teacherMap,
    addTeacher,
    updateTeacher,
    removeTeacher,
    importTeachers,
    clearAll
  }
})
