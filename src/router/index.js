import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/admin'
  },
  {
    path: '/admin',
    component: () => import('../views/admin/AdminLayout.vue'),
    children: [
      {
        path: '',
        redirect: '/admin/teachers'
      },
      {
        path: 'teachers',
        name: 'Teachers',
        component: () => import('../views/admin/TeachersView.vue')
      },
      {
        path: 'students',
        name: 'Students',
        component: () => import('../views/admin/StudentsView.vue')
      },
      {
        path: 'rooms',
        name: 'Rooms',
        component: () => import('../views/admin/RoomsView.vue')
      },
      {
        path: 'exams',
        name: 'Exams',
        component: () => import('../views/admin/ExamsView.vue')
      },
      {
        path: 'allocation',
        name: 'Allocation',
        component: () => import('../views/admin/AllocationView.vue')
      },
      {
        path: 'export',
        name: 'Export',
        component: () => import('../views/admin/ExportView.vue')
      }
    ]
  },
  {
    path: '/teacher',
    name: 'TeacherQuery',
    component: () => import('../views/teacher/TeacherQuery.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
