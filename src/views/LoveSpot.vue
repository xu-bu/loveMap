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

      <!-- Enhanced Photo Gallery with Swipe -->
      <div v-if="hasPhotos" class="photo-gallery">
        <div class="photo-carousel" @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd"
          @mousedown="onMouseStart" @mousemove="onMouseMove" @mouseup="onMouseEnd" @mouseleave="onMouseEnd">

          <div class="photo-track" :style="{ transform: `translateX(-${currentIndex * 100}%)` }">
            <div v-for="(photo, index) in spot.photos" :key="index" class="photo-slide" @click="openPhotoModal(index)">
              <img :src="photo" :alt="`Love spot photo ${index + 1}`" class="gallery-photo" />
            </div>
          </div>

          <!-- Photo Indicators -->
          <div v-if="spot.photos.length > 1" class="photo-indicators">
            <button v-for="(photo, index) in spot.photos" :key="index" @click="goToPhoto(index)" class="indicator"
              :class="{ active: index === currentIndex }">
            </button>
          </div>

          <!-- Photo Counter -->
          <div class="photo-counter">
            {{ currentIndex + 1 }} / {{ spot.photos.length }}
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

    <!-- Enhanced Photo Modal with Swipe -->
    <div v-if="showModal" class="photo-modal" @click="closeModalOnBackdrop">
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="photo-count">{{ modalIndex + 1 }} / {{ spot!.photos.length }}</div>
        <button @click="closeModal" class="close-btn">✕</button>
      </div>

      <!-- Modal Photo Carousel -->
      <div class="modal-carousel" @touchstart="onModalTouchStart" @touchmove="onModalTouchMove"
        @touchend="onModalTouchEnd" @mousedown="onModalMouseStart" @mousemove="onModalMouseMove"
        @mouseup="onModalMouseEnd" @mouseleave="onModalMouseEnd">

        <div class="modal-photo-track" :style="{
          transform: `translateX(-${modalIndex * 100}%)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease'
        }">
          <div v-for="(photo, index) in spot!.photos" :key="index" class="modal-photo-slide">
            <img :src="spot?.photos[currentIndex.valueOf()]" :alt="`Love spot photo ${currentIndex.valueOf() + 1}`"
              class="modal-photo" @click.stop />
          </div>
        </div>

        <!-- Swipe Indicators -->
        <div class="swipe-indicators">
          <div class="swipe-hint left" :class="{ active: swipeDirection === 'left' }">‹</div>
          <div class="swipe-hint right" :class="{ active: swipeDirection === 'right' }">›</div>
        </div>
      </div>

      <!-- Modal Indicators -->
      <div v-if="spot!.photos.length > 1" class="modal-indicators">
        <button v-for="(photo, index) in spot!.photos" :key="index" @click.stop="goToModalPhoto(index)"
          class="modal-indicator" :class="{ active: index === modalIndex }">
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
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
// for photo dragging
// Simplified state
const currentIndex = ref(0);
const showModal = ref(false);
const modalIndex = ref(0);
const isDragging = ref(false);
const swipeDirection = ref('');
// Safe computed properties to handle null/undefined
const spot = computed(() => loveSpot.value);
const color = computed(() => spot.value?.color || '');
console.log("loveSpot color:", spot.value?.color);
const hasPhotos = computed(() => Boolean(spot.value?.photos?.length));

// Touch/Mouse handling variables
let startX = 0;
let currentX = 0;
let startTime = 0;
let isMouseDown = false;

// Gallery swipe methods
const onTouchStart = (e: TouchEvent) => {
  startX = e.touches[0].clientX;
  startTime = Date.now();
  isDragging.value = true;
};

const onTouchMove = (e: TouchEvent) => {
  if (!isDragging.value) return;
  currentX = e.touches[0].clientX;
  updateSwipeDirection();
};

const onTouchEnd = () => {
  if (!isDragging.value) return;
  handleSwipeEnd();
  isDragging.value = false;
  swipeDirection.value = '';
};

// Mouse events for desktop
const onMouseStart = (e: MouseEvent) => {
  startX = e.clientX;
  startTime = Date.now();
  isDragging.value = true;
  isMouseDown = true;
  e.preventDefault();
};

const onMouseMove = (e: MouseEvent) => {
  if (!isDragging.value || !isMouseDown) return;
  currentX = e.clientX;
  updateSwipeDirection();
};

const onMouseEnd = () => {
  if (!isDragging.value || !isMouseDown) return;
  handleSwipeEnd();
  isDragging.value = false;
  isMouseDown = false;
  swipeDirection.value = '';
};

// Modal swipe methods
const onModalTouchStart = (e: TouchEvent) => {
  startX = e.touches[0].clientX;
  startTime = Date.now();
  isDragging.value = true;
};

const onModalTouchMove = (e: TouchEvent) => {
  if (!isDragging.value) return;
  currentX = e.touches[0].clientX;
  updateSwipeDirection();
};

const onModalTouchEnd = () => {
  if (!isDragging.value) return;
  handleModalSwipeEnd();
  isDragging.value = false;
  swipeDirection.value = '';
};

const onModalMouseStart = (e: MouseEvent) => {
  startX = e.clientX;
  startTime = Date.now();
  isDragging.value = true;
  isMouseDown = true;
  e.preventDefault();
};

const onModalMouseMove = (e: MouseEvent) => {
  if (!isDragging.value || !isMouseDown) return;
  currentX = e.clientX;
  updateSwipeDirection();
};

const onModalMouseEnd = () => {
  if (!isDragging.value || !isMouseDown) return;
  handleModalSwipeEnd();
  isDragging.value = false;
  isMouseDown = false;
  swipeDirection.value = '';
};

// Helper methods
const updateSwipeDirection = () => {
  const diffX = currentX - startX;
  if (Math.abs(diffX) > 20) {
    swipeDirection.value = diffX > 0 ? 'right' : 'left';
  } else {
    swipeDirection.value = '';
  }
};

const handleSwipeEnd = () => {
  const diffX = currentX - startX;
  const diffTime = Date.now() - startTime;

  // Swipe threshold: 50px distance or 200ms time with 30px distance
  if (Math.abs(diffX) > 50 || (diffTime < 200 && Math.abs(diffX) > 30)) {
    if (diffX > 0) {
      previousPhoto();
    } else {
      nextPhoto();
    }
  }
};

const handleModalSwipeEnd = () => {
  const diffX = currentX - startX;
  const diffTime = Date.now() - startTime;

  if (Math.abs(diffX) > 50 || (diffTime < 200 && Math.abs(diffX) > 30)) {
    if (diffX > 0) {
      previousModalPhoto();
    } else {
      nextModalPhoto();
    }
  }
};

// Navigation methods
const nextPhoto = () => {
  if (!spot.value) return
  if (currentIndex.value < spot.value.photos.length - 1) {
    currentIndex.value++;
  }
};

const previousPhoto = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--;
  }
};

const goToPhoto = (index: number) => {
  currentIndex.value = index;
};

const nextModalPhoto = () => {
  if (!spot.value) return
  if (modalIndex.value < spot.value.photos.length - 1) {
    modalIndex.value++;
  }
};

const previousModalPhoto = () => {
  if (modalIndex.value > 0) {
    modalIndex.value--;
  }
};

const goToModalPhoto = (index: number) => {
  modalIndex.value = index;
};

// Modal methods
const openPhotoModal = (index: number = currentIndex.value) => {
  modalIndex.value = index;
  showModal.value = true;
  document.body.style.overflow = 'hidden';
};

const closeModal = () => {
  showModal.value = false;
  document.body.style.overflow = '';
  swipeDirection.value = '';
};

const closeModalOnBackdrop = (e: Event) => {
  if (e.target === e.currentTarget) {
    closeModal();
  }
};

onUnmounted(() => {
  document.body.style.overflow = '';
});
</script>
