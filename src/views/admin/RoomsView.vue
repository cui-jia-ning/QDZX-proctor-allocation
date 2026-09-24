<template>
  <div class="rooms-view">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>考场管理</span>
          <div>
            <el-button type="primary" @click="showStudentImportDialog = true">
              <el-icon><Upload /></el-icon>导入学生名单
            </el-button>
            <el-button @click="showAddDialog = true">
              <el-icon><Plus /></el-icon>添加考场
            </el-button>
            <el-button type="danger" @click="handleClear">
              <el-icon><Delete /></el-icon>清空
            </el-button>
          </div>
        </div>
      </template>

      <el-alert type="info" :closable="false" style="margin-bottom: 16px">
        考场可从学生名单自动生成（按选科分考场），也可手动添加
      </el-alert>

      <el-table :data="roomStore.rooms" stripe>
        <el-table-column prop="name" label="考场名称" width="150" />
        <el-table-column prop="location" label="位置" />
        <el-table-column prop="capacity" label="容量" width="100" />
        <el-table-column prop="subjectCombo" label="选科组合" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.subjectCombo" size="small">{{ row.subjectCombo }}</el-tag>
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
        共 {{ roomStore.rooms.length }} 个考场
      </div>
    </el-card>

    <el-dialog v-model="showAddDialog" title="添加考场" width="500px">
      <el-form :model="newRoom" label-width="100px">
        <el-form-item label="考场名称" required>
          <el-input v-model="newRoom.name" placeholder="如：第1考场" />
        </el-form-item>
        <el-form-item label="位置">
          <el-input v-model="newRoom.location" placeholder="如：教学楼A-301" />
        </el-form-item>
        <el-form-item label="容量">
          <el-input-number v-model="newRoom.capacity" :min="1" :max="100" />
        </el-form-item>
        <el-form-item label="选科组合">
          <el-select v-model="newRoom.subjectCombo" placeholder="选择选科组合" clearable>
            <el-option label="物化生" value="物化生" />
            <el-option label="物化地" value="物化地" />
            <el-option label="物化政" value="物化政" />
            <el-option label="政史地" value="政史地" />
            <el-option label="物生地" value="物生地" />
            <el-option label="物生政" value="物生政" />
            <el-option label="史化生" value="史化生" />
            <el-option label="史化地" value="史化地" />
            <el-option label="史化政" value="史化政" />
            <el-option label="混合" value="混合" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAdd">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showStudentImportDialog" title="从学生名单生成考场" width="700px">
      <el-alert type="info" :closable="false" style="margin-bottom: 16px">
        导入学生名单后，系统会根据选科组合自动生成考场。每考场约30人。
      </el-alert>
      <el-upload
        drag
        :auto-upload="false"
        :limit="1"
        accept=".xlsx,.xls"
        :on-change="handleStudentFileChange"
      >
        <el-icon style="font-size: 40px; color: #909399"><Upload /></el-icon>
        <div>拖拽文件到此处，或<em>点击上传</em></div>
      </el-upload>
      
      <div v-if="studentPreview.length" style="margin-top: 16px">
        <h4>预览：将生成以下考场</h4>
        <el-table :data="studentPreview" stripe size="small" max-height="300">
          <el-table-column prop="name" label="考场" width="120" />
          <el-table-column prop="subjectCombo" label="选科组合" width="100" />
          <el-table-column prop="studentCount" label="学生数" width="80" />
        </el-table>
      </div>
      
      <template #footer>
        <el-button @click="showStudentImportDialog = false">取消</el-button>
        <el-button type="primary" @click="handleStudentImport" :disabled="!studentFile || !studentPreview.length">
          生成考场
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRoomStore } from '../../stores/roomStore'
import * as XLSX from 'xlsx'

const roomStore = useRoomStore()

const showAddDialog = ref(false)
const showStudentImportDialog = ref(false)
const studentFile = ref(null)
const studentPreview = ref([])

const newRoom = reactive({
  name: '',
  location: '',
  capacity: 30,
  subjectCombo: ''
})

function handleAdd() {
  if (!newRoom.name) {
    ElMessage.warning('请填写考场名称')
    return
  }
  roomStore.addRoom({ ...newRoom })
  newRoom.name = ''
  newRoom.location = ''
  newRoom.capacity = 30
  newRoom.subjectCombo = ''
  showAddDialog.value = false
  ElMessage.success('添加成功')
}

function handleEdit(row) {
  ElMessage.info('编辑功能开发中')
}

function handleDelete(id) {
  roomStore.removeRoom(id)
  ElMessage.success('删除成功')
}

function handleClear() {
  ElMessageBox.confirm('确定要清空所有考场数据吗？', '警告', {
    type: 'warning'
  }).then(() => {
    roomStore.clearAll()
    ElMessage.success('已清空')
  }).catch(() => {})
}

function handleStudentFileChange(file) {
  studentFile.value = file.raw
  
  // Preview
  const reader = new FileReader()
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result)
    const workbook = XLSX.read(data, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1 })
    
    // Find header row
    const headerRow = json.find(row => 
      row && (row.includes('选科类型') || row.includes('选科'))
    )
    
    if (!headerRow) {
      ElMessage.error('未找到选科类型列')
      return
    }
    
    const headerIndex = json.indexOf(headerRow)
    const comboCol = headerRow.findIndex(col => 
      col === '选科类型' || col === '选科'
    )
    const roomCol = headerRow.findIndex(col => 
      col === '教室' || col === '考场'
    )
    
    // Group students by subject combination
    const comboGroups = new Map()
    
    for (let i = headerIndex + 1; i < json.length; i++) {
      const row = json[i]
      if (!row || !row[0]) continue
      
      const combo = row[comboCol] || '混合'
      const room = roomCol >= 0 ? row[roomCol] : null
      
      if (!comboGroups.has(combo)) {
        comboGroups.set(combo, [])
      }
      comboGroups.get(combo).push({ combo, room })
    }
    
    // Generate rooms
    const rooms = []
    let roomNum = 1
    
    for (const [combo, students] of comboGroups) {
      const perRoom = 30
      const roomCount = Math.ceil(students.length / perRoom)
      
      for (let i = 0; i < roomCount; i++) {
        const start = i * perRoom
        const end = Math.min(start + perRoom, students.length)
        const count = end - start
        
        // Use existing room name if available
        const existingRoom = students[start].room
        const name = existingRoom || `第${roomNum}考场`
        
        rooms.push({
          name,
          location: existingRoom || '',
          capacity: count,
          subjectCombo: combo
        })
        roomNum++
      }
    }
    
    studentPreview.value = rooms
  }
  reader.readAsArrayBuffer(file.raw)
}

function handleStudentImport() {
  roomStore.importRooms(studentPreview.value)
  showStudentImportDialog.value = false
  studentFile.value = null
  studentPreview.value = []
  ElMessage.success(`成功生成 ${studentPreview.value.length} 个考场`)
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

h4 {
  margin: 0 0 12px 0;
  color: #303133;
}
</style>
