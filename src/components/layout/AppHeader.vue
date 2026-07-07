<script setup>
import { useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'
import { navItems } from '../../constants/navigation.js'

defineEmits(['toggle-drawer'])

const route = useRoute()
const { mdAndUp } = useDisplay()

// Highlight the active nav item. '/' matches exactly; others match by prefix so
// nested routes still light up their parent.
function isActive(item) {
  return item.to === '/' ? route.path === '/' : route.path.startsWith(item.to)
}
</script>

<template>
  <v-app-bar color="surface" flat border="b" height="64">
    <template #prepend>
      <v-app-bar-nav-icon
        v-if="!mdAndUp"
        aria-label="Open navigation"
        @click="$emit('toggle-drawer')"
      />
    </template>

    <router-link to="/" class="d-flex align-center text-decoration-none ms-2">
      <span class="text-h6 font-weight-bold text-high-emphasis">Kiza 兆</span>
    </router-link>

    <v-spacer />

    <nav v-if="mdAndUp" class="d-flex align-center ga-1 me-2">
      <v-btn
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        :active="isActive(item)"
        :color="isActive(item) ? 'primary' : undefined"
        variant="text"
        rounded="lg"
        class="text-none px-3"
      >
        {{ item.title }}
      </v-btn>
    </nav>
  </v-app-bar>
</template>
