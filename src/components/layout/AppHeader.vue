<script setup>
import { useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'
import { navItems } from '../../constants/navigation.js'

defineEmits(['toggle-drawer'])

const route = useRoute()

// Collapse to a hamburger drawer below 1280px (lg breakpoint).
const { lgAndUp } = useDisplay()

// Highlight the active nav item. '/' matches exactly; others match by prefix so
// nested routes still light up their parent.
function isActive(item) {
  return item.to === '/' ? route.path === '/' : route.path.startsWith(item.to)
}
</script>

<template>
  <v-app-bar color="surface" app elevation="1">
    <!-- Product branding (left); the whole block links to the dashboard -->
    <router-link
      to="/"
      class="product-branding d-flex align-center text-decoration-none ms-2 ms-lg-8"
    >
      <span class="product-name text-subtitle-1 text-lg-h5">Kiza 兆
        <!-- Tagline shown only >= 1500px (see `.tagline`), else hidden -->
        <span class="product-bar tagline">|</span>
        <span class="tagline-text tagline">Algo Farm</span>
      </span>
    </router-link>

    <v-spacer />

    <!-- Desktop navigation (full inline button row) -->
    <div v-if="lgAndUp" class="d-flex align-center">
      <v-btn
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        variant="text"
        class="nav-btn mx-2"
        rounded
        :color="isActive(item) ? 'primary' : ''"
      >
        <v-icon start>{{ item.icon }}</v-icon>
        {{ item.title }}
      </v-btn>
    </div>

    <!-- Mobile / tablet navigation (hamburger) -->
    <div v-else class="d-flex align-center">
      <v-app-bar-nav-icon
        aria-label="Open navigation menu"
        @click="$emit('toggle-drawer')"
      />
    </div>
  </v-app-bar>
</template>

<style scoped>
.v-app-bar {
  border-bottom: 0px !important;
}

.product-branding {
  margin-top: 5px;
  height: 48px;
}

.nav-btn {
  text-transform: capitalize;
  color: #b1b8c0;
  font-size: 16px !important;
  font-weight: 400;
  letter-spacing: 0em !important;
}

.product-name {
  color: #cf8e13;
  font-weight: 700;
  text-align: start;
  line-height: 1.4;
  letter-spacing: 0.05em !important;
  white-space: nowrap; /* never wrap the branding onto a second line */
}

.tagline-text {
  color: #9e394f;
  font-weight: 700;
  text-align: start;
  line-height: 1.4;
  letter-spacing: 0.05em !important;
}

.product-bar {
  color: #9e394f;
  font-weight: 700;
  text-align: start;
  line-height: 1.4;
  margin-right: 8px;
  letter-spacing: 0.05em !important;
}

/* Tagline hidden by default; shown only >= 1500px where nav + branding both fit.
   (Custom threshold — Vuetify's lg=1280 is too tight once the nav appears.) */
.tagline {
  display: none;
}

@media (min-width: 1500px) {
  .tagline {
    display: inline;
  }
}
</style>
