<script setup>
import { ref } from 'vue'
import AppHeader from './components/layout/AppHeader.vue'
import { navItems } from './constants/navigation.js'

const drawer = ref(false)
</script>

<template>
  <v-app>
    <AppHeader @toggle-drawer="drawer = !drawer" />

    <v-navigation-drawer v-model="drawer" temporary location="left">
      <v-list nav density="comfortable">
        <v-list-item
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :title="item.title"
          @click="drawer = false"
        />
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

