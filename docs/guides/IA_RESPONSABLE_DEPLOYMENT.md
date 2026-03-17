# 🚀 Deployment Guide - IA Responsable

## Pre-Deployment Checklist

### 🔍 Code Quality (15 minutos)
- [ ] Cero errores en `npm run lint`
  ```bash
  npm run lint
  # Si hay errores: npm run lint --fix
  ```

- [ ] Build exitoso
  ```bash
  npm run build
  # Debe completar sin advertencias críticas
  ```

- [ ] No hay `console.log()` de debug en producción
  ```bash
  grep -r "console\.log" frontend/src/components/ai/
  # Si hay alguno, remover
  ```

- [ ] CSS variables definidas en root
  ```css
  /* En tu CSS global */
  :root {
    --bg: #ffffff;
    --surface: #f5f5f5;
    --text: #000000;
    --text-muted: #666666;
    --border: #e0e0e0;
    --surface-soft: rgba(0, 0, 0, 0.02);
  }
  ```

### 🧪 Testing Completo (30 minutos)
- [ ] Seguir `IA_RESPONSABLE_CHECKLIST.md` completamente
- [ ] Testear en 3 navegadores:
  - [ ] Chrome
  - [ ] Firefox
  - [ ] Safari (si es posible)
- [ ] Testear en 3 dispositivos:
  - [ ] Mobile (390px)
  - [ ] Tablet (768px)
  - [ ] Desktop (1920px)

### 📱 Performance (10 minutos)
- [ ] Lighthouse score >80
  ```bash
  npm run build
  # Sube el build a lighthouse.dev
  # Verifica score
  ```

- [ ] No hay memory leaks en components
  - [ ] Abre DevTools
  - [ ] Pestaña Performance
  - [ ] Navega entre `/ai-model-cards` y `/ai-responsable-example`
  - [ ] Memoria debe estabilizarse

### 🔐 Security (5 minutos)
- [ ] No hay secrets/tokens en código
  ```bash
  grep -r "api_key\|secret\|password" frontend/src/
  # Si encontró algo → remover
  ```

- [ ] URLs no están hard-coded
  - [ ] `/ai-model-cards` ✅ OK (ruta relativa)
  - [ ] `mailto:ia-responsable@azca.es` ✅ OK (contact)

---

## Deployment Steps

### 🟢 STAGE 1: Staging Deployment (1 hora)

#### A. Build
```bash
cd frontend
npm run build
# Genera: dist/

# Verifica tamaño
du -sh dist/
# Debe ser <10MB (o tu límite)
```

#### B. Deploy a Staging
```bash
# Opción 1: Vercel
vercel deploy --prod --target staging

# Opción 2: GitHub Pages (si es static)
npm run build
gh-pages -d dist

# Opción 3: Manual (tu servidor)
scp -r dist/* user@staging.example.com:/var/app/
```

#### C. Verificación en Staging
1. Navega a: `https://staging.example.com/ai-model-cards`
   - [ ] Carga sin errores
   - [ ] Styling correcto
   - [ ] Links funcionan

2. Navega a: `https://staging.example.com/ai-responsable-example`
   - [ ] Carga sin errores
   - [ ] Todos los componentes visibles
   - [ ] Ejemplos funcionan

3. Navega a Dashboard
   - [ ] Componentes de IA visibles
   - [ ] Responsive OK
   - [ ] Sin errores en console

#### D. Smoke Test Checklist
- [ ] `/ai-model-cards` carga
- [ ] `/ai-responsable-example` carga
- [ ] Dashboard con IA componentes funciona
- [ ] Mobile responsive OK
- [ ] FAQs expandibles funcionan
- [ ] Links internos funcionan
- [ ] Email link funciona

---

### 🟡 STAGE 2: Pre-Production Review (2 horas)

#### A. Team Review
- [ ] Product Manager: Approves copy & messaging
- [ ] Design: Approves visuals & responsive
- [ ] Security: Reviews for vulnerabilities
- [ ] Legal: Confirms compliance (GDPR, etc.)

#### B. Analytics Setup (Opcional pero recomendado)
```typescript
// En AIModelCardsPage.tsx
useEffect(() => {
  gtag.pageview({
    page_path: '/ai-model-cards',
    page_title: 'AI Model Cards'
  })
}, [])

// En ButtonClick handlers
const handleLearnMore = () => {
  gtag.event('learn_more_ai_responsible')
  navigate('/ai-responsable-example')
}
```

#### C. Error Tracking Setup
```typescript
// Sentry o similar
Sentry.captureException(error, {
  tags: {
    component: 'AITransparencyCard',
    page: 'AIModelCardsPage'
  }
})
```

#### D. Monitoring Alerts
- [ ] Alert si `/ai-model-cards` returns 500
- [ ] Alert si load time > 3 segundos
- [ ] Alert si JavaScript error rate > 1%

---

### 🔴 STAGE 3: Production Deployment

#### A. Final Checks
```bash
# Última verificación de build
npm run build
# ✅ Sin warnings críticos

# Verifica imports están correctos
npm run lint
# ✅ Sin errores

# Quick smoke test local
npm run preview
# ✅ Abre http://localhost:4173
# - Navega /ai-model-cards
# - Navega /ai-responsable-example
# - Test responsive
```

#### B. Deployment Command
```bash
# Opción 1: GitHub Actions (recomendado)
git add .
git commit -m "feat: IA Responsable - Production Deployment"
git push origin main
# GitHub Actions ejecuta: npm run build && deploy a vercel/netlify

# Option 2: Manual Deployment
npm run build
# Copia dist/ a production server
# Reinicia el servidor web

# Option 3: Docker
docker build -t azca-frontend:latest .
docker push azca-frontend:latest
# Tu cluster K8s/Docker Compose redeploy
```

#### C. Verification
```bash
# 1. Check en producción
curl https://example.com/ai-model-cards
# Debe retornar HTML (210KB aprox)

# 2. Check en navegador
https://example.com/ai-model-cards
# Debe cargar sin errores

# 3. Monitor logs
tail -f /var/log/nginx/access.log | grep ai-model-cards
# Debe ver requests

# 4. Monitor errors
# Sentry dashboard: ¿Cero errores?
# CloudWatch: ¿Performance OK?
```

---

## Post-Deployment (30 minutos)

### 📧 Comunicación a Usuarios

**Email Template**:
```
Subject: 🤖 AZCA implementa IA Responsable - Acceso a documentación

Querido Usuario AZCA,

Nos complace anunciar que implementamos estándares de IA Responsable.

🎯 Qué significa para ti:
✅ Transparencia: Sabes exactamente qué datos usa nuestro IA
✅ Privacidad: Nunca datos personales, solo agregados anónimos  
✅ Honestidad: Documentamos limitaciones y cuándo puede fallar
✅ Mejora continua: Reentrenamos modelos mensualmente

📖 Nuevo en el app:

1. Model Cards públicas: /ai-model-cards
   → Lee cómo funcionan nuestros modelos
   → Entiende qué datos usamos
   → Descubre limitaciones

2. Ejemplo práctico: /ai-responsable-example
   → Ve cómo se ve una predicción real
   → Entiende nivel de confianza
   → Aprende a usarla correctamente

3. En tu Dashboard:
   → Cada predicción ahora muestra:
     • Nivel de confianza (🟢 alto / 🟡 medio / 🔴 bajo)  
     • Qué datos se usaron
     • Cuándo puede fallar

💡 Recomendación:
Usa las predicciones como GUÍA, no como VERDAD ABSOLUTA.
Combina con tu experiencia. Si algo parece raro, confía en tu instinto.

❓ Preguntas?
📧 ia-responsable@azca.es

Saludos,
Equipo AZCA 🤖
```

**Distribución**:
- [ ] Email a todos los usuarios activos
- [ ] Publicar en blog/blog post
- [ ] Anunciar en social media
- [ ] Update en landing page
- [ ] Incluir en onboarding new users

### 📊 Tracking Inicial

Primeras 24 horas, monitorea:
- [ ] `/ai-model-cards` pageviews
- [ ] `/ai-responsable-example` pageviews
- [ ] Dashboard component renders
- [ ] Error rate (debe ser ~0%)
- [ ] Performance metrics

---

## Rollback Plan

Si algo falla crítico:

### Inmediato (Primeros 5 minutos)
```bash
# OPCIÓN 1: Revert código
git revert <commit-sha>
git push origin main
# GitHub Actions redeploya versión anterior

# OPCIÓN 2: Redirect en nginx
# En /etc/nginx/nginx.conf
location /ai-model-cards {
  rewrite ^ https://old.example.com/doc permanent;
}
```

### Comunicación
```
🚨 INCIDENTE: IA Responsable temporalmente unavailable
Estamos investigando. Disculpa las molestias.
ETA: 15 minutos
```

### Investigación Post-Mortum
- [ ] ¿Qué falló exactamente?
- [ ] ¿Por qué no se detectó en staging?
- [ ] ¿Cómo prevenir en futuro?
- [ ] Documenta en `INCIDENTS.md`

---

## Monitoring Post-Deploy

### 🟢 Métricas Saludables

```
✅ Page Load Time
   Target: <2s (p95)
   Actual: [check Lighthouse]

✅ Error Rate
   Target: <0.1%
   Monitor: Sentry

✅ Pageviews
   Esperado: 10-100/día de `ai-model-cards`
   Monitor: Google Analytics

✅ User Engagement  
   Esperado: 30% view `ai-model-cards` → click `ai-responsable-example`
   Monitor: GA funnels

✅ Mobile Performance
   Target: Lighthouse >80 en mobile
   Monitor: Chrome UX Report
```

### 🔴 Alertas Críticas

Configura alertas para:
```
// Sentry
- JS Error Rate > 1%
- New error introduced

// CloudWatch
- API latency > 3s
- 5xx errors > 10/min

// Uptime
- /ai-model-cards returns != 200

// Performance
- Largest Contentful Paint > 2.5s
```

---

## Documentación de Deployment

Después del deploy, crea documento:

```markdown
# Deployment Log - IA Responsable v1.0

## Deploy Date
2026-03-15 14:30 UTC

## Deployed By
[Tu nombre]

## Build Info
- Commit: abc123def456
- Build time: 2m 30s
- Build size: 245KB gzipped

## Staging Tests
- ✅ All routes load
- ✅ Components render
- ✅ Mobile responsive
- ✅ No JS errors

## Production Verification
- ✅ Deployed to CloudFront
- ✅ Cache cleared
- ✅ Verified on 3 browsers
- ✅ Performance: 85 Lighthouse

## Monitoring
- Sentry: Connected
- GA: Tracking active
- Alerts: Configured
- Rollback plan: Ready

## Known Issues
None at deploy time

## Next Steps
- Monitor 24h for errors
- Collect user feedback
- Plan v1.1 improvements
```

---

## Success Criteria

El deploy es exitoso si después de 24h:

- ✅ Cero JS errors críticos en production
- ✅ Page load <2s (p95)
- ✅ /ai-model-cards recibió >50 pageviews
- ✅ Nadie reportó problemas
- ✅ Monitoring alerts no dispararon falsos positivos
- ✅ Email campaign entregado sin bounces

---

## Roadmap Post-Deploy

### Semana 1
- [ ] Monitorear métricas
- [ ] Responder preguntas usuarios
- [ ] Fix bugs menores (si hay)

### Semana 2
- [ ] Análisis de adopción
- [ ] Recolectar feedback
- [ ] Planificar v1.1

### Mes 1
- [ ] Conectar datos reales (si aún simulado)
- [ ] Integrar analytics completo
- [ ] Agregar idiomas (EN, PT)

### Trimestre 1
- [ ] Auditoría externa de sesgo
- [ ] Certificación ISO draft
- [ ] Modelo 3 (nuevo)

---

**Deployment Guide versión**: 1.0  
**Preparado**: Marzo 2026  
**Status**: ✅ Listo para deploy  
**Soporte**: ia-responsable@azca.es
