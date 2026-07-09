<script setup>
import { ref } from 'vue'
import { useDisplay } from 'vuetify'
import { healthSections } from '../constants/healthSections.js'
import SymbolsPanel from '../components/symbols/SymbolsPanel.vue'
import DailyBarsPanel from '../components/dailyBars/DailyBarsPanel.vue'
import CnbcPanel from '../components/cnbc/CnbcPanel.vue'
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
        class="health-tabs py-2"
      >
        <v-tab
          v-for="section in healthSections"
          :key="section.value"
          :value="section.value"
          class="justify-start text-none px-6"
        >
          <h3 class="section-label">{{ section.title }}</h3>
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

        <v-window-item value="daily-bars">
          <h3 class="text-h6 font-weight-bold mb-1">DAILY BARS</h3>
          <v-divider class="mb-4" />
          <DailyBarsPanel />
        </v-window-item>

        <v-window-item value="cnbc">
          <h3 class="text-h6 font-weight-bold mb-1">CNBC</h3>
          <v-divider class="mb-4" />
          <CnbcPanel />
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
/* On desktop the rail is a sticky sidebar: it stays pinned below the 64px
   app-bar while the section content scrolls. `align-self: flex-start` stops the
   flex column from stretching to the full row height (which would defeat
   sticky). A token-based border can't be expressed through Vuetify props on a
   responsive v-col. */
@media (min-width: 1280px) {
  .health-rail {
    position: sticky;
    top: 64px;
    align-self: flex-start;
    border-right: 1px solid rgb(var(--v-theme-surface-bright));
    min-height: calc(100vh - 64px);
  }
}

/* Rail styled to match the reference settings nav: dark surface, quiet
   h3-style labels (on-surface at 87%, medium weight, not upper-forced). */
.health-rail {
  background-color: #0d1117;
}

.health-tabs :deep(.v-tab) {
  min-height: 44px;
  letter-spacing: normal;
}

.section-label {
  color: rgba(var(--v-theme-on-surface), 0.87);
  font-weight: 500;
  font-size: 1rem;
  margin: 0;
  text-transform: capitalize;
}
</style>
