# Code Citations

## License: MIT
https://github.com/le0pard/pgtune/blob/422848fc5d2d0eff61a66a59b48668659a0a2829/vite.config.js

```
Yes, **PWA (Progressive Web App) is perfect** for this!

## What PWA gives you

- **Mobile-like experience** on both iOS and Android
- **Install as app** (home screen icon, no app store needed)
- **Offline support** (works without internet)
- **Push notifications**
- **Single codebase** (same React app for web and "mobile")
- **Responsive design** (already have Tailwind)

---

## How to add PWA to your React + Vite app

### Step 1: Install PWA plugin for Vite

```powershell
cd medbridge-ai
npm install vite-plugin-pwa
```

### Step 2: Update `vite.config.js`

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'MedBridge AI',
        short_name: 'MedBridge',
        description: 'AI-powered medical diagnosis and recommendations',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/localhost:8000\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          }
        ]
      }
    })
  ]
})
```

### Step 3: Create
```


## License: MIT
https://github.com/le0pard/pgtune/blob/422848fc5d2d0eff61a66a59b48668659a0a2829/vite.config.js

```
Yes, **PWA (Progressive Web App) is perfect** for this!

## What PWA gives you

- **Mobile-like experience** on both iOS and Android
- **Install as app** (home screen icon, no app store needed)
- **Offline support** (works without internet)
- **Push notifications**
- **Single codebase** (same React app for web and "mobile")
- **Responsive design** (already have Tailwind)

---

## How to add PWA to your React + Vite app

### Step 1: Install PWA plugin for Vite

```powershell
cd medbridge-ai
npm install vite-plugin-pwa
```

### Step 2: Update `vite.config.js`

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'MedBridge AI',
        short_name: 'MedBridge',
        description: 'AI-powered medical diagnosis and recommendations',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/localhost:8000\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          }
        ]
      }
    })
  ]
})
```

### Step 3: Create
```


## License: MIT
https://github.com/le0pard/pgtune/blob/422848fc5d2d0eff61a66a59b48668659a0a2829/vite.config.js

```
Yes, **PWA (Progressive Web App) is perfect** for this!

## What PWA gives you

- **Mobile-like experience** on both iOS and Android
- **Install as app** (home screen icon, no app store needed)
- **Offline support** (works without internet)
- **Push notifications**
- **Single codebase** (same React app for web and "mobile")
- **Responsive design** (already have Tailwind)

---

## How to add PWA to your React + Vite app

### Step 1: Install PWA plugin for Vite

```powershell
cd medbridge-ai
npm install vite-plugin-pwa
```

### Step 2: Update `vite.config.js`

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'MedBridge AI',
        short_name: 'MedBridge',
        description: 'AI-powered medical diagnosis and recommendations',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/localhost:8000\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          }
        ]
      }
    })
  ]
})
```

### Step 3: Create
```


## License: MIT
https://github.com/le0pard/pgtune/blob/422848fc5d2d0eff61a66a59b48668659a0a2829/vite.config.js

```
Yes, **PWA (Progressive Web App) is perfect** for this!

## What PWA gives you

- **Mobile-like experience** on both iOS and Android
- **Install as app** (home screen icon, no app store needed)
- **Offline support** (works without internet)
- **Push notifications**
- **Single codebase** (same React app for web and "mobile")
- **Responsive design** (already have Tailwind)

---

## How to add PWA to your React + Vite app

### Step 1: Install PWA plugin for Vite

```powershell
cd medbridge-ai
npm install vite-plugin-pwa
```

### Step 2: Update `vite.config.js`

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'MedBridge AI',
        short_name: 'MedBridge',
        description: 'AI-powered medical diagnosis and recommendations',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/localhost:8000\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          }
        ]
      }
    })
  ]
})
```

### Step 3: Create
```


## License: MIT
https://github.com/le0pard/pgtune/blob/422848fc5d2d0eff61a66a59b48668659a0a2829/vite.config.js

```
Yes, **PWA (Progressive Web App) is perfect** for this!

## What PWA gives you

- **Mobile-like experience** on both iOS and Android
- **Install as app** (home screen icon, no app store needed)
- **Offline support** (works without internet)
- **Push notifications**
- **Single codebase** (same React app for web and "mobile")
- **Responsive design** (already have Tailwind)

---

## How to add PWA to your React + Vite app

### Step 1: Install PWA plugin for Vite

```powershell
cd medbridge-ai
npm install vite-plugin-pwa
```

### Step 2: Update `vite.config.js`

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'MedBridge AI',
        short_name: 'MedBridge',
        description: 'AI-powered medical diagnosis and recommendations',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/localhost:8000\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          }
        ]
      }
    })
  ]
})
```

### Step 3: Create
```


## License: unknown
https://github.com/damian/blog/blob/e4f2a8a296bfbcb44e204bee6d22ef291237e328/content/posts/2019-02-22-html5-submit-form-using-button-outside.md

```
Yes, **PWA (Progressive Web App) is perfect** for this!

## What PWA gives you

- **Mobile-like experience** on both iOS and Android
- **Install as app** (home screen icon, no app store needed)
- **Offline support** (works without internet)
- **Push notifications**
- **Single codebase** (same React app for web and "mobile")
- **Responsive design** (already have Tailwind)

---

## How to add PWA to your React + Vite app

### Step 1: Install PWA plugin for Vite

```powershell
cd medbridge-ai
npm install vite-plugin-pwa
```

### Step 2: Update `vite.config.js`

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'MedBridge AI',
        short_name: 'MedBridge',
        description: 'AI-powered medical diagnosis and recommendations',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/localhost:8000\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          }
        ]
      }
    })
  ]
})
```

### Step 3: Create app icons

Place in `medbridge-ai/public/`:
- `icon-192x192.png` (192×192 pixels)
- `icon-512x512.png` (512×512 pixels)

### Step 4: Update `index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#ffffff" />
    <meta name="description" content="AI-powered medical diagnosis system" />
    
    <link rel="manifest" href="/manifest.json" />
    <link rel="icon" href="/icon-192x192.png" />
    <link rel="apple-touch-icon" href="/icon-192x192.png" />
    
    <title>MedBridge AI</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### Step 5: Register Service Worker in `main.jsx`

```javascript
import { registerSW } from 'virtual:pwa-register'

// Register service worker
if ('serviceWorker' in navigator) {
  registerSW({ immediate: true })
}

// Rest of your React app
React
```


## License: MIT
https://github.com/ReactTooltip/react-tooltip/blob/613e0e07921764f496ab3e8052384ad6c3c43bb7/public/index.html

```
Yes, **PWA (Progressive Web App) is perfect** for this!

## What PWA gives you

- **Mobile-like experience** on both iOS and Android
- **Install as app** (home screen icon, no app store needed)
- **Offline support** (works without internet)
- **Push notifications**
- **Single codebase** (same React app for web and "mobile")
- **Responsive design** (already have Tailwind)

---

## How to add PWA to your React + Vite app

### Step 1: Install PWA plugin for Vite

```powershell
cd medbridge-ai
npm install vite-plugin-pwa
```

### Step 2: Update `vite.config.js`

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'MedBridge AI',
        short_name: 'MedBridge',
        description: 'AI-powered medical diagnosis and recommendations',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/localhost:8000\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          }
        ]
      }
    })
  ]
})
```

### Step 3: Create app icons

Place in `medbridge-ai/public/`:
- `icon-192x192.png` (192×192 pixels)
- `icon-512x512.png` (512×512 pixels)

### Step 4: Update `index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#ffffff" />
    <meta name="description" content="AI-powered medical diagnosis system" />
    
    <link rel="manifest" href="/manifest.json" />
    <link rel="icon" href="/icon-192x192.png" />
    <link rel="apple-touch-icon" href="/icon-192x192.png" />
    
    <title>MedBridge AI</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### Step 5: Register Service Worker in `main.jsx`

```javascript
import { registerSW } from 'virtual:pwa-register'

// Register service worker
if ('serviceWorker' in navigator) {
  registerSW({ immediate: true })
}

// Rest of your React app
React
```


## License: unknown
https://github.com/suvigyavijay/suvigyavijay.github.io/blob/91004eb97ecdbd387d652ac8c06cbdd462b1ef19/index.html

```
Yes, **PWA (Progressive Web App) is perfect** for this!

## What PWA gives you

- **Mobile-like experience** on both iOS and Android
- **Install as app** (home screen icon, no app store needed)
- **Offline support** (works without internet)
- **Push notifications**
- **Single codebase** (same React app for web and "mobile")
- **Responsive design** (already have Tailwind)

---

## How to add PWA to your React + Vite app

### Step 1: Install PWA plugin for Vite

```powershell
cd medbridge-ai
npm install vite-plugin-pwa
```

### Step 2: Update `vite.config.js`

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'MedBridge AI',
        short_name: 'MedBridge',
        description: 'AI-powered medical diagnosis and recommendations',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/localhost:8000\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          }
        ]
      }
    })
  ]
})
```

### Step 3: Create app icons

Place in `medbridge-ai/public/`:
- `icon-192x192.png` (192×192 pixels)
- `icon-512x512.png` (512×512 pixels)

### Step 4: Update `index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#ffffff" />
    <meta name="description" content="AI-powered medical diagnosis system" />
    
    <link rel="manifest" href="/manifest.json" />
    <link rel="icon" href="/icon-192x192.png" />
    <link rel="apple-touch-icon" href="/icon-192x192.png" />
    
    <title>MedBridge AI</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### Step 5: Register Service Worker in `main.jsx`

```javascript
import { registerSW } from 'virtual:pwa-register'

// Register service worker
if ('serviceWorker' in navigator) {
  registerSW({ immediate: true })
}

// Rest of your React app
React
```


## License: unknown
https://github.com/damian/blog/blob/e4f2a8a296bfbcb44e204bee6d22ef291237e328/content/posts/2019-02-22-html5-submit-form-using-button-outside.md

```
Yes, **PWA (Progressive Web App) is perfect** for this!

## What PWA gives you

- **Mobile-like experience** on both iOS and Android
- **Install as app** (home screen icon, no app store needed)
- **Offline support** (works without internet)
- **Push notifications**
- **Single codebase** (same React app for web and "mobile")
- **Responsive design** (already have Tailwind)

---

## How to add PWA to your React + Vite app

### Step 1: Install PWA plugin for Vite

```powershell
cd medbridge-ai
npm install vite-plugin-pwa
```

### Step 2: Update `vite.config.js`

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'MedBridge AI',
        short_name: 'MedBridge',
        description: 'AI-powered medical diagnosis and recommendations',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/localhost:8000\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          }
        ]
      }
    })
  ]
})
```

### Step 3: Create app icons

Place in `medbridge-ai/public/`:
- `icon-192x192.png` (192×192 pixels)
- `icon-512x512.png` (512×512 pixels)

### Step 4: Update `index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#ffffff" />
    <meta name="description" content="AI-powered medical diagnosis system" />
    
    <link rel="manifest" href="/manifest.json" />
    <link rel="icon" href="/icon-192x192.png" />
    <link rel="apple-touch-icon" href="/icon-192x192.png" />
    
    <title>MedBridge AI</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### Step 5: Register Service Worker in `main.jsx`

```javascript
import { registerSW } from 'virtual:pwa-register'

// Register service worker
if ('serviceWorker' in navigator) {
  registerSW({ immediate: true })
}

// Rest of your React app
React
```


## License: MIT
https://github.com/ReactTooltip/react-tooltip/blob/613e0e07921764f496ab3e8052384ad6c3c43bb7/public/index.html

```
Yes, **PWA (Progressive Web App) is perfect** for this!

## What PWA gives you

- **Mobile-like experience** on both iOS and Android
- **Install as app** (home screen icon, no app store needed)
- **Offline support** (works without internet)
- **Push notifications**
- **Single codebase** (same React app for web and "mobile")
- **Responsive design** (already have Tailwind)

---

## How to add PWA to your React + Vite app

### Step 1: Install PWA plugin for Vite

```powershell
cd medbridge-ai
npm install vite-plugin-pwa
```

### Step 2: Update `vite.config.js`

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'MedBridge AI',
        short_name: 'MedBridge',
        description: 'AI-powered medical diagnosis and recommendations',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/localhost:8000\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          }
        ]
      }
    })
  ]
})
```

### Step 3: Create app icons

Place in `medbridge-ai/public/`:
- `icon-192x192.png` (192×192 pixels)
- `icon-512x512.png` (512×512 pixels)

### Step 4: Update `index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#ffffff" />
    <meta name="description" content="AI-powered medical diagnosis system" />
    
    <link rel="manifest" href="/manifest.json" />
    <link rel="icon" href="/icon-192x192.png" />
    <link rel="apple-touch-icon" href="/icon-192x192.png" />
    
    <title>MedBridge AI</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### Step 5: Register Service Worker in `main.jsx`

```javascript
import { registerSW } from 'virtual:pwa-register'

// Register service worker
if ('serviceWorker' in navigator) {
  registerSW({ immediate: true })
}

// Rest of your React app
React
```


## License: unknown
https://github.com/suvigyavijay/suvigyavijay.github.io/blob/91004eb97ecdbd387d652ac8c06cbdd462b1ef19/index.html

```
Yes, **PWA (Progressive Web App) is perfect** for this!

## What PWA gives you

- **Mobile-like experience** on both iOS and Android
- **Install as app** (home screen icon, no app store needed)
- **Offline support** (works without internet)
- **Push notifications**
- **Single codebase** (same React app for web and "mobile")
- **Responsive design** (already have Tailwind)

---

## How to add PWA to your React + Vite app

### Step 1: Install PWA plugin for Vite

```powershell
cd medbridge-ai
npm install vite-plugin-pwa
```

### Step 2: Update `vite.config.js`

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'MedBridge AI',
        short_name: 'MedBridge',
        description: 'AI-powered medical diagnosis and recommendations',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/localhost:8000\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          }
        ]
      }
    })
  ]
})
```

### Step 3: Create app icons

Place in `medbridge-ai/public/`:
- `icon-192x192.png` (192×192 pixels)
- `icon-512x512.png` (512×512 pixels)

### Step 4: Update `index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#ffffff" />
    <meta name="description" content="AI-powered medical diagnosis system" />
    
    <link rel="manifest" href="/manifest.json" />
    <link rel="icon" href="/icon-192x192.png" />
    <link rel="apple-touch-icon" href="/icon-192x192.png" />
    
    <title>MedBridge AI</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### Step 5: Register Service Worker in `main.jsx`

```javascript
import { registerSW } from 'virtual:pwa-register'

// Register service worker
if ('serviceWorker' in navigator) {
  registerSW({ immediate: true })
}

// Rest of your React app
React
```

