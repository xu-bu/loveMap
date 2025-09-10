<template>
  <div style="padding: 20px; max-width: 800px; margin: 0 auto;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
      <h1>Location Details</h1>
      <button 
        @click="router.go(-1)" 
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
        <h3 style="margin-top: 0; color: #495057;">🏠 Spot</h3>
        <p style="margin: 0; font-size: 16px;">{{ address }}</p>
      </div>

      <!-- Notes & Photos Section -->
      <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #ffeaa7;">
        <h3 style="margin-top: 0; color: #856404;">📝 Love story & Photos</h3>
        
        <!-- Text Area for Notes -->
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #495057;">
            Save your memory:
          </label>
          <textarea 
            v-model="content"
            placeholder="Write something about this location..."
            style="width: 100%; min-height: 100px; padding: 12px; border: 1px solid #ced4da; border-radius: 4px; resize: vertical; font-family: inherit; font-size: 14px;"
          ></textarea>
        </div>

        <!-- Photo Upload Section -->
        <div style="margin-bottom: 20px;">
          <label 
            for="photoInput"
            style="display: block; margin-bottom: 8px; font-weight: bold; color: #495057; cursor: pointer;"
          >
            📸 Add photos:
          </label>
          
          <!-- File Input -->
          <input 
            id="photoInput"
            type="file" 
            @change="handleFileSelect"
            multiple
            accept="image/*"
            :disabled="uploading"
            style="width: 100%; padding: 10px; border: 2px dashed #17a2b8; border-radius: 4px; background: #f8f9fa; cursor: pointer;"
          />
          
          <!-- Upload Progress -->
          <div v-if="uploadProgress > 0 && uploadProgress < 100" style="margin-top: 10px;">
            <div style="background: #e9ecef; height: 8px; border-radius: 4px; overflow: hidden;">
              <div 
                style="height: 100%; background: #28a745; transition: width 0.3s ease;"
                :style="{ width: uploadProgress + '%' }"
              ></div>
            </div>
            <div style="font-size: 12px; color: #6c757d; margin-top: 5px;">
              Uploading... {{ uploadProgress }}%
            </div>
          </div>
        </div>

        <!-- Uploaded Photos Display -->
        <div v-if="uploadedPhotos.length > 0" style="margin-bottom: 20px;">
          <h4 style="margin-bottom: 10px; color: #495057;">Uploaded Photos:</h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px;">
            <div 
              v-for="(photo, index) in uploadedPhotos" 
              :key="index"
              style="position: relative; aspect-ratio: 1; border-radius: 8px; overflow: hidden; border: 2px solid #dee2e6;"
            >
              <img 
                :src="photo.url" 
                :alt="`Photo ${index + 1}`"
                style="width: 100%; height: 100%; object-fit: cover;"
              />
              <!-- Delete button -->
              <button 
                @click="removePhoto(index)"
                style="position: absolute; top: 5px; right: 5px; width: 24px; height: 24px; background: rgba(220, 53, 69, 0.9); color: white; border: none; border-radius: 50%; cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center;"
                title="Remove photo"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div style="display: flex; gap: 15px; flex-wrap: wrap;">
        <button 
          @click="saveToDatabase"
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCreateLoveSpot } from './createLoveSpot'

// Destructure all the reactive values and functions from the composable
const {
  // Router
  router,
  
  // Computed values
  lat,
  lng,
  
  // Reactive data
  address,
  loading,
  content,
  uploadedPhotos,
  uploading,
  uploadProgress,
  
  // Functions
  copyCoordinates,
  handleFileSelect,
  removePhoto,
  saveToDatabase,
  openInMaps
} = useCreateLoveSpot()
</script>