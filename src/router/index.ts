import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import GoogleMap from '../views/GoogleMap.vue'
import GaodeMap from '../views/GaodeMap.vue'
import CreateLoveSpot from '../views/CreateLoveSpot.vue'
import LoveSpot from '../views/LoveSpot.vue'
import IndexView from '../views/IndexView.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'IndexView',
    component: IndexView
  },
  {
    path: '/gaodeMap',
    name: 'Map',
    component: Map
  },
  {
    path: '/googleMap',
    name: 'Map',
    component: GoogleMap
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
