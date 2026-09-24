<template>
  <div class="teacher-query">
    <div class="query-container">
      <div class="header">
        <h1>启东中学</h1>
        <h2>监考安排查询</h2>
      </div>

      <div v-if="!dataLoaded" class="load-section">
        <el-alert type="info" :closable="false" style="margin-bottom: 16px">
          请先加载监考安排数据文件（由管理员生成）
        </el-alert>
        <el-upload
          drag
          :auto-upload="false"
          :limit="1"
          accept=".json"
          :on-change="handleFileLoad"
        >
          <el-icon style="font-size: 40px; color: #909399"><Upload /></el-icon>
          <div>拖拽数据文件到此处，或<em>点击选择</em></div>
        </el-upload>
      </div>

      <div v-else class="query-section">
        <el-input
          v-model="searchQuery"
          placeholder="输入姓名查询"
          size="large"
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <div v-if="searchResults.length" class="results">
          <div 
            v-for="teacher in searchResults" 
            :key="teacher.id" 
            class="result-card"
          >
            <div class="teacher-info">
              <span class="name">{{ teacher.name }}</span>
              <span class="subject">{{ teacher.subject }}</span>
            </div>
            
            <div v-if="teacher.assignments.length" class="assignments">
              <div 
                v-for="(a, i) in teacher.assignments" 
                :key="i" 
                class="assignment-item"
              >
                <div class="time">{{ a.date }} {{ a.timeSlot }}</div>
                <div class="detail">
                  <span class="subject-tag">{{ a.examSubject }}</span>
                  <span>{{ a.roomName }}</span>
                </div>
              </div>
            </div>
            <div v-else class="no-assignment">
              暂无监考安排
            </div>
          </div>
        </div>

        <div v-else-if="searchQuery" class="no-results">
          未找到匹配的教师
        </div>

        <div class="reload">
          <el-button type="primary" link @click="resetData">
            重新加载数据
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const dataLoaded = ref(false)
const teacherData = ref([])
const searchQuery = ref('')

const searchResults = computed(() => {
  if (!searchQuery.value) return []
  return teacherData.value.filter(t => 
    t.name.includes(searchQuery.value)
  )
})

function handleFileLoad(file) {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result)
      teacherData.value = data.teachers || []
      dataLoaded.value = true
    } catch (err) {
      alert('数据文件格式错误')
    }
  }
  reader.readAsText(file.raw)
}

function handleSearch() {
}

function resetData() {
  dataLoaded.value = false
  teacherData.value = []
  searchQuery.value = ''
}
</script>

<style scoped>
.teacher-query {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 40px 20px;
}

.query-container {
  background: #fff;
  border-radius: 16px;
  padding: 40px;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.header {
  text-align: center;
  margin-bottom: 32px;
}

.header h1 {
  margin: 0;
  font-size: 32px;
  color: #303133;
}

.header h2 {
  margin: 8px 0 0 0;
  font-size: 18px;
  color: #909399;
  font-weight: normal;
}

.load-section {
  margin-top: 20px;
}

.query-section {
  margin-top: 20px;
}

.results {
  margin-top: 24px;
}

.result-card {
  background: #f5f7fa;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
}

.teacher-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.teacher-info .name {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
}

.teacher-info .subject {
  font-size: 14px;
  color: #909399;
  background: #e4e7ed;
  padding: 2px 8px;
  border-radius: 4px;
}

.assignments {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.assignment-item {
  background: #fff;
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.assignment-item .time {
  font-size: 14px;
  color: #606266;
}

.assignment-item .detail {
  display: flex;
  align-items: center;
  gap: 8px;
}

.subject-tag {
  background: #409eff;
  color: #fff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.no-assignment {
  text-align: center;
  color: #909399;
  padding: 20px;
}

.no-results {
  text-align: center;
  color: #909399;
  padding: 40px 0;
  font-size: 16px;
}

.reload {
  text-align: center;
  margin-top: 24px;
}

@media (max-width: 480px) {
  .query-container {
    padding: 24px;
  }
  
  .header h1 {
    font-size: 24px;
  }
  
  .assignment-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
