import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import Map from '../views/MapView.vue'
import CreateLoveSpot from '../views/CreateLoveSpot.vue'
import LoveSpot from '../views/LoveSpot.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Map',
    component: Map
  },
  {
    path: '/loveSpot',
    name: 'LoveSpot',
    component: LoveSpot
  },
  {
    path: '/createLoveSpot',
    name: 'CreateLoveSpot',
    component: CreateLoveSpot
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
