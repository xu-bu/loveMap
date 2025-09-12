<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const isLoaded = ref(false);

onMounted(() => {
  // Add entrance animation delay
  setTimeout(() => {
    isLoaded.value = true;
  }, 100);
});

const navigateToGaode = () => {
  router.push('/gaodeMap');
};

const navigateToGoogle = () => {
  router.push('/googleMap');
};
</script>

<template>
  <div class="index-container" :class="{ loaded: isLoaded }">
    <!-- Animated background -->
    <div class="bg-animation">
      <div class="floating-particles">
        <div class="particle" v-for="i in 20" :key="i"></div>
      </div>
      <div class="gradient-overlay"></div>
    </div>

    <!-- Main content -->
    <div class="content-wrapper">
      <!-- Header -->
      <div class="header-section">
        <div class="logo-container">
          <div class="logo-icon">🗺️</div>
          <h1 class="app-title">Love Map Explorer</h1>
        </div>
        <p class="subtitle">Choose your preferred mapping service</p>
      </div>

      <!-- Map selection buttons -->
      <div class="button-container">
        <!-- Gaode Map Button -->
        <button 
          class="map-button gaode-button"
          @click="navigateToGaode"
        >
          <div class="button-content">
            <div class="button-icon">
              <div class="icon-bg gaode-bg"></div>
              <span class="icon-text">高德</span>
            </div>
            <div class="button-info">
              <h2 class="button-title">Gaode Map</h2>
              <p class="button-description">高德地图 - Optimized for China mainland</p>
              <div class="button-features">
                <span class="feature-tag">中文支持</span>
                <span class="feature-tag">精确定位</span>
                <span class="feature-tag">本土化</span>
              </div>
            </div>
            <div class="button-arrow">→</div>
          </div>
          <div class="button-glow gaode-glow"></div>
        </button>

        <!-- Google Map Button -->
        <button 
          class="map-button google-button"
          @click="navigateToGoogle"
        >
          <div class="button-content">
            <div class="button-icon">
              <div class="icon-bg google-bg"></div>
              <span class="icon-text">🌐</span>
            </div>
            <div class="button-info">
              <h2 class="button-title">Google Maps</h2>
              <p class="button-description">Global coverage with satellite imagery</p>
              <div class="button-features">
                <span class="feature-tag">Global</span>
                <span class="feature-tag">Satellite</span>
                <span class="feature-tag">Street View</span>
              </div>
            </div>
            <div class="button-arrow">→</div>
          </div>
          <div class="button-glow google-glow"></div>
        </button>
      </div>

      <!-- Footer info -->
      <div class="footer-section">
        <p class="footer-text">Create and share your special moments on interactive maps</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.index-container {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%);
  font-family: 'Google Sans', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  opacity: 0;
  transform: scale(0.95);
  transition: all 0.8s cubic-bezier(0.23, 1, 0.320, 1);
}

.index-container.loaded {
  opacity: 1;
  transform: scale(1);
}

/* Animated Background */
.bg-animation {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}

.floating-particles {
  position: absolute;
  width: 100%;
  height: 100%;
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: rgba(66, 133, 244, 0.6);
  border-radius: 50%;
  animation: float 6s ease-in-out infinite;
}

.particle:nth-child(odd) {
  background: rgba(234, 67, 53, 0.4);
  animation-delay: -2s;
}

.particle:nth-child(3n) {
  background: rgba(52, 168, 83, 0.4);
  animation-delay: -4s;
}

/* Random positioning for particles */
.particle:nth-child(1) { top: 20%; left: 10%; animation-duration: 8s; }
.particle:nth-child(2) { top: 80%; left: 20%; animation-duration: 6s; }
.particle:nth-child(3) { top: 40%; left: 80%; animation-duration: 7s; }
.particle:nth-child(4) { top: 60%; left: 30%; animation-duration: 9s; }
.particle:nth-child(5) { top: 10%; left: 70%; animation-duration: 5s; }
.particle:nth-child(6) { top: 90%; left: 60%; animation-duration: 8s; }
.particle:nth-child(7) { top: 30%; left: 50%; animation-duration: 6s; }
.particle:nth-child(8) { top: 70%; left: 90%; animation-duration: 7s; }
.particle:nth-child(9) { top: 50%; left: 15%; animation-duration: 8s; }
.particle:nth-child(10) { top: 25%; left: 85%; animation-duration: 6s; }

.gradient-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 30%, rgba(66, 133, 244, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(234, 67, 53, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(52, 168, 83, 0.05) 0%, transparent 50%);
}

/* Main Content */
.content-wrapper {
  position: relative;
  z-index: 10;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 2rem;
}

/* Header */
.header-section {
  text-align: center;
  margin-bottom: 3rem;
  animation: slideDown 0.8s ease-out 0.2s both;
}

.logo-container {
  margin-bottom: 1rem;
}

.logo-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  display: inline-block;
  animation: pulse 2s ease-in-out infinite;
}

.app-title {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #4285f4, #34a853, #ea4335);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
  letter-spacing: -0.5px;
}

.subtitle {
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.1rem;
  margin: 0.5rem 0 0 0;
  font-weight: 300;
}

/* Button Container */
.button-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 600px;
  width: 100%;
  margin: 0 auto;
}

/* Map Buttons */
.map-button {
  position: relative;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 0;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.23, 1, 0.320, 1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  height: 140px;
  opacity: 0;
  transform: translateY(30px);
}

.gaode-button {
  animation: slideUp 0.6s ease-out 0.4s both;
}

.google-button {
  animation: slideUp 0.6s ease-out 0.6s both;
}

.map-button:hover {
  transform: translateY(-8px) scale(1.02);
  border-color: rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.08);
}

.map-button:active {
  transform: translateY(-4px) scale(1.01);
}

.button-content {
  display: flex;
  align-items: center;
  padding: 1.5rem 2rem;
  height: 100%;
  position: relative;
  z-index: 2;
}

.button-icon {
  position: relative;
  margin-right: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-bg {
  width: 60px;
  height: 60px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
}

.gaode-bg {
  background: linear-gradient(135deg, #00b4d8, #0077be);
  box-shadow: 0 8px 32px rgba(0, 180, 216, 0.3);
}

.google-bg {
  background: linear-gradient(135deg, #4285f4, #34a853);
  box-shadow: 0 8px 32px rgba(66, 133, 244, 0.3);
}

.icon-text {
  font-size: 1.5rem;
  color: white;
  font-weight: 600;
  position: relative;
  z-index: 1;
}

.button-info {
  flex: 1;
  text-align: left;
  color: white;
}

.button-title {
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.3px;
}

.button-description {
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
  margin: 0 0 1rem 0;
  line-height: 1.4;
}

.button-features {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.feature-tag {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.button-arrow {
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.6);
  transition: all 0.3s ease;
  transform: translateX(0);
}

.map-button:hover .button-arrow {
  transform: translateX(8px);
  color: white;
}

/* Button Glows */
.button-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 20px;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.gaode-glow {
  background: linear-gradient(135deg, rgba(0, 180, 216, 0.2), rgba(0, 119, 190, 0.2));
}

.google-glow {
  background: linear-gradient(135deg, rgba(66, 133, 244, 0.2), rgba(52, 168, 83, 0.2));
}

.map-button:hover .button-glow {
  opacity: 1;
}

/* Footer */
.footer-section {
  text-align: center;
  margin-top: 2rem;
  animation: fadeIn 0.8s ease-out 0.8s both;
}

.footer-text {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
  margin: 0;
  font-style: italic;
}

/* Animations */
@keyframes float {
  0%, 100% {
    transform: translateY(0) translateX(0) rotate(0deg);
  }
  25% {
    transform: translateY(-20px) translateX(10px) rotate(90deg);
  }
  50% {
    transform: translateY(-10px) translateX(-10px) rotate(180deg);
  }
  75% {
    transform: translateY(-30px) translateX(5px) rotate(270deg);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

@keyframes slideDown {
  0% {
    opacity: 0;
    transform: translateY(-30px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  0% {
    opacity: 0;
    transform: translateY(30px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .content-wrapper {
    padding: 1.5rem;
  }
  
  .app-title {
    font-size: 2rem;
  }
  
  .button-content {
    padding: 1.2rem 1.5rem;
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  
  .button-icon {
    margin-right: 0;
    margin-bottom: 0.5rem;
  }
  
  .button-info {
    text-align: center;
  }
  
  .button-title {
    font-size: 1.5rem;
  }
  
  .button-arrow {
    position: absolute;
    top: 1rem;
    right: 1rem;
  }
  
  .map-button {
    height: auto;
    min-height: 120px;
  }
}

@media (max-width: 480px) {
  .app-title {
    font-size: 1.8rem;
  }
  
  .subtitle {
    font-size: 1rem;
  }
  
  .button-container {
    gap: 1rem;
  }
  
  .icon-bg {
    width: 50px;
    height: 50px;
  }
  
  .icon-text {
    font-size: 1.2rem;
  }
}
</style>