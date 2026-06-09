<script setup>
</script>

<template>
  <div class="app-shell">
    <nav class="top-nav">
      <span class="nav-brand">🌾 Algo Farm</span>
      <div class="nav-links">
        <router-link to="/" class="nav-btn">Dashboard</router-link>
        <router-link to="/health" class="nav-btn">Health</router-link>
      </div>
    </nav>
    <router-view />
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.top-nav {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 8px 24px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border);
}

.nav-brand {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin-right: auto;
}

.nav-links {
  display: flex;
  gap: 8px;
}

.nav-btn {
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  text-decoration: none;
  background: transparent;
  border: 1px solid transparent;
  transition: all 0.15s;
}

.nav-btn:hover {
  color: var(--text-primary);
  background: var(--bg-secondary);
}

.nav-btn.router-link-exact-active {
  color: var(--text-primary);
  background: var(--bg-card);
  border-color: var(--border);
}
</style>
