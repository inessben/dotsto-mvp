<script setup lang="ts">
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { Reflector } from 'three/addons/objects/Reflector.js'
import gsap from 'gsap'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const scrollContainerRef = ref<HTMLElement | null>(null)
const isLoading = ref(true)
const loadingProgress = ref(0)
const loadingStatus = ref('Initialisation...')

let minLoadingDone = false
let modelLoadingDone = false

function checkLoadingComplete() {
  if (minLoadingDone && modelLoadingDone) {
    loadingStatus.value = 'Prêt !'
    loadingProgress.value = 100
    setTimeout(() => { isLoading.value = false }, 500)
  }
}

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let animationId: number
let carModel: THREE.Group | null = null
let particles: THREE.Points | null = null
let scanLines: THREE.Line[] = []

let currentRotation = 0
let targetRotation = 0
let currentZoom = 1
let targetZoom = 1

function initScene() {
  if (!canvasRef.value) return

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x000000)
  scene.fog = new THREE.FogExp2(0x000000, 0.035)

  camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100)
  camera.position.set(14, 3.5, 8)
  camera.lookAt(6, 1, 0)

  renderer = new THREE.WebGLRenderer({ canvas: canvasRef.value, antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.outputColorSpace = THREE.SRGBColorSpace
}

function setupLighting() {
  const pmremGenerator = new THREE.PMREMGenerator(renderer)
  const envScene = new THREE.Scene()
  envScene.background = new THREE.Color(0x1a1a2e)
  
  const light1 = new THREE.RectAreaLight(0xffffff, 10, 10, 10)
  light1.position.set(0, 5, 5)
  envScene.add(light1)
  
  const light2 = new THREE.RectAreaLight(0xffffff, 5, 10, 10)
  light2.position.set(-5, 3, -5)
  envScene.add(light2)
  
  scene.environment = pmremGenerator.fromScene(envScene, 0.04).texture
  pmremGenerator.dispose()

  scene.add(new THREE.AmbientLight(0xffffff, 0.3))
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 0.4))

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.5)
  keyLight.position.set(8, 10, 8)
  keyLight.castShadow = true
  keyLight.shadow.mapSize.set(2048, 2048)
  keyLight.shadow.camera.near = 0.5
  keyLight.shadow.camera.far = 30
  keyLight.shadow.camera.left = -10
  keyLight.shadow.camera.right = 10
  keyLight.shadow.camera.top = 10
  keyLight.shadow.camera.bottom = -10
  scene.add(keyLight)

  const fillLight = new THREE.DirectionalLight(0xe8f0ff, 0.8)
  fillLight.position.set(-6, 5, 2)
  scene.add(fillLight)

  const rimLight = new THREE.DirectionalLight(0xffffff, 1)
  rimLight.position.set(0, 4, -10)
  scene.add(rimLight)
}

function createParticles() {
  const positions = new Float32Array(150 * 3)
  for (let i = 0; i < 150; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 40
    positions[i * 3 + 1] = Math.random() * 15
    positions[i * 3 + 2] = (Math.random() - 0.5) * 40
  }
  
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  
  particles = new THREE.Points(geometry, new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.08,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending
  }))
  scene.add(particles)
}

function createGround() {
  const groundColor = 0x0a1210

  const reflector = new Reflector(new THREE.PlaneGeometry(40, 40), {
    clipBias: 0.003,
    textureWidth: window.innerWidth * window.devicePixelRatio,
    textureHeight: window.innerHeight * window.devicePixelRatio,
    color: groundColor
  })
  reflector.rotation.x = -Math.PI / 2
  reflector.position.y = -0.01
  scene.add(reflector)

  const overlay = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.MeshBasicMaterial({ color: groundColor, transparent: true, opacity: 0.5 })
  )
  overlay.rotation.x = -Math.PI / 2
  overlay.position.y = 0.001
  scene.add(overlay)

  const grid = new THREE.GridHelper(40, 20, 0x00ff88, 0x00ff88)
  const mat = grid.material as THREE.Material
  if (Array.isArray(mat)) mat.forEach(m => { m.transparent = true; m.opacity = 0.3 })
  else { mat.transparent = true; mat.opacity = 0.3 }
  scene.add(grid)

  for (let i = 0; i < 5; i++) {
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-20, 0.02, 0),
        new THREE.Vector3(20, 0.02, 0)
      ]),
      new THREE.LineBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.5 })
    )
    line.position.z = -20 + i * 10
    scene.add(line)
    scanLines.push(line)
  }
}

function loadCarModel() {
  loadingStatus.value = 'Chargement ...'
  
  setTimeout(() => {
    minLoadingDone = true
    checkLoadingComplete()
  }, 1500)

  new GLTFLoader().load('/models/car.glb',
    (gltf) => {
      loadingStatus.value = 'Chargement...'
      carModel = gltf.scene
      const box = new THREE.Box3().setFromObject(carModel)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())

      carModel.position.set(-center.x + 6, 0, -center.z)
      carModel.scale.setScalar(6.5 / Math.max(size.x, size.y, size.z))
      
      const scaledBox = new THREE.Box3().setFromObject(carModel)
      carModel.position.y = -scaledBox.min.y

      carModel.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          child.castShadow = true
          child.receiveShadow = true
          const oldMat = child.material as THREE.MeshStandardMaterial
          child.material = new THREE.MeshPhysicalMaterial({
            color: oldMat.color || new THREE.Color(0xffffff),
            metalness: 0.9,
            roughness: 0.1,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            envMapIntensity: 1.5,
            map: oldMat.map || null
          })
        }
      })

      scene.add(carModel)
      gsap.from(carModel.position, { y: carModel.position.y - 0.8, duration: 2, ease: 'power3.out' })
      gsap.from(carModel.rotation, { y: -0.5, duration: 2, ease: 'power3.out' })
      
      modelLoadingDone = true
      checkLoadingComplete()
    },
    (xhr) => {
      if (xhr.lengthComputable) {
        loadingProgress.value = Math.round((xhr.loaded / xhr.total) * 90)
      } else {
        loadingProgress.value = Math.min(loadingProgress.value + 5, 80)
      }
    },
    (error) => {
      console.error('Erreur chargement:', error)
      loadingStatus.value = 'Erreur de chargement'
      setTimeout(() => { isLoading.value = false }, 2000)
    }
  )
}

function handleScroll() {
  if (!scrollContainerRef.value) return
  const progress = scrollContainerRef.value.scrollTop / (scrollContainerRef.value.scrollHeight - window.innerHeight)
  targetRotation = progress * Math.PI * 1.2
  targetZoom = 1 + progress * 1.8
}

function animate() {
  animationId = requestAnimationFrame(animate)
  const time = Date.now() * 0.0001

  currentRotation += (targetRotation - currentRotation) * 0.05
  currentZoom += (targetZoom - currentZoom) * 0.05

  if (carModel) carModel.rotation.y = currentRotation

  if (particles) {
    particles.rotation.y = time * 0.5
    const pos = particles.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < pos.length; i += 3) pos[i + 1] += Math.sin(time * 10 + i) * 0.002
    particles.geometry.attributes.position.needsUpdate = true
  }

  scanLines.forEach((line, i) => {
    line.position.z = ((Date.now() * 0.001 + i * 8) % 40) - 20
    const mat = line.material as THREE.LineBasicMaterial
    mat.opacity = 0.3 + Math.sin(Date.now() * 0.002 + i) * 0.2
  })

  const dist = 12 / currentZoom
  const angle = Math.atan2(camera.position.z, camera.position.x - 6)
  camera.position.x = 6 + Math.cos(angle) * dist
  camera.position.z = Math.sin(angle) * dist
  camera.lookAt(6, 1, 0)

  renderer.render(scene, camera)
}

function handleResize() {
  if (!camera || !renderer) return
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

onMounted(() => {
  initScene()
  setupLighting()
  createParticles()
  createGround()
  loadCarModel()
  animate()
  window.addEventListener('resize', handleResize)
  scrollContainerRef.value?.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', handleResize)
  scrollContainerRef.value?.removeEventListener('scroll', handleScroll)
  renderer?.dispose()
})
</script>

<template>
  <div class="page-wrapper">
    <div class="hud-corners">
      <div class="hud-corner tl"></div>
      <div class="hud-corner tr"></div>
      <div class="hud-corner bl"></div>
      <div class="hud-corner br"></div>
    </div>

    <canvas ref="canvasRef" class="three-canvas"></canvas>

    <Transition name="fade">
      <div v-if="isLoading" class="loading-screen">
        <div class="loading-content">
          <div class="loading-icon">
            <div class="spinner"></div>
            <div class="spinner-glow"></div>
          </div>
          <div class="loading-logo">DOTSTO</div>
          <div class="loading-bar-container">
            <div class="loading-bar" :style="{ width: loadingProgress + '%' }"></div>
          </div>
          <p class="loading-status">{{ loadingStatus }}</p>
          <p class="loading-percent">{{ loadingProgress }}%</p>
        </div>
      </div>
    </Transition>

    <div ref="scrollContainerRef" class="scroll-container">
      <nav class="nav">
        <div class="logo">
          <span class="logo-mark">●</span>
          <span class="logo-text">DOTSTO</span>
        </div>
        <div class="nav-links">
          <NuxtLink to="/" class="nav-link active">Accueil</NuxtLink>
          <NuxtLink to="/flotte" class="nav-link">Flotte</NuxtLink>
        </div>
        <button class="btn-nav">Connexion</button>
      </nav>

      <section class="hero-section">
        <div class="hero-overlay">
          <div class="hero-content">
            <div class="hero-badge">🚀 Gestion de flotte intelligente</div>
            <h1>Anticipez.<br><span class="gradient-text">Optimisez.</span></h1>
            <p class="hero-description">
              Centralisez la gestion de vos véhicules et anticipez<br>
              les problèmes avant qu'ils ne vous coûtent cher.
            </p>
            <NuxtLink to="/flotte" class="btn-hero">Voir la flotte</NuxtLink>
          </div>
        </div>
        <div class="scroll-indicator">
          <span class="scroll-text">Découvrir</span>
          <div class="scroll-line"></div>
        </div>
      </section>

      <section class="content-section" id="features">
        <div class="container">
          <div class="section-header">
            <div class="section-badge">Fonctionnalités</div>
            <h2>Intelligence au service<br>de votre flotte</h2>
            <p>Une suite complète d'outils pour gérer, optimiser et anticiper tous les besoins de vos véhicules.</p>
          </div>
          <div class="features-list">
            <div class="feature-card">
              <span class="feature-icon">🔮</span>
              <div class="feature-content">
                <h3>IA Prédictive</h3>
                <p>Anticipez les pannes avant qu'elles ne surviennent. Réduisez les temps d'arrêt de 45%.</p>
              </div>
            </div>
            <div class="feature-card">
              <span class="feature-icon">✓</span>
              <div class="feature-content">
                <h3>Conformité Auto</h3>
                <p>Gérez automatiquement contrôles techniques, assurances et échéances.</p>
              </div>
            </div>
            <div class="feature-card">
              <span class="feature-icon">💎</span>
              <div class="feature-content">
                <h3>Optimisation Coûts</h3>
                <p>Visualisez les coûts sur 12 mois. Décidez du moment optimal pour réparer ou vendre.</p>
              </div>
            </div>
            <div class="feature-card">
              <span class="feature-icon">⚡</span>
              <div class="feature-content">
                <h3>Alertes Temps Réel</h3>
                <p>Notifications intelligentes sur les actions prioritaires.</p>
              </div>
            </div>
            <div class="feature-card">
              <span class="feature-icon">📊</span>
              <div class="feature-content">
                <h3>Dashboard Live</h3>
                <p>Vue d'ensemble complète en temps réel.</p>
              </div>
            </div>
            <div class="feature-card">
              <span class="feature-icon">🔧</span>
              <div class="feature-content">
                <h3>Historique 360°</h3>
                <p>Accédez à l'historique complet : entretiens, réparations, incidents.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="content-section" id="how-it-works">
        <div class="container">
          <div class="section-header">
            <div class="section-badge">Processus Simple</div>
            <h2>Comment ça fonctionne</h2>
            <p>En quatre étapes simples, transformez la gestion de votre flotte.</p>
          </div>
          <div class="steps-grid">
            <div class="step">
              <div class="step-number">1</div>
              <h3>Connectez</h3>
              <p>Importez vos données ou connectez vos systèmes existants.</p>
            </div>
            <div class="step">
              <div class="step-number">2</div>
              <h3>Analysez</h3>
              <p>L'IA analyse l'état de chaque véhicule et identifie les risques.</p>
            </div>
            <div class="step">
              <div class="step-number">3</div>
              <h3>Anticipez</h3>
              <p>Recevez des alertes intelligentes sur les actions prioritaires.</p>
            </div>
            <div class="step">
              <div class="step-number">4</div>
              <h3>Optimisez</h3>
              <p>Planifiez et prenez les meilleures décisions au bon moment.</p>
            </div>
          </div>
        </div>
      </section>

      <section class="cta-section">
        <div class="container">
          <h2>Prêt à transformer votre flotte ?</h2>
          <button class="btn-cta">Demander une démo</button>
        </div>
      </section>

      <footer class="footer">
        <div class="footer-content">
          <div class="footer-brand">
            <div class="logo">DOTSTO</div>
            <p>La plateforme d'intelligence artificielle qui révolutionne la gestion de flotte automobile.</p>
          </div>
          <div class="footer-links">
            <h4>Produit</h4>
            <a href="#features">Fonctionnalités</a>
            <a href="#">Tarifs</a>
            <a href="#">Démo</a>
          </div>
          <div class="footer-links">
            <h4>Entreprise</h4>
            <a href="#">À propos</a>
            <a href="#">Blog</a>
            <a href="#">Contact</a>
          </div>
          <div class="footer-links">
            <h4>Support</h4>
            <a href="#">Documentation</a>
            <a href="#">Centre d'aide</a>
            <a href="#">API</a>
          </div>
        </div>
        <div class="footer-bottom">© 2026 DOTSTO. Tous droits réservés.</div>
      </footer>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=JetBrains+Mono:wght@700&display=swap');

:root {
  --primary: #00ff88;
  --primary-glow: rgba(0, 255, 136, 0.5);
  --text-primary: #ffffff;
  --text-secondary: #b0b0b0;
  --text-muted: #707070;
}

.page-wrapper {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #000;
  font-family: 'Inter', sans-serif;
  color: var(--text-primary);
}

.hud-corners { position: fixed; inset: 0; pointer-events: none; z-index: 100; }
.hud-corner { position: absolute; width: 60px; height: 60px; opacity: 0.15; }
.hud-corner.tl { top: 24px; left: 24px; border-top: 1px solid #fff; border-left: 1px solid #fff; }
.hud-corner.tr { top: 24px; right: 24px; border-top: 1px solid #fff; border-right: 1px solid #fff; }
.hud-corner.bl { bottom: 24px; left: 24px; border-bottom: 1px solid #fff; border-left: 1px solid #fff; }
.hud-corner.br { bottom: 24px; right: 24px; border-bottom: 1px solid #fff; border-right: 1px solid #fff; }

.three-canvas { position: fixed; inset: 0; z-index: 1; }

.scroll-container {
  position: relative;
  z-index: 10;
  height: 100vh;
  overflow-y: auto;
  scroll-behavior: smooth;
}

.loading-screen {
  position: fixed;
  inset: 0;
  background: radial-gradient(ellipse at center, #0a1a12 0%, #000 70%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
}

.loading-content { text-align: center; }

.loading-icon {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto 32px;
}

.spinner {
  position: absolute;
  inset: 0;
  border: 2px solid transparent;
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner::before {
  content: '';
  position: absolute;
  inset: 6px;
  border: 2px solid transparent;
  border-top-color: rgba(0, 255, 136, 0.5);
  border-radius: 50%;
  animation: spin 1.5s linear infinite reverse;
}

.spinner-glow {
  position: absolute;
  inset: 10px;
  background: radial-gradient(circle, rgba(0, 255, 136, 0.15) 0%, transparent 70%);
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.1); }
}

.loading-logo {
  font-family: 'JetBrains Mono', monospace;
  font-size: 36px;
  font-weight: 700;
  letter-spacing: 6px;
  color: var(--primary);
  text-shadow: 0 0 30px var(--primary-glow), 0 0 60px var(--primary-glow);
  margin-bottom: 40px;
  animation: logoGlow 3s ease-in-out infinite;
}

@keyframes logoGlow {
  0%, 100% { text-shadow: 0 0 20px var(--primary-glow), 0 0 40px var(--primary-glow); }
  50% { text-shadow: 0 0 40px var(--primary-glow), 0 0 80px var(--primary-glow), 0 0 120px var(--primary-glow); }
}

.loading-bar-container {
  width: 280px;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
  margin: 0 auto 20px;
  position: relative;
}

.loading-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), #00ffff, var(--primary));
  background-size: 200% 100%;
  border-radius: 2px;
  transition: width 0.4s ease-out;
  box-shadow: 0 0 15px var(--primary), 0 0 30px var(--primary-glow);
  animation: shimmer 2s linear infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.loading-status {
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.loading-percent {
  color: var(--primary);
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.2rem;
  font-weight: 700;
}

.fade-enter-active, .fade-leave-active { transition: opacity 1s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 48px;
  max-width: 1400px;
  margin: 0 auto;
}

.logo { display: flex; align-items: center; gap: 10px; }
.logo-mark { color: #00ff88; font-size: 1.5rem; text-shadow: 0 0 20px rgba(0, 255, 136, 0.5); }
.logo-text { font-size: 1.3rem; font-weight: 800; letter-spacing: 3px; }

.nav-links { display: flex; gap: 8px; }
.nav-link {
  padding: 10px 20px;
  font-size: 0.95rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  transition: all 0.2s;
  text-decoration: none;
}
.nav-link:hover, .nav-link.active { color: #fff; background: rgba(255, 255, 255, 0.05); }

.btn-nav {
  padding: 10px 24px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  font-size: 0.9rem;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.2s;
  cursor: pointer;
}
.btn-nav:hover { background: rgba(255, 255, 255, 0.05); border-color: rgba(255, 255, 255, 0.3); }

.hero-section { position: relative; height: 100vh; overflow: hidden; }

.hero-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  z-index: 10;
  pointer-events: none;
  padding: 0 60px;
}

.hero-content {
  text-align: left;
  max-width: 550px;
  padding: 40px;
  animation: heroFadeIn 1.5s ease-out;
}

@keyframes heroFadeIn {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.hero-badge {
  display: inline-block;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 30px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-bottom: 24px;
}

h1 {
  font-size: 72px;
  font-weight: 900;
  line-height: 1.05;
  margin-bottom: 24px;
  letter-spacing: -3px;
  text-shadow: 0 0 40px rgba(0, 255, 136, 0.3);
}

h1 .gradient-text {
  background: linear-gradient(135deg, #00ff88 0%, #00ffff 50%, #00ff88 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  background-size: 200% auto;
  animation: gradientShift 3s linear infinite;
}

@keyframes gradientShift {
  0% { background-position: 0% center; }
  100% { background-position: 200% center; }
}

.hero-description {
  font-size: 17px;
  color: var(--text-secondary);
  margin-bottom: 40px;
  line-height: 1.8;
  max-width: 450px;
}

.btn-hero {
  display: inline-block;
  padding: 16px 36px;
  background: #fff;
  color: #000;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.25s ease;
  pointer-events: all;
}
.btn-hero:hover { background: var(--primary); transform: translateY(-2px); }

.scroll-indicator {
  position: absolute;
  bottom: 48px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 200;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  animation: scrollBounce 2s ease-in-out infinite;
}

@keyframes scrollBounce {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(8px); }
}

.scroll-text {
  font-size: 10px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--text-muted);
  font-weight: 500;
}

.scroll-line {
  width: 1px;
  height: 32px;
  background: linear-gradient(to bottom, rgba(255,255,255,0.3), transparent);
  position: relative;
}

.scroll-line::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 6px;
  height: 6px;
  border-left: 1px solid rgba(255,255,255,0.3);
  border-bottom: 1px solid rgba(255,255,255,0.3);
  transform: translateX(-50%) rotate(-45deg);
}

.content-section {
  position: relative;
  z-index: 10;
  min-height: 100vh;
  padding: 150px 60px;
}

.container { max-width: 1400px; margin: 0 auto; }

.section-header {
  text-align: center;
  margin-bottom: 80px;
  animation: fadeInUp 1s ease-out;
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(50px); }
  to { opacity: 1; transform: translateY(0); }
}

.section-badge {
  display: inline-block;
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-bottom: 24px;
}

.section-header h2 {
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 20px;
  letter-spacing: -1px;
  line-height: 1.2;
  color: #fff;
}

.section-header p {
  font-size: 17px;
  color: var(--text-secondary);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.7;
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 700px;
  margin: 0 auto;
}

.feature-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 24px 28px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 24px;
}

.feature-card:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

.feature-icon {
  font-size: 28px;
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.feature-content { flex: 1; }
.feature-card h3 { font-size: 16px; font-weight: 600; margin-bottom: 4px; color: #fff; }
.feature-card p { font-size: 14px; color: var(--text-muted); line-height: 1.6; margin: 0; }

.steps-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-top: 60px;
}

.step {
  text-align: center;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 32px 20px;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.step:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

.step-number {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  margin: 0 auto 20px;
}

.step h3 { font-size: 16px; font-weight: 600; margin-bottom: 10px; color: #fff; }
.step p { font-size: 14px; color: var(--text-muted); line-height: 1.6; }

.cta-section { text-align: center; padding: 100px 60px; }
.cta-section h2 { font-size: 40px; font-weight: 700; margin-bottom: 32px; letter-spacing: -1px; color: #fff; }

.btn-cta {
  display: inline-block;
  padding: 16px 36px;
  background: #fff;
  color: #000;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.25s ease;
}
.btn-cta:hover { background: var(--primary); transform: translateY(-2px); }

.footer {
  padding: 60px 60px 40px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(0, 0, 0, 0.5);
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 60px;
  margin-bottom: 48px;
}

.footer-brand .logo { margin-bottom: 16px; }
.footer-brand p { color: var(--text-muted); line-height: 1.7; font-size: 14px; }

.footer-links h4 {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 20px;
  color: var(--text-secondary);
}

.footer-links a {
  display: block;
  color: var(--text-muted);
  text-decoration: none;
  margin-bottom: 12px;
  font-size: 14px;
  transition: color 0.2s;
}
.footer-links a:hover { color: #fff; }

.footer-bottom {
  max-width: 1200px;
  margin: 0 auto;
  padding-top: 32px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
}

@media (max-width: 1024px) {
  h1 { font-size: 48px; }
  .section-header h2 { font-size: 36px; }
  .cta-section h2 { font-size: 32px; }
  .steps-grid { grid-template-columns: repeat(2, 1fr); }
  .footer-content { grid-template-columns: 1fr; text-align: center; }
  .hero-overlay { padding: 0 32px; }
  .hero-content { max-width: 450px; }
  .content-section { padding: 80px 32px; }
}

@media (max-width: 768px) {
  .nav { padding: 16px 24px; }
  .nav-links { display: none; }
  h1 { font-size: 36px; }
  .section-header h2 { font-size: 28px; }
  .section-header { margin-bottom: 40px; }
  .cta-section h2 { font-size: 28px; }
  .cta-section { padding: 60px 20px; }
  .hero-description { font-size: 15px; }
  .steps-grid { grid-template-columns: 1fr 1fr; gap: 12px; }
  .step { padding: 20px 16px; }
  .step-number { width: 40px; height: 40px; font-size: 16px; margin-bottom: 12px; }
  .content-section { padding: 60px 20px; }
  .footer { padding: 40px 20px 24px; }
  .hero-overlay { padding: 0 20px; align-items: center; }
  .hero-content { padding: 0; text-align: center; max-width: 100%; }
  .feature-card { flex-direction: column; text-align: center; padding: 20px; gap: 12px; }
  .feature-content { text-align: center; }
  .hud-corner { width: 40px; height: 40px; }
  .hud-corner.tl, .hud-corner.tr { top: 12px; }
  .hud-corner.bl, .hud-corner.br { bottom: 12px; }
  .hud-corner.tl, .hud-corner.bl { left: 12px; }
  .hud-corner.tr, .hud-corner.br { right: 12px; }
}
</style>
