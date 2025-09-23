<template>
  <div id="app">
    <!-- cache page by route name -->
    <router-view v-slot="{ Component }">
      <keep-alive :include="['GaodeMap']">
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </div>
</template>

<script setup>
</script>

<style>
#app {
  height: 100vh;
  width: 100vw;
  margin: 0;
  padding: 0;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>