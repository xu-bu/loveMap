<script setup lang="ts">
import { useCreateLoveSpot } from '../composables/createLoveSpot' // Adjust path as needed
import "../assets/styles/createLoveSpot.css"

const {
  router,
  color,
  lat,
  lng,
  address,
  loading,
  content,
  uploadedPhotos,
  uploading,
  uploadProgress,
  copyCoordinates,
  handleFileSelect,
  removePhoto,
  saveToDatabase,
  openInMaps
} = useCreateLoveSpot()

const goBack = () => {
  router.back()
}
</script>

<template>
  <div class="create-love-spot">
    <!-- Header -->
    <header class="header">
      <button @click="goBack" class="back-btn">
        <span>←</span> Back
      </button>
      <h1>💖 Create Love Spot</h1>
      <button @click="openInMaps" class="maps-btn">
        🗺️ Open Maps
      </button>
    </header>

    <!-- Scrollable Content -->
    <div class="scrollable-content" :style="{ background: color }">
      <!-- Location Section -->
      <section class="section location-section">
        <h2>📍 Location</h2>

        <!-- Coordinates Display -->
        <div class="coordinates-card">
          <div class="coordinates-info">
            <div class="coordinate-item">
              <label>Latitude:</label>
              <span>{{ lat }}</span>
            </div>
            <div class="coordinate-item">
              <label>Longitude:</label>
              <span>{{ lng }}</span>
            </div>
          </div>
          <button @click="copyCoordinates" class="copy-btn">
            📋 Copy Coordinates
          </button>
        </div>

        <!-- Address -->
        <div class="address-card">
          <h3>Address</h3>
          <div v-if="loading" class="loading">
            <div class="spinner">🔄</div>
            <span>Finding address...</span>
          </div>
          <p v-else class="address-text" contenteditable="true">{{ address }}</p>
        </div>
      </section>

      <!-- Photos Section -->
      <section class="section photos-section">
        <h2>📸 Photos</h2>

        <!-- Upload Area -->
        <div class="upload-area">
          <input id="photoInput" type="file" multiple accept="image/*" @change="handleFileSelect" class="file-input" />
          <label for="photoInput" class="upload-label">
            <div class="upload-content">
              <div class="upload-icon">📷</div>
              <span>Choose Photos</span>
              <small>Support multiple photos</small>
            </div>
          </label>
        </div>

        <!-- Upload Progress -->
        <div v-if="uploading" class="upload-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${uploadProgress}%` }"></div>
          </div>
          <span class="progress-text">{{ uploadProgress }}% uploaded</span>
        </div>

        <!-- Photo Gallery -->
        <div v-if="uploadedPhotos.length > 0" class="photo-gallery">
          <div v-for="(photo, index) in uploadedPhotos" :key="index" class="photo-item">
            <img :src="photo" :alt="`Photo ${index + 1}`" />
            <button @click="removePhoto(index)" class="remove-photo-btn">
              ❌
            </button>
          </div>
        </div>
      </section>

      <!-- Story Section -->
      <section class="section story-section">
        <h2>💕 Your Story</h2>
        <div class="story-input-container">
          <textarea v-model="content"
            placeholder="Tell the story of this special place... What makes it meaningful? What memories were made here?"
            class="story-textarea" rows="8"></textarea>
          <div class="character-count">
            {{ content.length }} characters
          </div>
        </div>
      </section>

      <!-- Action Buttons -->
      <section class="section actions-section">
        <div class="action-buttons">
          <button @click="saveToDatabase" class="btn btn-primary"
            :disabled="!content.trim() || uploadedPhotos.length === 0">
            💾 Save Love Spot
          </button>
          <button @click="goBack" class="btn btn-secondary">
            ← Cancel
          </button>
        </div>
      </section>
    </div>
  </div>
</template>
