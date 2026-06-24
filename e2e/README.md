# E2E suite — blog

Suite Playwright que ejercita los flujos visibles de `/blog/*` con el CMS **mockeado en el browser** (interceptación de requests). El objetivo es uno: **si la suite pasa, ningún flujo de blog está silenciosamente roto**.

> Esta carpeta cubre solo `blog`. Cuando absorbamos otros features (`whats-on`, `jump`, etc.) seguir el mismo patrón en un subdirectorio paralelo.

## Modelo mental — 4 conceptos

1. **Spec = user journey.** Cada archivo en `specs/blog/journey-*.spec.ts` walks un flujo entero click a click. **No** son tests aislados que aterrizan en una URL y assertan una cosa. La única `page.goto` permitida es la landing inicial; el resto son clicks reales.
2. **Mock = lo que el browser ve del CMS.** `mocks/blog.ts` registra `page.route()` sobre todos los endpoints CMS (`cms-api.decentraland.org/...`). Se llama **antes** de la primera navegación, así no hay race con el primer fetch.
3. **Fixtures = datos sintéticos del CMS.** TypeScript en `fixtures/blog/` (no JSON). Las factories en `cms-entry.factory.ts` producen objetos con el shape exacto de `CMSEntry` / `CMSListResponse`. `npm run e2e:check-fixtures` valida cross-references (post → categoría → autor).
4. **Sentinel = nada al CMS real.** Cualquier request al CMS que **no** matchee un handler vuelve con status `599`. Un listener en `mocks/shared.ts` marca el test como fallido si ve un `599`. Garantiza que ningún test pase pegándole a prod.

## Árbol de archivos

```
e2e/
├── playwright.config.ts          # webServer = preview + GEN_STATIC_LOCAL, baseURL :4173
├── README.md                     # este archivo
├── tsconfig.json                 # scope separado del bundle (no entra al build)
├── specs/
│   └── blog/
│       ├── _setup.ts                       # test.extend con watcher CMS + blockThirdParties
│       ├── journey-browse.spec.ts          # /blog → featured → detail → click categoría → otra → share buttons + partial-fail
│       ├── journey-by-category.spec.ts     # navbar → categoría → click post + empty + back to /blog
│       ├── journey-by-author.spec.ts       # post → click autor → otro post + empty author
│       ├── journey-related.spec.ts         # detail → related → click related → otro detail
│       ├── journey-search.spec.ts          # dropdown click + Enter submit + empty + load-more + ArrowDown+Enter + see-more + Escape
│       ├── journey-mobile.spec.ts          # 390x844 → sin featured → tap post
│       └── journey-infinite-scroll.spec.ts # scroll → skip>0 → click pág 2 → back preserva estado
├── pages/
│   └── blog.page.ts              # Page Objects: BlogListingPage, BlogPostDetailPage, BlogCategoryPage, BlogAuthorPage, BlogSearchPage, BlogNavbar
├── mocks/
│   ├── blog.ts                   # mockBlogApi(page, scenario) — dispatcher central
│   ├── types.ts                  # BlogScenario (qué decirle al dispatcher)
│   └── shared.ts                 # watchUnmockedCmsRequests + UNMOCKED_CMS_STATUS (599)
└── fixtures/
    └── blog/
        ├── cms-entry.factory.ts  # createBlogPostEntry, createCategoryEntry, etc.
        ├── assets.ts             # imagen sintéticas
        ├── authors.ts            # 3 autores
        ├── categories.ts         # 3 categorías
        ├── posts-page-1.ts       # 7 posts (1 featured + 6 grid)
        ├── posts-page-2.ts       # 6 posts (skip=20)
        ├── post-detail.ts        # 1 post completo con body rich-text
        └── search.ts             # 3 hits con `_highlight` simulado
```

## Cómo agregar un spec

1. **Identificar el journey.** ¿Qué flujo de usuario querés cubrir? Si encaja en un spec existente, sumalo ahí. Si es un flujo nuevo, creá `journey-<nombre>.spec.ts`.
2. **Si necesitás un nuevo scenario del CMS**, extender `BlogScenario` en `mocks/types.ts` y agregar la rama en `mocks/blog.ts`.
3. **Si necesitás fixtures nuevos**, agregar entrada en `fixtures/blog/` via la factory correspondiente. Correr `npm run e2e:check-fixtures` para validar cross-references.
4. **Si necesitás un selector nuevo**, ampliar el Page Object en `pages/blog.page.ts`. **No** inlinear selectores en specs.
5. **Receta del spec**: ver `e2e-author` skill (`.claude/skills/e2e-author/SKILL.md`) — `mockBlogApi(page, scenario)` antes de `goto`, `watchUnmockedCmsRequests(page)` en `beforeEach`, locators semánticos.

## Comandos

```bash
npm run e2e                  # build + preview + correr suite
npm run e2e:ui               # modo UI interactivo
npm run e2e:install          # instalar chromium (una vez)
npm run e2e:check-fixtures   # validar tipos + cross-refs sin correr la suite
npx playwright test -c e2e/playwright.config.ts e2e/specs/blog/journey-browse.spec.ts   # correr un spec puntual
```

## Anti-flake

- **Nunca** `waitForTimeout` ni `waitForLoadState('networkidle')`. Usar `waitForRequest`, `waitForResponse` o `expect.poll`.
- Primera assertion tras `goto` usa `{ timeout: 15_000 }` (DappsShell es lazy chunk).
- Telemetría de terceros (Segment, Sentry, etc.) bloqueada vía `mocks/shared.ts:blockThirdParties`.

## Cómo se ve un fallo

CI sube `playwright-report/` como artifact solo cuando falla. Bajalo, abrí `index.html`, click en el test rojo: ves trace viewer embebido (network, console, snapshots DOM). Localmente: `npx playwright show-trace test-results/<…>/trace.zip`.
