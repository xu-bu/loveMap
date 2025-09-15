<template>
  <div class="map-container">
    <div 
      ref="mapContainer" 
      class="map"
    ></div>
    
    <div v-if="loading" class="loading">Loading map...</div>
    <div v-if="error" class="error">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'

const mapContainer = ref<HTMLElement>()
const loading = ref(true)
const error = ref('')
let map: any = null

const API_KEY = import.meta.env.VITE_GAODE_API_KEY

const loadGaodeAPI = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).AMap) {
      resolve((window as any).AMap)
      return
    }

    if (!API_KEY) {
      reject('VITE_GAODE_API_KEY not found in environment')
      return
    }

    const script = document.createElement('script')
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${API_KEY}`
    script.onload = () => resolve((window as any).AMap)
    script.onerror = () => reject('Failed to load Gaode API')
    document.head.appendChild(script)
  })
}

const initMap = async () => {
  try {
    await loadGaodeAPI()
    await nextTick()

    if (!mapContainer.value) {
      throw new Error('Map container not ready')
    }

    map = new (window as any).AMap.Map(mapContainer.value, {
      zoom: 10,
      center: [116.397, 39.908], // Beijing center
      viewMode: '2D'
    })

    loading.value = false
  } catch (err: any) {
    error.value = err.message || 'Failed to load map'
    loading.value = false
  }
}

onMounted(initMap)
</script>

<style scoped>
.map-container {
  position: relative;
  width: 100%;
  height: 100vh;
}

.map {
  width: 100%;
  height: 100%;
}

.loading, .error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.error {
  color: red;
}
</style>