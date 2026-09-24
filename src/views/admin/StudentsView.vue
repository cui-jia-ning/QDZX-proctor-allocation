<template>
  <div class="students-view">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>学生管理</span>
          <div>
            <el-button type="primary" @click="showImportDialog = true">
              <el-icon><Upload /></el-icon>导入学生名单
            </el-button>
            <el-button type="success" @click="handleGenerateRooms" :disabled="!studentStore.students.length">
              <el-icon><MagicStick /></el-icon>生成考场
            </el-button>
            <el-button type="danger" @click="handleClear">
              <el-icon><Delete /></el-icon>清空
            </el-button>
          </div>
        </div>
      </template>

      <el-tabs v-model="activeTab">
        <el-tab-pane :label="`学生列表 (${studentStore.students.length})`" name="students">
          <el-table :data="studentStore.students" stripe max-height="500">
            <el-table-column prop="name" label="姓名" width="100" />
            <el-table-column prop="class" label="班级" width="100" />
            <el-table-column prop="subjectCombo" label="选科组合" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.subjectCombo" size="small">{{ row.subjectCombo }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="roomId" label="考场" width="120">
              <template #default="{ row }">
                {{ getRoomName(row.roomId) }}
              </template>
            </el-table-column>
            <el-table-column prop="seatNumber" label="座号" width="80" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane :label="`考场列表 (${studentStore.rooms.length})`" name="rooms">
          <el-table :data="studentStore.rooms" stripe>
            <el-table-column prop="name" label="考场名称" width="120" />
            <el-table-column prop="subjectCombo" label="选科组合" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.subjectCombo" size="small">{{ row.subjectCombo }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="capacity" label="人数" width="80" />
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button type="primary" link @click="handleEditRoom(row)">编辑</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="选科统计" name="stats">
          <el-table :data="comboStats" stripe>
            <el-table-column prop="combo" label="选科组合" width="120" />
            <el-table-column prop="count" label="学生人数" width="100" />
            <el-table-column prop="roomCount" label="考场数" width="100" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="showImportDialog" title="导入学生名单" width="700px">
      <el-alert type="info" :closable="false" style="margin-bottom: 16px">
        Excel 格式：姓名、班级、选科组合（如：物化生、物化地、政史地等）
      </el-alert>
      <el-upload
        drag
        :auto-upload="false"
        :limit="1"
        accept=".xlsx,.xls"
        :on-change="handleFileChange"
      >
        <el-icon style="font-size: 40px; color: #909399"><Upload /></el-icon>
        <div>拖拽文件到此处，或<em>点击上传</em></div>
      </el-upload>
      
      <div v-if="importPreview.length" style="margin-top: 16px">
        <h4>预览（前10条）</h4>
        <el-table :data="importPreview.slice(0, 10)" stripe size="small">
          <el-table-column prop="name" label="姓名" width="100" />
          <el-table-column prop="class" label="班级" width="100" />
          <el-table-column prop="subjectCombo" label="选科组合" width="100" />
        </el-table>
        <div style="margin-top: 8px; color: #909399">
          共 {{ importPreview.length }} 条记录
        </div>
      </div>
      
      <template #footer>
        <el-button @click="showImportDialog = false">取消</el-button>
        <el-button type="primary" @click="handleImport" :disabled="!importFile">导入</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showRoomEditDialog" title="编辑考场" width="500px">
      <el-form :model="editingRoom" label-width="100px">
        <el-form-item label="考场名称">
          <el-input v-model="editingRoom.name" />
        </el-form-item>
        <el-form-item label="位置">
          <el-input v-model="editingRoom.location" />
        </el-form-item>
        <el-form-item label="选科组合">
          <el-select v-model="editingRoom.subjectCombo" placeholder="选择选科组合">
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
        <el-button @click="showRoomEditDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmEditRoom">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useStudentStore } from '../../stores/studentStore'
import { useRoomStore } from '../../stores/roomStore'
import * as XLSX from 'xlsx'

const studentStore = useStudentStore()
const roomStore = useRoomStore()

const activeTab = ref('students')
const showImportDialog = ref(false)
const showRoomEditDialog = ref(false)
const importFile = ref(null)
const importPreview = ref([])
const editingRoom = ref({})

const comboStats = computed(() => {
  return studentStore.subjectCombos.map(combo => {
    const students = studentStore.studentsByCombo.get(combo) || []
    const rooms = studentStore.rooms.filter(r => r.subjectCombo === combo)
    return {
      combo,
      count: students.length,
      roomCount: rooms.length
    }
  })
})

function getRoomName(roomId) {
  const room = studentStore.rooms.find(r => r.id === roomId)
  return room ? room.name : ''
}

function handleFileChange(file) {
  importFile.value = file.raw
  
  const reader = new FileReader()
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result)
    const workbook = XLSX.read(data, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1 })
    
    // Find header row
    const headerRow = json.find(row => 
      row && (row.includes('姓名') || row.includes('name'))
    )
    
    if (!headerRow) {
      ElMessage.error('未找到有效的表头')
      return
    }
    
    const headerIndex = json.indexOf(headerRow)
    const nameCol = headerRow.findIndex(col => col === '姓名' || col === 'name')
    const classCol = headerRow.findIndex(col => col === '班级' || col === 'class')
    const comboCol = headerRow.findIndex(col => 
      col === '选科类型' || col === '选科组合' || col === 'subjectCombo'
    )
    
    const students = []
    for (let i = headerIndex + 1; i < json.length; i++) {
      const row = json[i]
      if (!row || !row[nameCol]) continue
      
      students.push({
        name: row[nameCol],
        class: classCol >= 0 ? row[classCol] : '',
        subjectCombo: comboCol >= 0 ? row[comboCol] : ''
      })
    }
    
    importPreview.value = students
  }
  reader.readAsArrayBuffer(file.raw)
}

function handleImport() {
  if (!importFile.value) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result)
    const workbook = XLSX.read(data, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1 })
    
    const headerRow = json.find(row => 
      row && (row.includes('姓名') || row.includes('name'))
    )
    
    const headerIndex = json.indexOf(headerRow)
    const nameCol = headerRow.findIndex(col => col === '姓名' || col === 'name')
    const classCol = headerRow.findIndex(col => col === '班级' || col === 'class')
    const comboCol = headerRow.findIndex(col => 
      col === '选科类型' || col === '选科组合' || col === 'subjectCombo'
    )
    
    const students = []
    for (let i = headerIndex + 1; i < json.length; i++) {
      const row = json[i]
      if (!row || !row[nameCol]) continue
      
      students.push({
        name: row[nameCol],
        class: classCol >= 0 ? row[classCol] : '',
        subjectCombo: comboCol >= 0 ? row[comboCol] : ''
      })
    }
    
    studentStore.importStudents(students)
    showImportDialog.value = false
    importFile.value = null
    importPreview.value = []
    ElMessage.success(`成功导入 ${students.length} 名学生`)
  }
  reader.readAsArrayBuffer(importFile.value)
}

function handleGenerateRooms() {
  ElMessageBox.confirm(
    '将根据选科组合自动生成考场（每考场约30人），并随机分配学生。确定吗？',
    '生成考场',
    { type: 'info' }
  ).then(() => {
    const rooms = studentStore.generateRooms(30)
    
    // Sync to room store
    roomStore.importRooms(rooms)
    
    ElMessage.success(`成功生成 ${rooms.length} 个考场`)
    activeTab.value = 'rooms'
  }).catch(() => {})
}

function handleEditRoom(room) {
  editingRoom.value = { ...room }
  showRoomEditDialog.value = true
}

function confirmEditRoom() {
  studentStore.updateRoom(editingRoom.value.id, editingRoom.value)
  roomStore.updateRoom(editingRoom.value.id, editingRoom.value)
  showRoomEditDialog.value = false
  ElMessage.success('更新成功')
}

function handleClear() {
  ElMessageBox.confirm('确定要清空所有学生和考场数据吗？', '警告', {
    type: 'warning'
  }).then(() => {
    studentStore.clearAll()
    roomStore.clearAll()
    ElMessage.success('已清空')
  }).catch(() => {})
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

h4 {
  margin: 0 0 12px 0;
  color: #303133;
}
</style>
