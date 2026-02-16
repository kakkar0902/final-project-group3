# Testing

Testing will be done using a mixture of manual testing, Vitest and a new tool called Cypress.

## What is Cypress?
[Cypress](https://www.cypress.io/) is a powerful, modern end‑to‑end (E2E) testing framework designed for testing how real users interact with your application in the browser. It runs your tests inside an actual browser, giving you full visibility into the DOM, network requests, and application behavior as it executes.

## When to use Vitest v/s Cypress?
In short, when you are doing unit tests or want to test an individual component/feature, use Vitest. Cypress should be reserved for mostly E2E testing.

## Where should you place your test files?
**Cypress** files (ending in `.cy.ts`) should be located in the `/cypress/e2e` directory.

For **Vitest** files (ending in `.test.tsx` or `.test.ts`), following the rules below:
1. Are you testing endpoints in the `src/api` directory? If so, it is generally prefered that you create a `__test__` folder in the associated directory. For example, you have `src/api/projects/routes`, then you world create an associated `src/api/projects/routes/__test__` folder to place all your test files.
2. Are you testing individual components? If so, the convention is to have the test file live right next to it's associated component in the same folder. For example, `scr/components/Navbar.tsx` and `scr/components/Navbar.test.tsx`

## What is the `tests` folder for?
The `tests` folder **(not `__tests__`)** folder is where the `setup.ts` file for Vitest lives along with any resusable mock logic and data that can be shared amongst test files.

Reusable mocks for Next.js modules live in **`tests/mocks/`**. Use them in component tests to avoid duplicating mock logic:

- **`next-themes`** – `vi.mock("next-themes", async () => (await import("../../tests/mocks/next-themes")).default);`
- **`next/image`** – `vi.mock("next/image", async () => ({ default: (await import("../../tests/mocks/next-image")).default }));`

Adjust the import path if your test file is not in `src/components/`.

Shared **test data** (fixtures) live in **`tests/fixtures/`**, e.g. `tests/fixtures/projects.ts` for `mockProjects` used by the projects API tests. Use these instead of duplicating sample data across test files.

## Tips for when writing your Test Files
Prefer querying by **role** and **accessible name** (e.g. `getByRole("link", { name: "Home" })`). If an element is hard to target reliably (e.g. duplicated markup, no clear role/label), add a **`data-testid`** attribute to the component so tests can use `getByTestId("...")` without brittle selectors.

## Testing your Changes
Any test files that use **Vitest** can be run using the command below:
```shell
pnpm test
```

**Cypress** files on the other hand (usually located in the `/cypress/e2e` directory), and can be run using **one** of the commands below:
```shell
pnpm cy:run     # will run all test files in the terminal itself (faster)

pnpm cy:open    # will open up the Cypress Test Runner GUI where you will need to manually select a test file, and watch it run in the browser window (slower)
```