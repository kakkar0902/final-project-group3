# Testing

Testing will be done using a mixture of manual testing, Vitest and a new tool called Cypress.

## What is Cypress?
[Cypress](https://www.cypress.io/) is a powerful, modern end‑to‑end (E2E) testing framework designed for testing how real users interact with your application in the browser. It runs your tests inside an actual browser, giving you full visibility into the DOM, network requests, and application behavior as it executes.

## When to use Vitest v/s Cypress?
In short, when you are doing unit tests or want to test an individual component/feature, use Vitest. Cypress should be reserved for mostly E2E testing.

## Testing your changes
Any **Vitest** files you create should be done in the `/tests` directory and can be run using the command below:
```shell
pnpm test
```

**Cypress** files on the other hand should be done in the `/cypress/e2e` directory, and can be run using **one** of the commands below:
```shell
pnpm cy:run     # will run all test files in the terminal itself (faster)

pnpm cy:open    # will open up the Cypress Test Runner GUI where you will need to manually select the test file to run and watch it run in a browser window
```