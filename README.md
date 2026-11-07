# SkillSwap (Team GYMM)

Online course marketplace. **Milestone 1 = Angular frontend only**: no backend, all data is mocked in browser storage.

## Run it
```bash
npm install
ng serve          # http://localhost:4200
ng test           # unit tests (Vitest)
```

Demo logins (password for all: `Pass1234`): `admin`, `accountant`, `student1`, `student2`, `instructor1`, `instructor2`.

## Git workflow
- Never push to `main`. Make your own branch (`feat/m2-courses`), push it, open a pull request, ask another member to review. Member 1 merges.
- Commit as yourself, small and often.

## Plug in your page
Every page is a lazy-loaded route in `src/app/app.routes.ts`. Pages not built yet use a placeholder. To plug yours in, replace that route's `...page('Title', 'Member X')` with:
```ts
loadComponent: () => import('./features/<area>/<file>').then((m) => m.<Component>)
```
Keep the `canActivate` guard that is already there. Put your code in `src/app/features/<area>/`.

| Member | Routes | Who may open |
|---|---|---|
| 2 | `/courses`, `/courses/:id`, `/instructor` | public, public, instructor + admin |
| 3 | `/cart`, `/checkout`, `/payments`, `/invoices` | student (invoices: student, accountant, admin) |
| 4 | `/accounting/payroll`, `budget`, `payouts`, `refunds` | accountant + admin |

The Home page links categories as `/courses?category=Design`, so the catalog (Member 2) should read the `category` query parameter.

## Shared code you can reuse (`src/app/core`, `src/app/shared`)
- **`models.ts`**: `User`, `Course`, `Invoice`, `Payment`, `Refund`, `Enrollment`, `Staff`, `BudgetEntry`. Need a new field? Change it in a pull request and tell the team.
- **`config.ts`**: `REVENUE_SHARE` (0.7), `SUBSCRIPTION_PRICE`, `CATEGORIES`, and `KEYS` (every storage key name).
- **`AuthService`**: `currentUser()` (signal), `isLoggedIn()`, `hasRole('student')`.
- **`StorageService`**: always use this, never `localStorage` directly. `storage.local`, `storage.session`, `storage.cookie` each have `get / set / remove` (JSON in, JSON out).
- **`SeedService`**: add one line in `init()`, e.g. `this.storage.seedIfEmpty(KEYS.courses, COURSES_SEED)`, with your seed array in `core/seed/`.
- **`roleGuard('accountant', 'admin')`** / **`authGuard`**: already applied to the routes above.
- **`SoundService`**: `inject(SoundService).play('cart')`. Names: `click` (automatic on buttons), `success`, `error`, `cart`.
- **`<app-success-check />`**: animated checkmark, use after a payment or save.
- **Global CSS** (`src/styles.css`): `.container`, `.card`, `.btn` (+ `.secondary`, `.danger`), `.grid` (1/2/3/4 columns), `.table-wrap` (scrolls tables on phones), `.error`. Breakpoints: 600 / 768 / 992 / 1200 px, mobile first.

## Storage rules (the report is graded on these)
| Storage | Use for |
|---|---|
| sessionStorage | login session, **cart** (`KEYS.cart`) |
| localStorage | all mock data: courses, invoices, payments, refunds, enrollments, staff, budget |
| cookies | small preferences only (e.g. last category). Never passwords or card numbers |

State: component `signal()` for local state; a service holding signals for shared state (cart, invoices); `input()`/`output()` between parent and child.

## What each member builds and what they hand over
- **Member 2: courses.** Seed 12+ courses. `CourseService`: list, get by id, add, edit, delete, search. Catalog, course detail (Add to cart + Subscribe buttons call Member 3's services), instructor dashboard (own courses only, earnings = sale x `REVENUE_SHARE`). Hand over: `CourseService`, an earnings function Member 4 can call.
- **Member 3: commerce.** `CartService` (sessionStorage), checkout (mock payment, uses the masked card), subscription, `InvoiceService`, invoices table (create invoice, mark payment, history; students see only their own), refund requests. Hand over: invoices and refunds for Member 4, `markRefunded(id)`.
- **Member 4: accounting.** Payroll (salary, allowances, deductions, monthly JSON report), department budget with Chart.js charts (`chart.js` is installed), instructor payouts, refund approvals.
- Not ready yet? Build against a few fake records and swap in the real service later.

## Every member also
- Make your pages responsive (phone, tablet, desktop) and keep your feature lazy-loaded.
- Write unit tests for your services (`*.spec.ts` next to the file).
- Send Member 2: screenshots of your screens, one sentence on your state management, and a short note on which storage you use and why (for the report).
- Do not edit `src/environments/environment.ts` (the chat key lives there).
