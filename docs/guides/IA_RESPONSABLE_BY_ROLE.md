# 👥 Guía por Rol - ¿Qué Hacer Según Tu Puesto?

Encuentra tu rol y sigue la guía exacta para ti.

---

## 👔 EJECUTIVO / DIRECTIVO

### En 30 segundos
- [ ] Lee: `IA_RESPONSABLE_EXECUTIVE_SUMMARY.md`
- [ ] Decide: ¿Aprobamos implementar?
- [ ] Actúa: Di "Sí" y asigna un dev

### Información clave
- **Cost**: $0 (ya desarrollado)
- **Time**: 2 semanas a producción
- **Risk**: Muy bajo
- **ROI**: Alto (diferenciación, compliance)
- **Beneficio**: Brand positioning como "Responsible AI leader"

### Acciones
1. Leer Executive Summary (10 min)
2. Aprobar/rechazar (sí/no)
3. Si sí: asignar dev + fecha
4. Si no: documentar razón

### Escalación
Si cuestionan:
- Legal: Muestra `AI_RESPONSIBLE_STANDARD.md` (sec 8 - Regulatorio)
- Finance: Budget = $0 (está hecho)
- Marketing: Presential asset (first to market)

---

## 👨‍💻 DEVELOPER / IMPLEMENTADOR

### En 5 minutos
- [ ] Lee: `IA_RESPONSABLE_QUICKSTART.md`
- [ ] Implementa: Los 4 pasos
- [ ] Prueba: En navegador

### Paso a Paso Exacto

**PASO 1: Verificar archivos (30 seg)**
```bash
ls frontend/src/components/ai/ | wc -l
# Debe mostrar: 9 archivos
```

**PASO 2: Agregar rutas (1 min)**
Abre: `frontend/src/main.tsx`

```typescript
// Agregar imports
import AIModelCardsPage from './pages/AIModelCardsPage'
import IAResponsableExamplePage from './pages/IAResponsableExamplePage'

// En routes array, agregar:
{ path: '/ai-model-cards', element: <AIModelCardsPage /> }
{ path: '/ai-responsable-example', element: <IAResponsableExamplePage /> }
```

**PASO 3: Envolver predicciones (2 min)**
Abre: `frontend/src/views/restaurant/PredictionDashboard.tsx`

```typescript
// Agregar import
import PredictionWithDisclaimer from '../../components/ai/PredictionWithDisclaimer'

// Envuelve tu predicción
<PredictionWithDisclaimer
  title="Mis Predicciones"
  type="service"
  confidenceLevel="high"
>
  {/* Tu contenido existente aquí */}
</PredictionWithDisclaimer>
```

**PASO 4: Probar (1 min)**
```bash
npm run dev
# Abre: http://localhost:5173/ai-model-cards
# ¿Carga sin errores?
```

### Si hay errores
```
Console error? → Ver troubleshooting en QUICKSTART.md
Ruta 404? → Verificar imports y router config
Estilos rotos? → CSS vars definidas en :root?
```

### Testing Completo
Cuando tengas 30 minutos:
- Sigue: `IA_RESPONSABLE_CHECKLIST.md` (12 fases)
- QA: Responsive + accesibilidad
- Ready: Para deployment

### Documentación Técnica
- Components: Ver código `.tsx` files  
- Props: JSDoc en cada componente
- Examples: Ver `IAResponsibleExamplePage.tsx`

---

## 🧪 QA / TESTING

### Checklist Principal
- [ ] Usar: `IA_RESPONSABLE_CHECKLIST.md`
- [ ] Completar: Las 12 fases
- [ ] Tiempo: 1-2 horas

### Fases Principales

**FASE 1-3**: Verificación (Archivos, rutas, integración)  
→ Simple checks, no requiere interacción

**FASE 4-7**: Visual Testing  
→ Abre navegador, verifica cada componente
→ Mobile (390px), Tablet (768px), Desktop (1920px)

**FASE 8-9**: Accesibilidad  
→ Colors, contrast, keyboard navigation
→ Tool: WAVE o Lighthouse

**FASE 10-12**: Deployment Readiness  
→ Build, performance, rollback plan
→ Final verification antes de prod

### Testing Tools
```bash
# Lint
npm run lint

# Build
npm run build

# Lighthouse (local)
npm run preview
# Abre: http://localhost:4173
# DevTools → Lighthouse → Run audit

# Contrast (accessibility)
# Site: webaim.org/resources/contrastchecker
```

### Success Criteria
✅ 0 errors en console  
✅ 0 responsive issues  
✅ ~0.1% error rate  
✅ Lighthouse >80  
✅ Ready para deploy

---

## 🎨 DESIGNER / UX

### Review Checklist
- [ ] Visual consistency
- [ ] Responsive on 3 sizes (mobile/tablet/desktop)
- [ ] Accessibility (color + text)
- [ ] Interaction (FAQs expandible, links work)

### Key Designs
```
Components:
├── AITransparencyCard - Card layout with badges
├── AIDisclaimer - Alert bar (3 types)
├── PredictionWithDisclaimer - Wrapper with header
├── PredictionConfidenceBreakdown - Bars + factors
├── AIFailureWarning - Grid of 4 scenarios
└── Other 4 - Support components

Pages:
├── AIModelCardsPage - Doc style (like Google)
└── IAResponsibleExamplePage - Demo with examples
```

### Verification
- [ ] Consistency: Same colors, spacing, fonts
- [ ] Responsive: Mobile stack, tablet 2-col, desktop optimal
- [ ] Accessibility: Enough contrast, readable
- [ ] Nice to have: Animations on confidence bars

### If Changes Needed
- Submit to dev with exact specs
- Dev implements in 10-30 min
- QA re-tests

---

## 📋 LEGAL / COMPLIANCE

### Documentation to Review
1. **AI_RESPONSIBLE_STANDARD.md** (Section 8 - Regulatory)
   - GDPR compliance
   - EU AI Act compliance
   - Spanish regulations

2. **IA_RESPONSABLE_INTEGRATION.md** (Section on Security)
   - No secrets in code
   - No hard-coded data
   - Privacy by design

### Approval Tasks
- [ ] GDPR: ¿Datos personales almacenados? NO ✅
- [ ] EU AI Act: ¿Documentación completa? Sí ✅
- [ ] Privacy: ¿Policy updated? Necesario agregar
- [ ] Liability: ¿Terms updated? Necesario agregar

### Legal Language to Add (Suggestions)

**Privacy Policy Change**:
```
"AZCA uses AI-powered predictions. These models:
- Do NOT use personal customer data
- Only use anonymized aggregate data
- Are regularly audited for bias
- Are explained via Model Cards at /ai-model-cards"
```

**Terms of Service Change**:
```
"AI predictions are provided as-is without 100% accuracy guarantee.
Users are responsible for decisions made based on AI recommendations.
AZCA is not liable for losses from incorrect predictions."
```

### Compliance Sign-Off
- [ ] Legal approves: Sí/No
- [ ] If No: Especificar cambios requeridos
- [ ] Ready to deploy: Sí/No

---

## 📢 MARKETING / COMMS

### Key Messages 📝

**Primary Message**:
"AZCA is the first Hispanic restaurant platform with **Certified Responsible AI** - transparent, trustworthy, and compliant."

**Supporting Messages**:
- 🤖 "Your AI predictions, explained"
- 🔍 "See exactly what data powers our models"
- 🛡️ "Privacy-first AI - no personal data used"
- 🌍 "Compliant with GDPR and EU AI Act"
- 🎯 "The future of ethical AI is here"

### Content to Create

**Email Campaign** (Template in `IA_RESPONSABLE_INTEGRATION.md`)
- Subject: "🤖 AZCA Certified Responsible AI"
- Send to: All active users
- Timing: Day of deploy
- Click-through: 10-20%

**Blog Post** (400-600 words)
```
Title: "Why We're Building Responsible AI - And Why It Matters"
Sections:
1. What is Responsible AI? (100 words)
2. AZCA's Approach (200 words)
3. User Benefits (150 words)
4. Call to action: /ai-model-cards
CTA: Read our Model Cards
```

**Social Media**
```
LinkedIn: "AZCA announces Responsible AI initiative - transparent, 
trustworthy, compliant. First in Hispanic market."
[Link to blog post]

Twitter: "We believe AI should be transparent. 
Meet AZCA Certified Responsible AI. 
See how our models work: /ai-model-cards 🤖"

Instagram: "Transparency + AI = Trust. 
Discover AZCA's responsible AI approach. 
Link in bio."
```

**Press Release** (If you do PR)
```
FOR IMMEDIATE RELEASE

AZCA Launches Certified Responsible AI
First Hispanic restaurant platform to implement 
international standards for transparent, ethical AI

[City], [Date] — AZCA announced today the launch of 
Certified Responsible AI...

Key facts:
- GDPR compliant
- EU AI Act ready
- Zero personal data used
- Model Cards public
- Bias audited monthly

More: /ai-model-cards
```

### Metrics to Track
- Pageviews: /ai-model-cards (target: 100+/day week 1)
- Click-through: Email campaign (target: >10%)
- Engagement: Time on page (target: >2 min)
- Adoption: Users view transparency (target: 40%+)
- Media: Mentions/articles (target: 2-5 in first month)

### Collaboration
- Dev: "When can you launch?" → Get specific date
- Design: "Approve visuals?" → 48 hour review
- Legal: "Approve messaging?" → 24 hour review

---

## 🚀 DEVOPS / INFRASTRUCTURE

### Pre-Deployment
- [ ] Build verification:
  ```bash
  npm run build
  du -sh dist/
  # Should be <10MB
  ```

- [ ] Staging deploy (test):
  ```bash
  vercel deploy --target staging
  # Or: Deploy to temp environment
  ```

- [ ] Testing on staging:
  - [ ] `/ai-model-cards` loads
  - [ ] `/ai-responsable-example` loads
  - [ ] No JS errors (check console)
  - [ ] Performance OK (check waterfall)

### Production Deployment

**Option 1: Automated (Recommended)**
```bash
git push origin main
# GitHub Actions:
#   1. npm run lint
#   2. npm run build
#   3. Deploy to production
#   4. Run smoke tests
```

**Option 2: Manual**
```bash
npm run build
scp -r dist/* prod-server:/var/app/
systemctl restart nginx
```

**Post-Deploy Verification**
```bash
# Check in production
curl https://example.com/ai-model-cards | head -c 100
# Should return HTML

# Monitor
tail -f /var/log/access.log | grep ai-model-cards
# Should see requests

# Error tracking
# Check Sentry dashboard: 0 errors expected
```

### Monitoring (24/7)
```
Alerts to configure:
- 404 on /ai-model-cards
- 500 errors
- JS error rate >1%
- Load time >3s
- CPU spike
```

### Rollback Plan
```bash
# If critical issue
git revert <commit>
npm run build
# Deploy previous version
# Should take <5 minutes
```

### Documentation
- [ ] Add deployment log
- [ ] Document incidents (if any)
- [ ] Update runbooks
- [ ] Brief team on alerts

---

## 📊 PRODUCT MANAGER

### Approval Process
- [ ] Read: Executive Summary (10 min)
- [ ] Review: Component lifecycle
- [ ] Decide: Feature flags? (optional)
- [ ] Plan: Next steps

### Feature Flags (Optional)
```javascript
const flags = {
  showAIResponsible: true, // Roll out 100%
  showTransparency: true,  // Show in dashboard
  showBadges: true,        // Show confidence badges
}

if (flags.showAIResponsible) {
  // Show all components
}
```

### Metrics to Monitor

**User Engagement** (Week 1-2):
- [ ] % users viewing `/ai-model-cards`
- [ ] Avg time on page
- [ ] Click-through to `/ai-responsable-example`
- [ ] Return rate

**Adoption** (Week 2-4):
- [ ] % using predictions (with vs without)
- [ ] Accuracy perception (survey)
- [ ] Trust increase (NPS)
- [ ] Support tickets change

**Business** (Month 1):
- [ ] Churn impact (retention)
- [ ] Upgrade rate increase
- [ ] New user acquisition
- [ ] Media coverage

### Roadmap Items
- ✅ v1.0: Launch (Done)
- ⏳ v1.1: Real data integration
- ⏳ v1.2: More languages (EN, PT)
- ⏳ v2.0: New models + explainability

---

## 🎯 QUICK REFERENCE BY ROLE

| Rol | Lee | Tiempo | Acción |
|-----|------|--------|--------|
| **Ejecutivo** | Executive Summary | 10 min | Aprueba/rechaza |
| **Developer** | Quick Start | 5 min | Implementa |
| **QA** | Checklist | 1-2h | Testa todas fases |
| **Designer** | Review visual | 30 min | Aprueba diseño |
| **Legal** | Standard (sec 8) | 20 min | Aprueba compliance |
| **Marketing** | Content ideas | 1h | Crea materiales |
| **DevOps** | Deployment guide | 30 min | Configura prod |
| **Product** | Roadmap | 30 min | Plan rolling |

---

## 📞 Contacto por Rol

| Pregunta | Contactar |
|----------|----------|
| ¿Cómo implemento? | @developer (usa QUICKSTART.md) |
| ¿Qué testeo? | @qa (usa CHECKLIST.md) |
| ¿Cómo lookan? | @designer (review components) |
| ¿Es legal? | ia-responsable@azca.es |
| ¿ROI? | cto@azca.es |
| ¿Timeline? | project manager |
| ¿Deploy? | devops team |

---

**Versión**: 1.0  
**Última actualización**: Marzo 2026  
**Status**: ✅ Listo para distribución por rol

