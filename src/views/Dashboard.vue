<script setup>
import DashboardHeader from '../components/DashboardHeader.vue'
import Positions from '../components/Positions.vue'
import WatchList from '../components/WatchList.vue'
</script>

<template>
  <DashboardHeader />
  <main class="dashboard-grid">
    <Positions />
    <WatchList />
  </main>
</template>

<style scoped>
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding: 16px 24px;
  flex: 1;
}

@media (max-width: 900px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>
