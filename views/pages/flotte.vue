<script setup lang="ts">
import type { Vehicle } from '~/models/Vehicle'
import { formatMileage, getStatusLabel, getStatusColor } from '~/controllers/FleetController'

const vehicles: Vehicle[] = [
  {
    id: '1',
    licensePlate: 'AB-123-CD',
    brand: 'Renault',
    model: 'Kangoo E-Tech',
    year: 2023,
    status: 'excellent',
    ecoScore: 92,
    technicalInspection: { status: 'valid', nextDate: '2026-06-15' },
    insurance: { status: 'valid', expiryDate: '2026-03-01' },
    maintenance: { status: 'ok', mileage: 24500 }
  },
  {
    id: '2',
    licensePlate: 'EF-456-GH',
    brand: 'Peugeot',
    model: 'Expert',
    year: 2021,
    status: 'good',
    ecoScore: 78,
    technicalInspection: { status: 'expiring', nextDate: '2026-02-20' },
    insurance: { status: 'valid', expiryDate: '2026-05-15' },
    maintenance: { status: 'ok', mileage: 67800 }
  },
  {
    id: '3',
    licensePlate: 'IJ-789-KL',
    brand: 'Citroën',
    model: 'Berlingo',
    year: 2019,
    status: 'warning',
    ecoScore: 54,
    technicalInspection: { status: 'valid', nextDate: '2026-08-10' },
    insurance: { status: 'expiring', expiryDate: '2026-01-30' },
    maintenance: { status: 'due', mileage: 112000 }
  },
  {
    id: '4',
    licensePlate: 'MN-012-OP',
    brand: 'Ford',
    model: 'Transit Custom',
    year: 2020,
    status: 'good',
    ecoScore: 71,
    technicalInspection: { status: 'valid', nextDate: '2027-01-05' },
    insurance: { status: 'valid', expiryDate: '2026-09-20' },
    maintenance: { status: 'ok', mileage: 89500 }
  },
  {
    id: '5',
    licensePlate: 'QR-345-ST',
    brand: 'Mercedes',
    model: 'Sprinter',
    year: 2018,
    status: 'critical',
    ecoScore: 32,
    technicalInspection: { status: 'expiring', nextDate: '2026-03-18' },
    insurance: { status: 'expiring', expiryDate: '2026-02-28' },
    maintenance: { status: 'overdue', mileage: 198000 }
  },
  {
    id: '6',
    licensePlate: 'UV-678-WX',
    brand: 'Volkswagen',
    model: 'Crafter',
    year: 2022,
    status: 'excellent',
    ecoScore: 88,
    technicalInspection: { status: 'valid', nextDate: '2026-11-22' },
    insurance: { status: 'valid', expiryDate: '2026-07-10' },
    maintenance: { status: 'ok', mileage: 45200 }
  }
]

function getInspectionColor(status: string): string {
  const colors: Record<string, string> = {
    valid: '#00ff88', expiring: '#ffaa00', expired: '#ff4444',
    ok: '#00ff88', due: '#ffaa00', overdue: '#ff4444'
  }
  return colors[status] || '#888'
}
</script>

<template>
  <div class="flotte-page">
    <div class="bg">
      <div class="glow glow-1"></div>
      <div class="glow glow-2"></div>
      <div class="noise"></div>
    </div>

    <nav class="nav">
      <div class="logo">
        <span class="logo-mark">●</span>
        <span class="logo-text">DOTSTO</span>
      </div>
      <div class="nav-links">
        <NuxtLink to="/" class="nav-link">Accueil</NuxtLink>
        <NuxtLink to="/flotte" class="nav-link active">Flotte</NuxtLink>
      </div>
      <button class="btn-nav">Connexion</button>
    </nav>

    <header class="page-header">
      <div class="header-content">
        <div class="tag">
          <span class="tag-dot"></span>
          {{ vehicles.length }} véhicules
        </div>
        <h1 class="page-title">Votre <span class="highlight">flotte</span></h1>
        <p class="page-subtitle">Vue d'ensemble de tous vos véhicules et leur état de santé.</p>
      </div>
    </header>

    <main class="fleet-container">
      <div class="fleet-grid">
        <article v-for="vehicle in vehicles" :key="vehicle.id" class="vehicle-card" :class="`status-${vehicle.status}`">
          <div class="card-header">
            <div class="plate">
              <span class="status-indicator" :style="{ background: getStatusColor(vehicle.status) }"></span>
              <span class="plate-number">{{ vehicle.licensePlate }}</span>
            </div>
            <div class="status-badge" :style="{ color: getStatusColor(vehicle.status), borderColor: getStatusColor(vehicle.status) }">
              {{ getStatusLabel(vehicle.status) }}
            </div>
          </div>

          <div class="vehicle-info">
            <h3 class="vehicle-name">{{ vehicle.brand }} {{ vehicle.model }}</h3>
            <p class="vehicle-meta">{{ vehicle.year }} · {{ formatMileage(vehicle.maintenance.mileage) }}</p>
          </div>

          <div class="eco-score-section">
            <div class="eco-score-display">
              <svg class="score-ring" viewBox="0 0 100 100">
                <circle class="score-bg" cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="8" />
                <circle class="score-progress" cx="50" cy="50" r="40" fill="none" :stroke="getStatusColor(vehicle.status)" stroke-width="8" stroke-linecap="round" :stroke-dasharray="`${vehicle.ecoScore * 2.51} 251`" transform="rotate(-90 50 50)" />
              </svg>
              <div class="score-value">
                <span class="score-number">{{ vehicle.ecoScore }}</span>
              </div>
            </div>
            <div class="score-label">Eco-Score</div>
          </div>

          <div class="status-grid">
            <div class="status-item">
              <span class="status-icon">🔧</span>
              <span class="status-text">CT</span>
              <span class="status-dot" :style="{ background: getInspectionColor(vehicle.technicalInspection.status) }"></span>
            </div>
            <div class="status-item">
              <span class="status-icon">🛡️</span>
              <span class="status-text">Assurance</span>
              <span class="status-dot" :style="{ background: getInspectionColor(vehicle.insurance.status) }"></span>
            </div>
            <div class="status-item">
              <span class="status-icon">⚙️</span>
              <span class="status-text">Entretien</span>
              <span class="status-dot" :style="{ background: getInspectionColor(vehicle.maintenance.status) }"></span>
            </div>
          </div>

          <div class="card-actions">
            <button class="btn-primary-sm">📋 Planifier CT</button>
            <button class="btn-ghost-sm">⚡ Actions</button>
          </div>
        </article>
      </div>
    </main>

    <footer class="footer">
      <p>© 2026 DOTSTO — Gestion intelligente de flotte</p>
    </footer>
  </div>
</template>

<style scoped>
.flotte-page { min-height: 100vh; position: relative; }

.bg { position: fixed; inset: 0; z-index: 0; overflow: hidden; }
.glow { position: absolute; border-radius: 50%; filter: blur(120px); }
.glow-1 { width: 600px; height: 600px; background: radial-gradient(circle, rgba(0, 255, 136, 0.12) 0%, transparent 70%); top: -200px; left: 50%; transform: translateX(-50%); }
.glow-2 { width: 500px; height: 500px; background: radial-gradient(circle, rgba(0, 200, 255, 0.08) 0%, transparent 70%); bottom: -100px; right: -100px; }
.noise { position: absolute; inset: 0; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E"); opacity: 0.03; pointer-events: none; }

.nav { position: relative; z-index: 10; display: flex; align-items: center; justify-content: space-between; padding: 24px 48px; max-width: 1400px; margin: 0 auto; }
.logo { display: flex; align-items: center; gap: 10px; }
.logo-mark { color: #00ff88; font-size: 1.5rem; text-shadow: 0 0 20px rgba(0, 255, 136, 0.5); }
.logo-text { font-size: 1.3rem; font-weight: 800; letter-spacing: 3px; }
.nav-links { display: flex; gap: 8px; }
.nav-link { padding: 10px 20px; font-size: 0.95rem; font-weight: 500; color: rgba(255, 255, 255, 0.6); border-radius: 8px; transition: all 0.2s; }
.nav-link:hover, .nav-link.active { color: #fff; background: rgba(255, 255, 255, 0.05); }
.btn-nav { padding: 10px 24px; background: transparent; border: 1px solid rgba(255, 255, 255, 0.15); color: #fff; font-size: 0.9rem; font-weight: 500; border-radius: 8px; transition: all 0.2s; }
.btn-nav:hover { background: rgba(255, 255, 255, 0.05); border-color: rgba(255, 255, 255, 0.3); }

.page-header { position: relative; z-index: 1; max-width: 1400px; margin: 0 auto; padding: 40px 48px 60px; }
.tag { display: inline-flex; align-items: center; gap: 10px; padding: 8px 16px; background: rgba(0, 255, 136, 0.08); border: 1px solid rgba(0, 255, 136, 0.2); border-radius: 100px; font-size: 0.85rem; color: #00ff88; margin-bottom: 20px; }
.tag-dot { width: 6px; height: 6px; background: #00ff88; border-radius: 50%; animation: pulse 2s ease-in-out infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
.page-title { font-size: 3rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 12px; }
.highlight { background: linear-gradient(135deg, #00ff88 0%, #00d4ff 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.page-subtitle { font-size: 1.1rem; color: rgba(255, 255, 255, 0.5); }

.fleet-container { position: relative; z-index: 1; max-width: 1400px; margin: 0 auto; padding: 0 48px 80px; }
.fleet-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 24px; }

.vehicle-card { background: rgba(15, 15, 20, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 20px; padding: 24px; backdrop-filter: blur(20px); transition: all 0.3s ease; }
.vehicle-card:hover { transform: translateY(-4px); border-color: rgba(255, 255, 255, 0.15); box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3); }
.vehicle-card.status-excellent { border-color: rgba(34, 197, 94, 0.3); }
.vehicle-card.status-good { border-color: rgba(59, 130, 246, 0.3); }
.vehicle-card.status-warning { border-color: rgba(245, 158, 11, 0.3); }
.vehicle-card.status-critical { border-color: rgba(239, 68, 68, 0.3); }

.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.plate { display: flex; align-items: center; gap: 10px; }
.status-indicator { width: 10px; height: 10px; border-radius: 50%; box-shadow: 0 0 10px currentColor; }
.plate-number { font-family: 'JetBrains Mono', monospace; font-size: 1rem; font-weight: 700; letter-spacing: 1px; }
.status-badge { padding: 4px 12px; border: 1px solid; border-radius: 20px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }

.vehicle-info { margin-bottom: 24px; }
.vehicle-name { font-size: 1.3rem; font-weight: 700; margin-bottom: 4px; }
.vehicle-meta { font-size: 0.9rem; color: rgba(255, 255, 255, 0.5); }

.eco-score-section { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; padding: 20px; background: rgba(255, 255, 255, 0.03); border-radius: 16px; }
.eco-score-display { position: relative; width: 80px; height: 80px; }
.score-ring { width: 100%; height: 100%; }
.score-progress { transition: stroke-dasharray 0.8s ease-out; }
.score-value { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
.score-number { font-size: 1.8rem; font-weight: 800; }
.score-label { font-size: 0.85rem; color: rgba(255, 255, 255, 0.5); text-transform: uppercase; letter-spacing: 1px; }

.status-grid { display: flex; gap: 12px; margin-bottom: 20px; }
.status-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 12px 8px; background: rgba(255, 255, 255, 0.03); border-radius: 12px; }
.status-icon { font-size: 1.2rem; }
.status-text { font-size: 0.7rem; color: rgba(255, 255, 255, 0.5); text-transform: uppercase; letter-spacing: 0.5px; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; box-shadow: 0 0 8px currentColor; }

.card-actions { display: flex; gap: 10px; }
.btn-primary-sm { flex: 1; padding: 12px 16px; background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%); color: #050508; font-size: 0.85rem; font-weight: 600; border: none; border-radius: 10px; transition: all 0.2s; }
.btn-primary-sm:hover { transform: translateY(-2px); box-shadow: 0 0 20px rgba(0, 255, 136, 0.3); }
.btn-ghost-sm { flex: 1; padding: 12px 16px; background: transparent; color: #fff; font-size: 0.85rem; font-weight: 500; border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 10px; transition: all 0.2s; }
.btn-ghost-sm:hover { background: rgba(255, 255, 255, 0.05); border-color: rgba(255, 255, 255, 0.3); }

.footer { position: relative; z-index: 1; text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.3); font-size: 0.9rem; border-top: 1px solid rgba(255, 255, 255, 0.05); }

@media (max-width: 768px) {
  .nav { padding: 16px 24px; }
  .nav-links { display: none; }
  .page-header { padding: 24px 24px 40px; }
  .page-title { font-size: 2rem; }
  .fleet-container { padding: 0 24px 60px; }
  .fleet-grid { grid-template-columns: 1fr; }
  .status-grid { flex-wrap: wrap; }
  .status-item { min-width: calc(33% - 8px); }
}
</style>
