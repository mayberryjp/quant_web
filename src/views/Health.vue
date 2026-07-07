<script setup>
import { ref } from 'vue'
import { useDisplay } from 'vuetify'
import { healthSections } from '../constants/healthSections.js'
import SymbolsPanel from '../components/symbols/SymbolsPanel.vue'
import ServiceHealthPanel from '../components/health/ServiceHealthPanel.vue'

// Tabs render vertically on desktop (lg+) and as a horizontal scrollable bar on
// smaller screens, mirroring the reference project's settings layout.
const { lgAndUp } = useDisplay()
const activeTab = ref('symbols')
</script>

<template>
  <v-row no-gutters class="health-hub">
    <!-- Left navigation rail -->
    <v-col cols="12" lg="3" xl="2" class="health-rail">
      <v-tabs
        v-model="activeTab"
        :direction="lgAndUp ? 'vertical' : 'horizontal'"
        :show-arrows="!lgAndUp"
        color="primary"
        class="py-2"
      >
        <v-tab
          v-for="section in healthSections"
          :key="section.value"
          :value="section.value"
          class="justify-start text-none px-6"
        >
          {{ section.title }}
        </v-tab>
      </v-tabs>
    </v-col>

    <!-- Section content -->
    <v-col cols="12" lg="9" xl="10" class="pa-4 pa-md-6">
      <v-window v-model="activeTab">
        <v-window-item value="symbols">
          <h3 class="text-h6 font-weight-bold mb-1">SYMBOLS</h3>
          <v-divider class="mb-4" />
          <SymbolsPanel />
        </v-window-item>

        <v-window-item value="services">
          <h3 class="text-h6 font-weight-bold mb-1">SERVICES</h3>
          <v-divider class="mb-4" />
          <ServiceHealthPanel />
        </v-window-item>
      </v-window>
    </v-col>
  </v-row>
</template>

<style scoped>
/* Divider between the vertical rail and content on desktop. A token-based
   border can't be expressed through Vuetify props on a responsive v-col. */
@media (min-width: 1280px) {
  .health-rail {
    border-right: 1px solid rgb(var(--v-theme-surface-bright));
    min-height: calc(100vh - 64px);
  }
}
</style>
