<template>
  <div class="allocation-view">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>监考分配</span>
          <div>
            <el-button type="primary" @click="handleAutoAllocate">
              <el-icon><MagicStick /></el-icon>自动分配
            </el-button>
            <el-button @click="handleClearUnlocked">
              <el-icon><RefreshLeft /></el-icon>清除未锁定
            </el-button>
            <el-button type="danger" @click="handleClearAll">
              <el-icon><Delete /></el-icon>清空全部
            </el-button>
          </div>
        </div>
      </template>

      <el-alert v-if="conflicts.length" type="error" :closable="false" style="margin-bottom: 16px">
        <template #title>
          发现 {{ conflicts.length }} 个冲突
        </template>
        <div v-for="(c, i) in conflicts" :key="i">
          <span v-if="c.type === 'TIME_CONFLICT'">
            {{ c.teacherName }} 在 {{ c.timeKey }} 有 {{ c.assignments.length }} 个考场
          </span>
          <span v-else-if="c.type === 'SUBJECT_CONFLICT'">
            {{ c.teacherName }} 监考自己所教科目 {{ c.subject }}
          </span>
        </div>
      </el-alert>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="按考试查看" name="byExam">
          <div v-for="exam in examStore.exams" :key="exam.id" class="exam-section">
            <h4>{{ exam.subject }} - {{ exam.date }} {{ exam.timeSlot }}</h4>
            <el-table :data="getExamAllocations(exam.id)" stripe size="small">
              <el-table-column label="考场" width="120">
                <template #default="{ row }">
                  {{ getRoomName(row.roomId) }}
                  <el-icon v-if="row.locked" style="color: #e6a23c"><Lock /></el-icon>
                </template>
              </el-table-column>
              <el-table-column label="监考教师">
                <template #default="{ row }">
                  <el-tag 
                    v-for="tid in row.teacherIds" 
                    :key="tid" 
                    style="margin-right: 8px"
                    closable
                    @close="removeTeacher(row, tid)"
                  >
                    {{ getTeacherName(tid) }}
                  </el-tag>
                  <el-button 
                    type="primary" 
                    link 
                    size="small"
                    @click="showAddTeacherDialog(row)"
                  >
                    + 添加
                  </el-button>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100">
                <template #default="{ row }">
                  <el-button 
                    type="primary" 
                    link 
                    @click="toggleLock(row)"
                  >
                    {{ row.locked ? '解锁' : '锁定' }}
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <el-tab-pane label="按教师查看" name="byTeacher">
          <el-table :data="teacherScheduleData" stripe>
            <el-table-column prop="teacherName" label="教师" width="120" />
            <el-table-column prop="subject" label="科目" width="100" />
            <el-table-column label="监考场次">
              <template #default="{ row }">
                <el-tag 
                  v-for="(a, i) in row.assignments" 
                  :key="i" 
                  style="margin: 2px"
                  size="small"
                >
                  {{ a }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="total" label="总场次" width="80" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="showTeacherDialog" title="添加监考教师" width="400px">
      <el-select v-model="selectedTeacherId" filterable placeholder="选择教师" style="width: 100%">
        <el-option 
          v-for="t in availableTeachersForCurrent" 
          :key="t.id" 
          :label="`${t.name} (${t.subject})`" 
          :value="t.id"
        />
      </el-select>
      <template #footer>
        <el-button @click="showTeacherDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmAddTeacher">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useTeacherStore } from '../../stores/teacherStore'
import { useRoomStore } from '../../stores/roomStore'
import { useExamStore } from '../../stores/examStore'
import { useAllocationStore } from '../../stores/allocationStore'
import { allocateProctors, detectConflicts } from '../../stores/allocationAlgorithm'

const teacherStore = useTeacherStore()
const roomStore = useRoomStore()
const examStore = useExamStore()
const allocationStore = useAllocationStore()

const activeTab = ref('byExam')
const conflicts = ref([])
const showTeacherDialog = ref(false)
const selectedTeacherId = ref('')
const currentRow = ref(null)

const availableTeachersForCurrent = computed(() => {
  if (!currentRow.value) return []
  const exam = examStore.exams.find(e => e.id === currentRow.value.examId)
  if (!exam) return []
  
  const timeKey = `${exam.date}_${exam.timeSlot}`
  
  return teacherStore.teachers.filter(t => {
    if (t.subject === exam.subject) return false
    if (t.unavailableSlots?.includes(timeKey)) return false
    if (currentRow.value.teacherIds.includes(t.id)) return false
    
    const hasConflict = allocationStore.allocations.some(a => {
      if (a.examId === currentRow.value.examId) return false
      const otherExam = examStore.exams.find(e => e.id === a.examId)
      if (!otherExam) return false
      const otherTimeKey = `${otherExam.date}_${otherExam.timeSlot}`
      return otherTimeKey === timeKey && a.teacherIds.includes(t.id)
    })
    
    return !hasConflict
  })
})

const teacherScheduleData = computed(() => {
  const data = []
  
  for (const teacher of teacherStore.teachers) {
    const assignments = []
    
    for (const alloc of allocationStore.allocations) {
      if (!alloc.teacherIds.includes(teacher.id)) continue
      const exam = examStore.exams.find(e => e.id === alloc.examId)
      if (!exam) continue
      assignments.push(`${exam.subject} ${getRoomName(alloc.roomId)}`)
    }
    
    data.push({
      teacherId: teacher.id,
      teacherName: teacher.name,
      subject: teacher.subject,
      assignments,
      total: assignments.length
    })
  }
  
  return data.sort((a, b) => b.total - a.total)
})

function getTeacherName(id) {
  return teacherStore.teachers.find(t => t.id === id)?.name || '未知'
}

function getRoomName(id) {
  return roomStore.rooms.find(r => r.id === id)?.name || '未知考场'
}

function getExamAllocations(examId) {
  return allocationStore.allocations.filter(a => a.examId === examId)
}

function handleAutoAllocate() {
  const result = allocateProctors()
  if (result.success) {
    ElMessage.success(result.message)
    conflicts.value = result.conflicts || []
    if (conflicts.value.length) {
      ElMessage.warning(`发现 ${conflicts.value.length} 个冲突，请手动调整`)
    }
  } else {
    ElMessage.error(result.message)
  }
}

function handleClearUnlocked() {
  ElMessageBox.confirm('确定要清除所有未锁定的分配吗？', '提示', {
    type: 'warning'
  }).then(() => {
    allocationStore.clearUnlocked()
    conflicts.value = detectConflicts()
    ElMessage.success('已清除')
  }).catch(() => {})
}

function handleClearAll() {
  ElMessageBox.confirm('确定要清空所有分配吗？', '警告', {
    type: 'warning'
  }).then(() => {
    allocationStore.clearAll()
    conflicts.value = []
    ElMessage.success('已清空')
  }).catch(() => {})
}

function toggleLock(row) {
  allocationStore.toggleLock(row.examId, row.roomId)
}

function showAddTeacherDialog(row) {
  currentRow.value = row
  selectedTeacherId.value = ''
  showTeacherDialog.value = true
}

function confirmAddTeacher() {
  if (!selectedTeacherId.value) {
    ElMessage.warning('请选择教师')
    return
  }
  
  const newTeacherIds = [...currentRow.value.teacherIds, selectedTeacherId.value]
  allocationStore.updateTeachers(currentRow.value.examId, currentRow.value.roomId, newTeacherIds)
  showTeacherDialog.value = false
  conflicts.value = detectConflicts()
  ElMessage.success('添加成功')
}

function removeTeacher(row, teacherId) {
  const newTeacherIds = row.teacherIds.filter(id => id !== teacherId)
  allocationStore.updateTeachers(row.examId, row.roomId, newTeacherIds)
  conflicts.value = detectConflicts()
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.exam-section {
  margin-bottom: 24px;
}

.exam-section h4 {
  margin: 0 0 12px 0;
  color: #303133;
}
</style>
