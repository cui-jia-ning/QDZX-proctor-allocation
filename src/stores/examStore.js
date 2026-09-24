import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useExamStore = defineStore('exams', () => {
  const exams = ref([])

  const examSlots = computed(() => {
    const slots = new Set()
    exams.value.forEach(e => {
      slots.add(`${e.date}_${e.timeSlot}`)
    })
    return Array.from(slots).sort()
  })

  function addExam(exam) {
    exams.value.push({
      id: exam.id || Date.now().toString(),
      subject: exam.subject,
      date: exam.date,
      timeSlot: exam.timeSlot,
      rooms: exam.rooms || []
    })
  }

  function updateExam(id, updates) {
    const index = exams.value.findIndex(e => e.id === id)
    if (index !== -1) {
      exams.value[index] = { ...exams.value[index], ...updates }
    }
  }

  function removeExam(id) {
    exams.value = exams.value.filter(e => e.id !== id)
  }

  function importExams(data) {
    exams.value = data.map(e => ({
      id: e.id || Date.now().toString() + Math.random(),
      subject: e.subject,
      date: e.date,
      timeSlot: e.timeSlot,
      rooms: e.rooms || []
    }))
  }

  function clearAll() {
    exams.value = []
  }

  return {
    exams,
    examSlots,
    addExam,
    updateExam,
    removeExam,
    importExams,
    clearAll
  }
})
