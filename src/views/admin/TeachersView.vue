<template>
  <div class="teachers-view">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>教师管理</span>
          <div>
            <el-button type="primary" @click="showImportDialog = true">
              <el-icon><Upload /></el-icon>导入教师表
            </el-button>
            <el-button @click="showAddDialog = true">
              <el-icon><Plus /></el-icon>添加教师
            </el-button>
            <el-button type="danger" @click="handleClear">
              <el-icon><Delete /></el-icon>清空
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="teacherStore.teachers" stripe>
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="subject" label="所教科目" width="120" />
        <el-table-column prop="department" label="教研组/年级" />
        <el-table-column label="不可用时段" width="120">
          <template #default="{ row }">
            {{ row.unavailableSlots?.length || 0 }}
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
        共 {{ teacherStore.teachers.length }} 位教师
      </div>
    </el-card>

    <el-dialog v-model="showAddDialog" title="添加教师" width="500px">
      <el-form :model="newTeacher" label-width="100px">
        <el-form-item label="姓名" required>
          <el-input v-model="newTeacher.name" />
        </el-form-item>
        <el-form-item label="所教科目" required>
          <el-select v-model="newTeacher.subject" placeholder="选择科目">
            <el-option label="语文" value="语文" />
            <el-option label="数学" value="数学" />
            <el-option label="英语" value="英语" />
            <el-option label="物理" value="物理" />
            <el-option label="化学" value="化学" />
            <el-option label="生物" value="生物" />
            <el-option label="政治" value="政治" />
            <el-option label="历史" value="历史" />
            <el-option label="地理" value="地理" />
          </el-select>
        </el-form-item>
        <el-form-item label="教研组">
          <el-input v-model="newTeacher.department" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAdd">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showImportDialog" title="导入教师数据" width="700px">
      <el-tabs v-model="importTab">
        <el-tab-pane label="任课表导入" name="assignment">
          <el-alert type="info" :closable="false" style="margin-bottom: 16px">
            导入教师任课表（格式：班级、班主任、语文、数学、英语、物理...）
          </el-alert>
          <el-upload
            drag
            :auto-upload="false"
            :limit="1"
            accept=".xlsx,.xls"
            :on-change="handleAssignmentFileChange"
          >
            <el-icon style="font-size: 40px; color: #909399"><Upload /></el-icon>
            <div>拖拽文件到此处，或<em>点击上传</em></div>
          </el-upload>
        </el-tab-pane>
        <el-tab-pane label="简单列表导入" name="simple">
          <el-alert type="info" :closable="false" style="margin-bottom: 16px">
            Excel 格式：姓名、所教科目、教研组
          </el-alert>
          <el-upload
            drag
            :auto-upload="false"
            :limit="1"
            accept=".xlsx,.xls"
            :on-change="handleSimpleFileChange"
          >
            <el-icon style="font-size: 40px; color: #909399"><Upload /></el-icon>
            <div>拖拽文件到此处，或<em>点击上传</em></div>
          </el-upload>
        </el-tab-pane>
      </el-tabs>
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
import { useTeacherStore } from '../../stores/teacherStore'
import * as XLSX from 'xlsx'

const teacherStore = useTeacherStore()

const showAddDialog = ref(false)
const showImportDialog = ref(false)
const importTab = ref('assignment')
const importFile = ref(null)
const importType = ref('assignment')

const newTeacher = reactive({
  name: '',
  subject: '',
  department: ''
})

const subjects = ['语文', '数学', '英语', '物理', '化学', '生物', '政治', '历史', '地理']

function handleAdd() {
  if (!newTeacher.name || !newTeacher.subject) {
    ElMessage.warning('请填写姓名和所教科目')
    return
  }
  teacherStore.addTeacher({ ...newTeacher })
  newTeacher.name = ''
  newTeacher.subject = ''
  newTeacher.department = ''
  showAddDialog.value = false
  ElMessage.success('添加成功')
}

function handleEdit(row) {
  ElMessage.info('编辑功能开发中')
}

function handleDelete(id) {
  teacherStore.removeTeacher(id)
  ElMessage.success('删除成功')
}

function handleClear() {
  ElMessageBox.confirm('确定要清空所有教师数据吗？', '警告', {
    type: 'warning'
  }).then(() => {
    teacherStore.clearAll()
    ElMessage.success('已清空')
  }).catch(() => {})
}

function handleAssignmentFileChange(file) {
  importFile.value = file.raw
  importType.value = 'assignment'
}

function handleSimpleFileChange(file) {
  importFile.value = file.raw
  importType.value = 'simple'
}

function parseTeacherName(name) {
  if (!name) return null
  const str = String(name).trim()
  // Remove notes like （学）, （物）, etc.
  const clean = str.replace(/[（(][^）)]*[）)]/g, '').trim()
  // Remove spaces within name
  return clean.replace(/\s+/g, '') || null
}

function handleImport() {
  if (!importFile.value) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result)
    const workbook = XLSX.read(data, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1 })
    
    let teachers = []
    
    if (importType.value === 'assignment') {
      // Parse teacher assignment table
      // Row 0 might be title, Row 1 is headers
      const headerRow = json.find(row => 
        row && row.includes('班级') && row.includes('语文')
      )
      if (!headerRow) {
        ElMessage.error('未找到有效的表头（需要包含"班级"、"语文"等列）')
        return
      }
      
      const headerIndex = json.indexOf(headerRow)
      const subjectCols = {}
      headerRow.forEach((col, idx) => {
        if (subjects.includes(col)) {
          subjectCols[idx] = col
        }
      })
      
      const teacherSet = new Map()
      
      for (let i = headerIndex + 1; i < json.length; i++) {
        const row = json[i]
        if (!row || !row[0]) continue
        
        for (const [colIdx, subject] of Object.entries(subjectCols)) {
          const teacherName = parseTeacherName(row[colIdx])
          if (teacherName) {
            if (!teacherSet.has(teacherName)) {
              teacherSet.set(teacherName, new Set())
            }
            teacherSet.get(teacherName).add(subject)
          }
        }
      }
      
      teachers = Array.from(teacherSet.entries()).map(([name, subjSet]) => ({
        name,
        subject: Array.from(subjSet).join('/'),
        department: ''
      }))
    } else {
      // Simple format
      teachers = json.slice(1).map(row => ({
        name: row[0],
        subject: row[1],
        department: row[2] || ''
      })).filter(t => t.name && t.subject)
    }
    
    teacherStore.importTeachers(teachers)
    showImportDialog.value = false
    importFile.value = null
    ElMessage.success(`成功导入 ${teachers.length} 位教师`)
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
