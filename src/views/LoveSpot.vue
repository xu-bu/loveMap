<template>
  <div class="love-spot-detail" :style="{ background: color }">
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
            <img :src="spot.photos[currentIndex]" :alt="`Love spot photo ${currentIndex + 1}`" class="gallery-photo" />
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
        <button @click="editLoveSpot" class="btn btn-secondary">Edit</button>
      </div>
    </div>

    <div v-if="showModal" class="photo-modal" @click="closeModal">
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="photo-count">{{ modalIndex + 1 }} / {{ spot!.photos.length }}</div>
        <button @click="closeModal" class="close-btn">✕</button>
      </div>
      <img class="photo-modal-img" :src="loveSpot?.photos[currentIndex]" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useLoveSpot } from "../composables/loveSpot";
import "../assets/styles/loveSpot.css"
import { formatDate } from "../utils/utils";

const {
  loveSpot,
  loading,
  error,
  goBack,
  goToMap,
  editLoveSpot,
} = useLoveSpot();

// Simplified state
const currentIndex = ref(0);
const showModal = ref(false);
const modalIndex = ref(0);

// Safe computed properties to handle null/undefined
const spot = computed(() => loveSpot.value);
const color = computed(() => spot.value?.color || '');
console.log("loveSpot color:", spot.value?.color);
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
