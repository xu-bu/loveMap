<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// Get coordinates from query parameters
const lat = computed(() => route.query.lat)
const lng = computed(() => route.query.lng)

// Address lookup
const address = ref('')
const loading = ref(true)

// Reverse geocode to get address
const getAddress = async () => {
  if (!lat.value || !lng.value) return
  
  try {
    loading.value = true
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat.value},${lng.value}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
    )
    const data = await response.json()
    
    if (data.results && data.results.length > 0) {
      address.value = data.results[0].formatted_address
    } else {
      address.value = 'Address not found'
    }
  } catch (error) {
    console.error('Error getting address:', error)
    address.value = 'Unable to load address'
  } finally {
    loading.value = false
  }
}

// Copy coordinates to clipboard
const copyCoordinates = async () => {
  const coordString = `${lat.value}, ${lng.value}`
  try {
    await navigator.clipboard.writeText(coordString)
    alert('Coordinates copied to clipboard!')
  } catch (error) {
    console.error('Failed to copy coordinates:', error)
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = coordString
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    alert('Coordinates copied to clipboard!')
  }
}

// Create love spot at this location
const createLoveSpot = () => {
  console.log(`Creating love spot at ${lat.value}, ${lng.value}`);
  
}

// Open in device's maps app
const openInMaps = () => {
  const url = `https://www.google.com/maps?q=${lat.value},${lng.value}`
  window.open(url, '_blank')
}

onMounted(() => {
  getAddress()
})
</script>

<template>
  <div style="padding: 20px; max-width: 800px; margin: 0 auto;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
      <h1>Location Details</h1>
      <button 
        @click="$router.go(-1)" 
        style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;"
      >
        ← Back
      </button>
    </div>
    
    <div v-if="!lat || !lng" style="text-align: center; color: #dc3545;">
      <h3>No coordinates provided</h3>
      <p>Please click on a location from the map to view details.</p>
    </div>
    
    <div v-else>
      <!-- Coordinates Info -->
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h3 style="margin-top: 0; color: #495057;">📍 Coordinates</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          <div>
            <strong>Latitude:</strong><br>
            <span style="font-family: monospace; font-size: 14px; color: #007bff;">{{ lat }}</span>
          </div>
          <div>
            <strong>Longitude:</strong><br>
            <span style="font-family: monospace; font-size: 14px; color: #007bff;">{{ lng }}</span>
          </div>
        </div>
        
        <!-- Copy coordinates button -->
        <button 
          @click="copyCoordinates" 
          style="margin-top: 15px; padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;"
        >
          📋 Copy Coordinates
        </button>
      </div>

      <!-- Address Info -->
      <div v-if="loading" style="text-align: center; padding: 20px;">
        <div>🔄 Loading address information...</div>
      </div>

      <div v-else-if="address" style="background: #e9ecef; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h3 style="margin-top: 0; color: #495057;">🏠 Address</h3>
        <p style="margin: 0; font-size: 16px;">{{ address }}</p>
      </div>

      <!-- Action Buttons -->
      <div style="display: flex; gap: 15px; flex-wrap: wrap;">
        <button 
          @click="createLoveSpot"
          style="flex: 1; min-width: 200px; padding: 15px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;"
        >
          💖 Create Love Spot Here
        </button>
        
        <button 
          @click="openInMaps"
          style="flex: 1; min-width: 200px; padding: 15px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;"
        >
          📱 Open in Maps App
        </button>
      </div>

      <!-- Additional Info -->
      <div style="margin-top: 30px; padding: 20px; background: #fff3cd; border-radius: 8px;">
        <h4 style="margin-top: 0; color: #856404;">💡 What you can do:</h4>
        <ul style="margin: 0; padding-left: 20px; color: #856404;">
          <li>Create a love spot at this location with memories</li>
          <li>Copy coordinates to share with someone special</li>
          <li>Open in your device's maps app for navigation</li>
          <li>View the exact location on the map above</li>
        </ul>
      </div>
    </div>
  </div>
</template>

