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
    <div v-else-if="spot" class="love-spot-content">
      <!-- Header -->
      <header class="header">
        <button @click="goBack" class="back-btn"><span>←</span> Back</button>
        <h1>💖 Love Spot</h1>
        <button @click="goToMap" class="map-btn">📍 View on Map</button>
      </header>

      <!-- Simple Photo Gallery -->
      <div v-if="hasPhotos" class="photo-gallery">
        <div class="photo-wrapper">
          <div class="photo-block" @click="openPhotoModal">
            <img
              :src="spot.photos[currentIndex]"
              :alt="`Love spot photo ${currentIndex + 1}`"
              class="gallery-photo"
            />
            <div class="photo-index">
              {{ currentIndex + 1 }} / {{ spot.photos.length }}
            </div>
          </div>
        </div>
      </div>

      <!-- Content Section -->
      <div class="content-section">
        <!-- Address -->
        <div class="address-section">
          <h2>📍 Location</h2>
          <p class="address">{{ spot.address }}</p>
          <div class="coordinates">
            <small>{{ spot.coordinates.lat.toFixed(6) }}, {{ spot.coordinates.lng.toFixed(6) }}</small>
          </div>
        </div>

        <!-- Story/Content -->
        <div class="story-section">
          <h2>💕 Our Story</h2>
          <div class="story-content">
            <p>{{ spot.content }}</p>
          </div>
        </div>

        <!-- Created Date -->
        <div v-if="spot.created_at" class="date-section">
          <h3>✨ Created</h3>
          <p class="created-date">{{ formatDate(spot.created_at) }}</p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button @click="goToMap" class="btn btn-primary">🗺️ View on Map</button>
        <button @click="goBack" class="btn btn-secondary">← Back to Map</button>
      </div>
    </div>

    <!-- Full Screen Photo Modal -->
    <div v-if="showModal" class="photo-modal" @click="closeModal">
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="modal-title">
          <span class="photo-count">{{ modalIndex + 1 }} / {{ spot!.photos.length }}</span>
        </div>
        <button @click="closeModal" class="close-btn">✕</button>
      </div>
      
      <!-- Photo Container -->
      <div class="modal-photo-container" @click.stop>
        <button 
          v-if="canGoPrev"
          @click="prevPhoto" 
          class="modal-nav-btn modal-prev-btn"
        >
          ‹
        </button>
        
        <div class="modal-photo-wrapper">
          <img
            :src="spot!.photos[modalIndex]"
            :alt="`Love spot photo ${modalIndex + 1}`"
            class="modal-photo"
          />
        </div>
        
        <button 
          v-if="canGoNext"
          @click="nextPhoto" 
          class="modal-nav-btn modal-next-btn"
        >
          ›
        </button>
      </div>
      
      <!-- Modal Thumbnails -->
      <div v-if="hasMultiplePhotos" class="modal-footer">
        <div class="modal-thumbnails">
          <img
            v-for="(photo, index) in spot!.photos"
            :key="index"
            :src="photo"
            :alt="`Thumbnail ${index + 1}`"
            :class="['modal-thumbnail', { active: index === modalIndex }]"
            @click="goToPhoto(index)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useLoveSpot } from "../composables/loveSpot";

const {
  loveSpot,
  loading,
  error,
  goBack,
  goToMap,
  formatDate,
} = useLoveSpot();

// Simplified state
const currentIndex = ref(0);
const showModal = ref(false);
const modalIndex = ref(0);

// Safe computed properties to handle null/undefined
const spot = computed(() => loveSpot.value);
const hasPhotos = computed(() => Boolean(spot.value?.photos?.length));
const hasMultiplePhotos = computed(() => (spot.value?.photos?.length || 0) > 1);
const canGoPrev = computed(() => hasMultiplePhotos.value && modalIndex.value > 0);
const canGoNext = computed(() => hasMultiplePhotos.value && modalIndex.value < (spot.value?.photos?.length || 0) - 1);

// Modal functions
const openPhotoModal = () => {
  if (!hasPhotos.value) return;
  modalIndex.value = currentIndex.value;
  showModal.value = true;
  document.body.style.overflow = 'hidden';
};

const closeModal = () => {
  showModal.value = false;
  document.body.style.overflow = '';
};

const goToPhoto = (index: number) => {
  modalIndex.value = index;
  currentIndex.value = index;
};

const prevPhoto = () => {
  if (canGoPrev.value) {
    modalIndex.value--;
    currentIndex.value = modalIndex.value;
  }
};

const nextPhoto = () => {
  if (canGoNext.value) {
    modalIndex.value++;
    currentIndex.value = modalIndex.value;
  }
};

// Keyboard navigation
const handleKeydown = (event: KeyboardEvent) => {
  if (!showModal.value) return;
  
  switch (event.key) {
    case 'Escape':
      closeModal();
      break;
    case 'ArrowLeft':
      prevPhoto();
      break;
    case 'ArrowRight':
      nextPhoto();
      break;
  }
};

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  document.body.style.overflow = '';
});
</script>

<style scoped>
.love-spot-detail {
  background: linear-gradient(135deg, #ffeef8 0%, #f0e6ff 100%);
  font-family: "Arial", sans-serif;
  padding-bottom: 2rem;
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
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.love-spot-content {
  max-width: 800px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem; /* Keep vertical 1rem, horizontal matches content sections */
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

.back-btn, .map-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 20px;
  background: #ff69b4;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.back-btn:hover, .map-btn:hover {
  background: #e91e63;
  transform: translateY(-2px);
}

/* Simplified Photo Gallery - Compact */
.photo-gallery {
  margin-bottom: 1.5rem;
  /* Force override any grid/flex styles from parent components */
  display: block !important;
  grid-template-columns: none !important;
  grid-template-rows: none !important;
  grid-auto-columns: none !important;
  grid-auto-rows: none !important;
  flex-direction: unset !important;
  flex-wrap: unset !important;
  width: 100% !important;
  /* Clear any inherited grid/flex properties */
  all: unset;
  /* Then reapply what we need */
  display: block !important;
  margin-bottom: 1.5rem;
}

.photo-wrapper {
  width: 100% !important;
  display: block !important;
  /* Create a new stacking context to isolate from parent styles */
  position: relative;
  z-index: 1;
  /* Match header padding */
  padding: 0 2rem;
}

.photo-block {
  position: relative;
  width: 100% !important;
  height: 250px;
  overflow: hidden;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 0; /* Remove horizontal margin since wrapper has padding */
  /* Force override any grid/flex styles */
  display: block !important;
  flex: none !important;
  grid-column: unset !important;
  grid-row: unset !important;
  grid-area: unset !important;
  /* Clear float if any */
  float: none !important;
  /* Ensure full width */
  max-width: none !important;
  min-width: 0 !important;
}

.photo-block:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.gallery-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 15px;
  transition: filter 0.3s ease;
}

.photo-block:hover .gallery-photo {
  filter: brightness(1.05);
}

.photo-index {
  position: absolute;
  bottom: 15px;
  right: 15px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.4rem 0.8rem;
  border-radius: 15px;
  font-size: 0.85rem;
  font-weight: 500;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Photo Modal */
.photo-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(5px);
  animation: modalFadeIn 0.3s ease-out;
}

@keyframes modalFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  color: white;
  z-index: 10000;
}

.modal-title {
  display: flex;
  align-items: center;
}

.photo-count {
  font-size: 1.1rem;
  font-weight: 500;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 2rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.3s ease;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.1);
}

.modal-photo-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 2rem;
  position: relative;
  min-height: 0;
}

.modal-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  font-size: 2rem;
  cursor: pointer;
  padding: 1rem 1.5rem;
  border-radius: 50%;
  transition: all 0.3s ease;
  z-index: 10001;
  backdrop-filter: blur(5px);
}

.modal-nav-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-50%) scale(1.1);
}

.modal-prev-btn {
  left: 2rem;
}

.modal-next-btn {
  right: 2rem;
}

.modal-photo-wrapper {
  max-width: calc(100% - 200px);
  max-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-photo {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
  animation: photoZoomIn 0.3s ease-out;
}

@keyframes photoZoomIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-footer {
  padding: 1rem 2rem 2rem;
  z-index: 10000;
}

.modal-thumbnails {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  overflow-x: auto;
  padding: 0.5rem;
}

.modal-thumbnail {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  opacity: 0.5;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  flex-shrink: 0;
}

.modal-thumbnail:hover {
  opacity: 0.8;
  transform: scale(1.05);
}

.modal-thumbnail.active {
  opacity: 1;
  border-color: #ff69b4;
  transform: scale(1.1);
}

/* Content sections */
.content-section {
  padding: 2rem;
}

.address-section, .story-section, .date-section {
  margin-bottom: 2rem;
  background: rgba(255, 255, 255, 0.8);
  padding: 1.5rem;
  border-radius: 15px;
  border: 1px solid rgba(255, 182, 193, 0.2);
}

.address-section h2, .story-section h2, .date-section h3 {
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
  margin-bottom: 2rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
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

  .back-btn, .map-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }

  .photo-wrapper {
    padding: 0 1rem;
  }

  .photo-block {
    height: 200px;
    border-radius: 12px;
  }

  .gallery-photo {
    border-radius: 12px;
  }

  .photo-index {
    bottom: 10px;
    right: 10px;
    padding: 0.3rem 0.6rem;
    font-size: 0.8rem;
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

  .modal-header {
    padding: 1rem;
  }

  .modal-photo-container {
    padding: 0 1rem;
  }

  .modal-photo-wrapper {
    max-width: calc(100% - 100px);
  }

  .modal-prev-btn, .modal-next-btn {
    padding: 0.8rem 1rem;
    font-size: 1.5rem;
  }

  .modal-prev-btn {
    left: 1rem;
  }

  .modal-next-btn {
    right: 1rem;
  }

  .modal-footer {
    padding: 1rem;
  }

  .modal-thumbnails {
    gap: 0.3rem;
  }

  .modal-thumbnail {
    width: 50px;
    height: 50px;
  }

  .close-btn {
    font-size: 1.5rem;
    width: 40px;
    height: 40px;
  }
}
</style>