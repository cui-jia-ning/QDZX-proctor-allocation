<template>
  <div class="export-view">
    <el-card>
      <template #header>
        <span>导出发布</span>
      </template>

      <el-alert type="info" :closable="false" style="margin-bottom: 24px">
        导出监考安排数据，供教师查询使用。数据文件需要上传到静态网站的数据目录中。
      </el-alert>

      <el-space direction="vertical" :size="20" style="width: 100%">
        <div>
          <h4>1. 导出总表 Excel</h4>
          <p style="color: #909399; font-size: 14px">包含所有考场的监考安排，可打印分发</p>
          <el-button type="primary" @click="exportExcel">
            <el-icon><Download /></el-icon>导出 Excel 总表
          </el-button>
        </div>

        <el-divider />

        <div>
          <h4>2. 生成教师查询数据</h4>
          <p style="color: #909399; font-size: 14px">
            生成 JSON 数据文件，教师可在查询页面输入姓名查看自己的监考安排
          </p>
          <el-button type="success" @click="generateDataFile">
            <el-icon><Document /></el-icon>生成数据文件
          </el-button>
          <el-button @click="downloadDataFile" :disabled="!dataFileContent">
            <el-icon><Download /></el-icon>下载 JSON 文件
          </el-button>
        </div>

        <el-divider />

        <div>
          <h4>3. 数据预览</h4>
          <el-table :data="previewData" stripe max-height="400">
            <el-table-column prop="teacherName" label="教师" width="100" />
            <el-table-column prop="subject" label="科目" width="80" />
            <el-table-column label="监考安排">
              <template #default="{ row }">
                <el-tag 
                  v-for="(a, i) in row.assignments" 
                  :key="i" 
                  size="small"
                  style="margin: 2px"
                >
                  {{ a.examSubject }} - {{ a.roomName }} ({{ a.date }} {{ a.timeSlot }})
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-space>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useTeacherStore } from '../../stores/teacherStore'
import { useRoomStore } from '../../stores/roomStore'
import { useExamStore } from '../../stores/examStore'
import { useAllocationStore } from '../../stores/allocationStore'
import * as XLSX from 'xlsx'

const teacherStore = useTeacherStore()
const roomStore = useRoomStore()
const examStore = useExamStore()
const allocationStore = useAllocationStore()

const dataFileContent = ref('')

const previewData = computed(() => {
  const data = []
  
  for (const teacher of teacherStore.teachers) {
    const assignments = []
    
    for (const alloc of allocationStore.allocations) {
      if (!alloc.teacherIds.includes(teacher.id)) continue
      const exam = examStore.exams.find(e => e.id === alloc.examId)
      const room = roomStore.rooms.find(r => r.id === alloc.roomId)
      if (!exam || !room) continue
      
      assignments.push({
        examSubject: exam.subject,
        roomName: room.name,
        date: exam.date,
        timeSlot: exam.timeSlot
      })
    }
    
    if (assignments.length) {
      data.push({
        teacherId: teacher.id,
        teacherName: teacher.name,
        subject: teacher.subject,
        assignments
      })
    }
  }
  
  return data
})

function exportExcel() {
  const rows = []
  
  for (const alloc of allocationStore.allocations) {
    const exam = examStore.exams.find(e => e.id === alloc.examId)
    const room = roomStore.rooms.find(r => r.id === alloc.roomId)
    if (!exam || !room) continue
    
    const teacherNames = alloc.teacherIds.map(id => 
      teacherStore.teachers.find(t => t.id === id)?.name || '未知'
    ).join('、')
    
    rows.push({
      '日期': exam.date,
      '时间段': exam.timeSlot,
      '科目': exam.subject,
      '考场': room.name,
      '位置': room.location,
      '监考教师': teacherNames
    })
  }
  
  rows.sort((a, b) => {
    if (a['日期'] !== b['日期']) return a['日期'].localeCompare(b['日期'])
    return a['时间段'].localeCompare(b['时间段'])
  })
  
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '监考安排')
  
  ws['!cols'] = [
    { wch: 12 }, { wch: 18 }, { wch: 10 }, 
    { wch: 12 }, { wch: 15 }, { wch: 20 }
  ]
  
  XLSX.writeFile(wb, `监考安排_${new Date().toISOString().slice(0, 10)}.xlsx`)
  ElMessage.success('导出成功')
}

function generateDataFile() {
  const data = {
    generatedAt: new Date().toISOString(),
    teachers: previewData.value.map(t => ({
      id: t.teacherId,
      name: t.teacherName,
      subject: t.subject,
      assignments: t.assignments
    }))
  }
  
  dataFileContent.value = JSON.stringify(data, null, 2)
  ElMessage.success('数据文件已生成，点击下载')
}

function downloadDataFile() {
  if (!dataFileContent.value) return
  
  const blob = new Blob([dataFileContent.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `proctor-data-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('下载成功')
}
</script>

<style scoped>
h4 {
  margin: 0 0 8px 0;
  color: #303133;
}

p {
  margin: 0 0 12px 0;
}
</style>
