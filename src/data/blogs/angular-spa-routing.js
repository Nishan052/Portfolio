const post = {
  id:        1,
  slug:      'angular-spa-routing',
  title:     'Angular SPA Routing: Lazy Loading, Guards & Child Routes',
  category:  'project',
  iconKey:   'ArrowLeftRight',
  color:     '#3b82f6',
  date:      '2026-03-08',
  readTime:  '9 min',
  tags:      ['Angular', 'TypeScript', 'RxJS', 'Lazy Loading', 'SPA', 'Router'],
  githubUrl: 'https://github.com/Nishan052/Routing-app',
  excerpt:   'A small Angular 14 app where I tried out lazy loading, route guards, child routes and route parameters that react through RxJS.',

  content: `
## What a single page app does

A single page application (SPA) loads once and then updates the page as the URL changes, without a full reload. For me Angular's Router is one of the most complete client-side routing options in JavaScript, so I used it for this small app.

---

## How SPA routing works

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

Unlike a traditional multi-page app, the server always sends back the same \`index.html\`. The browser's History API (pushState) changes the URL locally, and Angular's router maps it to a component.

---

## Route configuration

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

## The four patterns in the app

### 1. Lazy loading feature modules

Lazy loading waits to download a feature module's bundle until the user first opens its route, so the first bundle only holds the code for the first view. The rest download when they're needed, and in large apps that cuts Time-to-Interactive by 40–60%.

### 2. Route guards

\`\`\`mermaid
flowchart LR
    A[User navigates to /admin] --> B{AuthGuard canActivate}
    B -- authenticated --> C[Activate AdminComponent]
    B -- not authenticated --> D[Redirect to /login]
\`\`\`

Guards implement \`CanActivate\` and return \`true | false | UrlTree\`, and I'd use \`UrlTree\` for redirects since it keeps the navigation declarative and testable.

### 3. Child routes

Child routes nest components inside a parent's \`router-outlet\`, so a layout like the sidebar and header stays put between child routes and only the outlet content renders again.

### 4. Route parameters with RxJS

When you go from \`/products/1\` to \`/products/2\`, Angular reuses the same component instance, so the app reads \`paramMap\`, an Observable, instead of \`snapshot.params\` and still reacts to the new ID.

---

## The Angular routing lifecycle

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

## Design decisions

### Angular Router instead of React Router
Angular Router is opinionated and has guards, resolvers, lazy loading and named outlets built in, so for a demonstration project I feel its fixed way of doing things is cleaner to teach.

### TypeScript
TypeScript catches route parameter typos at compile time and makes refactoring safer, and Angular's dependency injection depends on the type metadata from decorators.

### switchMap for route parameters
\`switchMap\` cancels the previous inner Observable when a new parameter arrives, so quick clicks between product IDs can't bring back HTTP responses in the wrong order.

---

## How to recreate it

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
