<template>
  <el-container class="admin-layout">
    <el-aside width="200px">
      <div class="logo">启东中学<br/>监考分配系统</div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/admin/teachers">
          <el-icon><User /></el-icon>
          <span>教师管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/students">
          <el-icon><UserFilled /></el-icon>
          <span>学生管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/rooms">
          <el-icon><OfficeBuilding /></el-icon>
          <span>考场管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/exams">
          <el-icon><Document /></el-icon>
          <span>考试安排</span>
        </el-menu-item>
        <el-menu-item index="/admin/allocation">
          <el-icon><Setting /></el-icon>
          <span>监考分配</span>
        </el-menu-item>
        <el-menu-item index="/admin/export">
          <el-icon><Download /></el-icon>
          <span>导出发布</span>
        </el-menu-item>
      </el-menu>
      <div class="teacher-link">
        <el-button type="primary" link @click="$router.push('/teacher')">
          教师查询入口 →
        </el-button>
      </div>
    </el-aside>
    <el-main>
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const activeMenu = computed(() => route.path)
</script>

<style scoped>
.admin-layout {
  height: 100vh;
}

.el-aside {
  background-color: #304156;
  display: flex;
  flex-direction: column;
}

.logo {
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  padding: 20px;
  line-height: 1.5;
  border-bottom: 1px solid #3d4a5a;
}

.el-menu {
  border-right: none;
  flex: 1;
}

.teacher-link {
  padding: 20px;
  text-align: center;
  border-top: 1px solid #3d4a5a;
}

.el-main {
  background-color: #f0f2f5;
  padding: 20px;
}
</style>
