import { useTeacherStore } from './teacherStore'
import { useRoomStore } from './roomStore'
import { useExamStore } from './examStore'
import { useAllocationStore } from './allocationStore'

export function allocateProctors() {
  const teacherStore = useTeacherStore()
  const roomStore = useRoomStore()
  const examStore = useExamStore()
  const allocationStore = useAllocationStore()

  const teachers = teacherStore.teachers
  const rooms = roomStore.rooms
  const exams = examStore.exams

  if (!teachers.length || !rooms.length || !exams.length) {
    return { success: false, message: '请先导入教师、考场和考试安排数据' }
  }

  const teacherLoad = new Map()
  teachers.forEach(t => teacherLoad.set(t.id, 0))

  const teacherSchedule = new Map()
  teachers.forEach(t => teacherSchedule.set(t.id, new Set()))

  const results = []

  const sortedExams = [...exams].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    return a.timeSlot.localeCompare(b.timeSlot)
  })

  for (const exam of sortedExams) {
    const timeKey = `${exam.date}_${exam.timeSlot}`
    const subject = exam.subject

    const availableTeachers = teachers.filter(t => {
      if (t.subject === subject) return false
      if (t.unavailableSlots?.includes(timeKey)) return false
      if (teacherSchedule.get(t.id).has(timeKey)) return false
      return true
    })

    availableTeachers.sort((a, b) => {
      const loadA = teacherLoad.get(a.id) || 0
      const loadB = teacherLoad.get(b.id) || 0
      return loadA - loadB
    })

    const examRooms = exam.rooms?.length ? exam.rooms : rooms.map(r => r.id)
    
    for (const roomId of examRooms) {
      const existing = allocationStore.allocations.find(a => 
        a.examId === exam.id && a.roomId === roomId && a.locked
      )
      
      if (existing) {
        existing.teacherIds.forEach(tid => {
          teacherSchedule.get(tid)?.add(timeKey)
          teacherLoad.set(tid, (teacherLoad.get(tid) || 0) + 1)
        })
        results.push(existing)
        continue
      }

      const needed = 2
      const assigned = []

      for (const teacher of availableTeachers) {
        if (assigned.length >= needed) break
        if (assigned.find(a => a.id === teacher.id)) continue
        
        assigned.push(teacher)
      }

      if (assigned.length < needed) {
        console.warn(`考试 ${subject} 考场 ${roomId} 教师不足：需要 ${needed} 人，分配 ${assigned.length} 人`)
      }

      const allocation = {
        examId: exam.id,
        roomId: roomId,
        teacherIds: assigned.map(t => t.id),
        locked: false
      }

      allocationStore.setAllocation(allocation)
      results.push(allocation)

      assigned.forEach(t => {
        teacherSchedule.get(t.id).add(timeKey)
        teacherLoad.set(t.id, (teacherLoad.get(t.id) || 0) + 1)
      })

      const idx = availableTeachers.findIndex(t => t.id === assigned[0]?.id)
      if (idx !== -1) availableTeachers.splice(idx, assigned.length)
    }
  }

  const conflicts = detectConflicts()

  return {
    success: true,
    message: `成功分配 ${results.length} 个考场`,
    conflicts
  }
}

export function detectConflicts() {
  const teacherStore = useTeacherStore()
  const examStore = useExamStore()
  const allocationStore = useAllocationStore()

  const conflicts = []

  const teacherAssignments = new Map()
  
  for (const alloc of allocationStore.allocations) {
    const exam = examStore.exams.find(e => e.id === alloc.examId)
    if (!exam) continue

    const timeKey = `${exam.date}_${exam.timeSlot}`

    for (const teacherId of alloc.teacherIds) {
      if (!teacherAssignments.has(teacherId)) {
        teacherAssignments.set(teacherId, [])
      }
      teacherAssignments.get(teacherId).push({
        examId: alloc.examId,
        roomId: alloc.roomId,
        timeKey,
        subject: exam.subject
      })
    }
  }

  for (const [teacherId, assignments] of teacherAssignments) {
    const timeGroups = new Map()
    for (const a of assignments) {
      if (!timeGroups.has(a.timeKey)) {
        timeGroups.set(a.timeKey, [])
      }
      timeGroups.get(a.timeKey).push(a)
    }

    for (const [timeKey, group] of timeGroups) {
      if (group.length > 1) {
        const teacher = teacherStore.teachers.find(t => t.id === teacherId)
        conflicts.push({
          type: 'TIME_CONFLICT',
          teacherId,
          teacherName: teacher?.name || '未知',
          timeKey,
          assignments: group
        })
      }
    }

    for (const a of assignments) {
      const teacher = teacherStore.teachers.find(t => t.id === teacherId)
      if (teacher && teacher.subject === a.subject) {
        conflicts.push({
          type: 'SUBJECT_CONFLICT',
          teacherId,
          teacherName: teacher?.name || '未知',
          subject: a.subject,
          examId: a.examId,
          roomId: a.roomId
        })
      }
    }
  }

  return conflicts
}
