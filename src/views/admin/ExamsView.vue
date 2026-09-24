<template>
  <div class="exams-view">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>考试安排</span>
          <div>
            <el-button type="primary" @click="showImportDialog = true">
              <el-icon><Upload /></el-icon>导入 Excel
            </el-button>
            <el-button @click="showAddDialog = true">
              <el-icon><Plus /></el-icon>添加考试
            </el-button>
            <el-button type="danger" @click="handleClear">
              <el-icon><Delete /></el-icon>清空
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="examStore.exams" stripe>
        <el-table-column prop="subject" label="科目" width="120" />
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="timeSlot" label="时间段" width="150" />
        <el-table-column label="考场数">
          <template #default="{ row }">
            {{ row.rooms?.length || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="stats">
        共 {{ examStore.exams.length }} 场考试，{{ examStore.examSlots.length }} 个时间段
      </div>
    </el-card>

    <el-dialog v-model="showAddDialog" title="添加考试" width="500px">
      <el-form :model="newExam" label-width="100px">
        <el-form-item label="科目" required>
          <el-input v-model="newExam.subject" />
        </el-form-item>
        <el-form-item label="日期" required>
          <el-date-picker v-model="newExam.date" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="时间段" required>
          <el-select v-model="newExam.timeSlot" placeholder="选择时间段">
            <el-option label="上午 8:00-10:00" value="上午 8:00-10:00" />
            <el-option label="上午 10:30-12:30" value="上午 10:30-12:30" />
            <el-option label="下午 14:00-16:00" value="下午 14:00-16:00" />
            <el-option label="下午 16:30-18:30" value="下午 16:30-18:30" />
            <el-option label="晚上 19:00-21:00" value="晚上 19:00-21:00" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAdd">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showImportDialog" title="导入考试安排" width="600px">
      <el-alert type="info" :closable="false" style="margin-bottom: 16px">
        Excel 格式要求：第一行为表头（科目、日期、时间段），从第二行开始为数据
      </el-alert>
      <el-upload
        ref="uploadRef"
        drag
        :auto-upload="false"
        :limit="1"
        accept=".xlsx,.xls"
        :on-change="handleFileChange"
      >
        <el-icon style="font-size: 40px; color: #909399"><Upload /></el-icon>
        <div>拖拽文件到此处，或<em>点击上传</em></div>
      </el-upload>
      <template #footer>
        <el-button @click="showImportDialog = false">取消</el-button>
        <el-button type="primary" @click="handleImport" :disabled="!importFile">导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useExamStore } from '../../stores/examStore'
import * as XLSX from 'xlsx'

const examStore = useExamStore()

const showAddDialog = ref(false)
const showImportDialog = ref(false)
const importFile = ref(null)

const newExam = reactive({
  subject: '',
  date: '',
  timeSlot: ''
})

function handleAdd() {
  if (!newExam.subject || !newExam.date || !newExam.timeSlot) {
    ElMessage.warning('请填写完整信息')
    return
  }
  examStore.addExam({ ...newExam })
  newExam.subject = ''
  newExam.date = ''
  newExam.timeSlot = ''
  showAddDialog.value = false
  ElMessage.success('添加成功')
}

function handleEdit(row) {
  ElMessage.info('编辑功能开发中')
}

function handleDelete(id) {
  examStore.removeExam(id)
  ElMessage.success('删除成功')
}

function handleClear() {
  ElMessageBox.confirm('确定要清空所有考试安排吗？', '警告', {
    type: 'warning'
  }).then(() => {
    examStore.clearAll()
    ElMessage.success('已清空')
  }).catch(() => {})
}

function handleFileChange(file) {
  importFile.value = file.raw
}

function handleImport() {
  if (!importFile.value) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result)
    const workbook = XLSX.read(data, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const json = XLSX.utils.sheet_to_json(sheet)
    
    const exams = json.map(row => ({
      subject: row['科目'] || row['subject'],
      date: row['日期'] || row['date'],
      timeSlot: row['时间段'] || row['时间'] || row['timeSlot']
    })).filter(e => e.subject && e.date && e.timeSlot)
    
    examStore.importExams(exams)
    showImportDialog.value = false
    importFile.value = null
    ElMessage.success(`成功导入 ${exams.length} 场考试`)
  }
  reader.readAsArrayBuffer(importFile.value)
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats {
  margin-top: 16px;
  color: #909399;
  font-size: 14px;
}
</style>
