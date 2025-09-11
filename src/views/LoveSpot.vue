<script setup lang="ts">
import { useLoveSpot } from "../composables/loveSpot";

const {
  loveSpot,
  loading,
  error,
  currentPhotoIndex,
  goBack,
  goToMap,
  nextPhoto,
  previousPhoto,
  formatDate,
} = useLoveSpot();
</script>

<template>
  <div class="love-spot-detail">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner">💖</div>
      <p>Loading love spot...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">💔</div>
      <h2>Oops!</h2>
      <p>{{ error }}</p>
      <button @click="goBack" class="btn btn-secondary">Go Back</button>
    </div>

    <!-- Love Spot Content -->
    <div v-else-if="loveSpot" class="love-spot-content">
      <!-- Header -->
      <header class="header">
        <button @click="goBack" class="back-btn"><span>←</span> Back</button>
        <h1>💖 Love Spot</h1>
        <button @click="goToMap" class="map-btn">📍 View on Map</button>
      </header>

      <!-- Photo Gallery -->
      <div
        v-if="loveSpot.photos && loveSpot.photos.length > 0"
        class="photo-gallery"
      >
        <div class="photo-container">
          <img
            :src="loveSpot.photos[currentPhotoIndex]"
            :alt="`Love spot photo ${currentPhotoIndex + 1}`"
            class="main-photo"
          />

          <!-- Photo Navigation -->
          <div v-if="loveSpot.photos.length > 1" class="photo-nav">
            <button @click="previousPhoto" class="nav-btn prev-btn">‹</button>
            <div class="photo-counter">
              {{ currentPhotoIndex + 1 }} / {{ loveSpot.photos.length }}
            </div>
            <button @click="nextPhoto" class="nav-btn next-btn">›</button>
          </div>
        </div>

        <!-- Photo Thumbnails -->
        <div v-if="loveSpot.photos.length > 1" class="thumbnails">
          <img
            v-for="(photo, index) in loveSpot.photos"
            :key="index"
            :src="photo"
            :alt="`Thumbnail ${index + 1}`"
            :class="['thumbnail', { active: index === currentPhotoIndex }]"
            @click="currentPhotoIndex = index"
          />
        </div>
      </div>

      <!-- Content Section -->
      <div class="content-section">
        <!-- Address -->
        <div class="address-section">
          <h2>📍 Location</h2>
          <p class="address">{{ loveSpot.address }}</p>
          <div class="coordinates">
            <small
              >{{ loveSpot.coordinates.lat.toFixed(6) }},
              {{ loveSpot.coordinates.lng.toFixed(6) }}</small
            >
          </div>
        </div>

        <!-- Story/Content -->
        <div class="story-section">
          <h2>💕 Our Story</h2>
          <div class="story-content">
            <p>{{ loveSpot.content }}</p>
          </div>
        </div>

        <!-- Created Date -->
        <div v-if="loveSpot.created_at" class="date-section">
          <h3>✨ Created</h3>
          <p class="created-date">{{ formatDate(loveSpot.created_at) }}</p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button @click="goToMap" class="btn btn-primary">🗺️ View on Map</button>
        <button @click="goBack" class="btn btn-secondary">← Back to Map</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Completely natural flow - no height restrictions */
.love-spot-detail {
  background: linear-gradient(135deg, #ffeef8 0%, #f0e6ff 100%);
  font-family: "Arial", sans-serif;
  padding-bottom: 2rem; /* Add bottom padding for spacing */
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  text-align: center;
}

.loading-spinner {
  font-size: 3rem;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

/* No height restrictions - let content flow naturally */
.love-spot-content {
  max-width: 800px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 182, 193, 0.3);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header h1 {
  margin: 0;
  color: #d63384;
  font-size: 1.5rem;
}

.back-btn,
.map-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 20px;
  background: #ff69b4;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.back-btn:hover,
.map-btn:hover {
  background: #e91e63;
  transform: translateY(-2px);
}

.photo-gallery {
  margin-bottom: 2rem;
}

.photo-container {
  position: relative;
  width: 100%;
  height: 400px;
  overflow: hidden;
  border-radius: 0 0 20px 20px;
}

.main-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0 0 20px 20px;
}

.photo-nav {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(0, 0, 0, 0.7);
  padding: 0.5rem 1rem;
  border-radius: 25px;
  color: white;
}

.nav-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 50%;
  transition: background 0.3s ease;
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.photo-counter {
  font-size: 0.9rem;
  min-width: 50px;
  text-align: center;
}

.thumbnails {
  display: flex;
  gap: 0.5rem;
  padding: 1rem 2rem;
  overflow-x: auto;
}

.thumbnail {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  opacity: 0.6;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.thumbnail:hover {
  opacity: 0.8;
}

.thumbnail.active {
  opacity: 1;
  border-color: #ff69b4;
  transform: scale(1.05);
}

.content-section {
  padding: 2rem;
}

.address-section,
.story-section,
.date-section {
  margin-bottom: 2rem;
  background: rgba(255, 255, 255, 0.8);
  padding: 1.5rem;
  border-radius: 15px;
  border: 1px solid rgba(255, 182, 193, 0.2);
}

.address-section h2,
.story-section h2,
.date-section h3 {
  margin: 0 0 1rem 0;
  color: #d63384;
}

.address {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  color: #333;
}

.coordinates {
  color: #666;
  font-size: 0.9rem;
}

.story-content {
  line-height: 1.6;
  color: #444;
  font-size: 1rem;
}

.created-date {
  color: #666;
  margin: 0;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  padding: 2rem;
  justify-content: center;
  margin-bottom: 2rem; /* Extra bottom margin */
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: #ff69b4;
  color: white;
}

.btn-primary:hover {
  background: #e91e63;
  transform: translateY(-2px);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.9);
  color: #d63384;
  border: 2px solid #ff69b4;
}

.btn-secondary:hover {
  background: #ff69b4;
  color: white;
  transform: translateY(-2px);
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .header {
    padding: 1rem;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .header h1 {
    font-size: 1.2rem;
  }

  .back-btn,
  .map-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }

  .photo-container {
    height: 300px;
  }

  .content-section {
    padding: 1rem;
  }

  .action-buttons {
    flex-direction: column;
    padding: 1rem;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>