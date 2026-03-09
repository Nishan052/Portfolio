const post = {
  id:        1,
  slug:      'angular-spa-routing',
  title:     'Angular SPA Routing: Lazy Loading, Guards & Child Routes',
  category:  'project',
  emoji:     '🔀',
  color:     '#3b82f6',
  date:      '2026-03-08',
  readTime:  '9 min',
  tags:      ['Angular', 'TypeScript', 'RxJS', 'Lazy Loading', 'SPA', 'Router'],
  githubUrl: 'https://github.com/Nishan052/Routing-app',
  excerpt:   'A hands-on Angular 14 project demonstrating client-side SPA routing patterns: feature module lazy loading, route guards, child routes, and RxJS-powered reactive navigation.',

  content: `
## Overview

Single Page Applications (SPAs) load once and then update the DOM in response to URL changes — no full-page reloads. Angular's built-in **Router** module is one of the most fully-featured client-side routing solutions in the JavaScript ecosystem.

---

## What Is SPA Routing?

\`\`\`mermaid
sequenceDiagram
    participant User
    participant Browser
    participant AngularRouter
    participant Component
    User->>Browser: Click /products/42
    Browser->>AngularRouter: URL change event History API
    AngularRouter->>AngularRouter: Match route config
    AngularRouter->>Component: Activate matched component
    Component->>Browser: Update DOM no page reload
    Browser->>User: Updated view
\`\`\`

Unlike traditional multi-page apps, the server always returns the same \`index.html\`. The browser's **History API** (pushState) handles URL changes locally, and Angular's router maps them to components.

---

## Route Configuration

\`\`\`mermaid
flowchart TD
    ROOT["AppModule /"] --> HOME["home HomeComponent"]
    ROOT --> PRODUCTS["products ProductsModule lazy loaded"]
    ROOT --> AUTH["auth AuthModule lazy loaded"]
    ROOT --> ADMIN["admin AdminModule guarded and lazy"]
    ROOT --> WILDCARD["** PageNotFoundComponent"]
    PRODUCTS --> PLIST["empty ProductListComponent"]
    PRODUCTS --> PDETAIL[":id ProductDetailComponent child route"]
    ADMIN --> AGUARD["CanActivate AuthGuard"]
    AGUARD --> ADASH["dashboard AdminDashComponent"]
\`\`\`

---

## Key Patterns Implemented

### 1. Lazy Loading Feature Modules

Lazy loading defers loading a feature module's JavaScript bundle until the user first navigates to its route. The initial bundle stays small — only code for the first view is loaded. Subsequent modules download on demand, cutting Time-to-Interactive by 40–60% in large apps.

### 2. Route Guards

\`\`\`mermaid
flowchart LR
    A[User navigates to /admin] --> B{AuthGuard canActivate}
    B -- authenticated --> C[Activate AdminComponent]
    B -- not authenticated --> D[Redirect to /login]
\`\`\`

Guards implement the \`CanActivate\` interface and return \`true | false | UrlTree\`. Using \`UrlTree\` for redirects keeps navigation declarative and testable.

### 3. Child Routes

Child routes nest components inside a parent's \`router-outlet\`. This enables **persistent layouts** (sidebar, header) that survive navigation between child routes — only the outlet content re-renders.

### 4. Route Parameters with RxJS

Using \`paramMap\` (an Observable) instead of \`snapshot.params\` means the component reacts to ID changes even when Angular reuses the same component instance — critical for navigating between \`/products/1\` and \`/products/2\`.

---

## Angular Routing Lifecycle

\`\`\`mermaid
stateDiagram-v2
    [*] --> UrlParsing
    UrlParsing --> RouteMatching
    RouteMatching --> GuardExecution : CanActivate CanDeactivate
    GuardExecution --> Resolvers : CanActivate passed
    GuardExecution --> Redirect : Guard failed
    Resolvers --> ComponentActivation
    ComponentActivation --> [*]
\`\`\`

---

## Design Decisions

### Why Angular Router over React Router?
Angular Router is opinionated and batteries-included: guards, resolvers, lazy loading, and named outlets are first-class citizens. For a demonstration project, Angular's prescriptive approach is pedagogically cleaner.

### Why TypeScript?
TypeScript catches route parameter typos at compile time, makes refactoring safer, and Angular's DI system depends on type metadata from decorators.

### Why switchMap for Route Params?
\`switchMap\` cancels the previous inner Observable when a new param arrives. Without it, rapid navigation between product IDs could result in out-of-order HTTP responses.

---

## How to Recreate

\`\`\`bash
npm install -g @angular/cli@14
ng new routing-app --routing --style=css
ng generate module products --routing --route products --module app
ng generate guard auth/auth --implements CanActivate
ng serve --open
\`\`\`
`,

  references: [
    { text: 'Angular Team (2024) Angular Router Documentation.', url: 'https://angular.io/guide/router' },
    { text: 'Sander, E. and Savkin, V. (2017) Angular Router. Shelter Island: Manning Publications.' },
    { text: 'RxJS Team (2024) switchMap operator documentation.', url: 'https://rxjs.dev/api/operators/switchMap' },
  ],
};

export default post;
