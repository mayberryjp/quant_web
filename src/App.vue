<script setup>
const links = [
  { title: 'Dashboard', to: '/' },
  { title: 'Positions', to: '/positions' },
  { title: 'Health', to: '/health' },
]
</script>

<template>
  <v-app>
    <v-app-bar color="surface-variant" flat density="comfortable" border="b">
      <v-app-bar-title class="font-weight-bold">🌾 Algo Farm</v-app-bar-title>
      <template #append>
        <v-btn
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          exact
          rounded="lg"
          class="text-none"
        >
          {{ link.title }}
        </v-btn>
      </template>
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

