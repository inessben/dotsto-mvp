export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  dir: {
    pages: 'views/pages',
    assets: 'views/assets'
  },

  css: ['~/views/assets/css/main.css'],

  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      title: 'DOTSTO - Gestion de Flotte Intelligente | IA Prédictive',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'DOTSTO révolutionne la gestion de flotte automobile avec l\'IA prédictive. Anticipez les pannes, optimisez les coûts et gérez contrôles techniques, assurances et entretiens.' },
        { name: 'keywords', content: 'gestion de flotte, flotte automobile, IA prédictive, contrôle technique, entretien véhicule, fleet management, TCO' },
        { name: 'author', content: 'DOTSTO' },
        { name: 'robots', content: 'index, follow' },
        { name: 'theme-color', content: '#00ff88' },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://dotsto.fr/' },
        { property: 'og:title', content: 'DOTSTO - Gestion de Flotte Intelligente' },
        { property: 'og:description', content: 'Anticipez les pannes, optimisez les coûts et centralisez la gestion de tous vos véhicules avec notre plateforme d\'IA prédictive.' },
        { property: 'og:image', content: 'https://dotsto.fr/og-image.jpg' },
        { property: 'og:locale', content: 'fr_FR' },
        { property: 'og:site_name', content: 'DOTSTO' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'DOTSTO - Gestion de Flotte Intelligente' },
        { name: 'twitter:description', content: 'Anticipez les pannes, optimisez les coûts avec notre plateforme d\'IA prédictive.' },
        { name: 'twitter:image', content: 'https://dotsto.fr/og-image.jpg' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'canonical', href: 'https://dotsto.fr/' }
      ]
    }
  }
})
