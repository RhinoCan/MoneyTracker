# How much coverage should I get?

I asked three different AIs how much coverage I should attempt to get for a portfolio project.
Specifically, I asked this question:

I'm doing unit testing for a portfolio project with 34 test-worthy files divided up into components, composables, utilities, and a few other odds and ends. I'm using Vitest as my test runner. What level of coverage should I shoot for in the coverage report in terms of "% Stmts", "% Branch", "% Funcs", "%Lines" and "Uncovered line #s"?


## ChatGPT's answer

Great question — and this is exactly the right way to think about coverage for a portfolio project.

Short answer:
**You don’t need 100%. You need credible, intentional coverage.**

Let’s break this down in a practical way for a Vue 3 + Vitest portfolio project.

---

# 🎯 What You Should Aim For (Portfolio Context)

For a serious portfolio project (not enterprise production):

| Metric       | Good Target | Excellent Target |
| ------------ | ----------- | ---------------- |
| **% Stmts**  | 80%+        | 90%+             |
| **% Lines**  | 80%+        | 90%+             |
| **% Funcs**  | 85%+        | 95%+             |
| **% Branch** | 70–75%+     | 85%+             |

Branch coverage is always the hardest. Don’t obsess over making it 100%.

If you hit:

> **~85% across the board with thoughtful tests**

that’s extremely respectable for a portfolio.

---

# 📊 What Hiring Managers Actually Care About

They don’t care about:

* 100% coverage
* Zero uncovered lines
* Testing every getter/setter

They care about:

* Are critical paths tested?
* Are edge cases handled?
* Is error handling tested?
* Are composables tested properly?
* Is async logic tested correctly?
* Do tests read cleanly and clearly?

Good tests > High percentage.

---

# 🧠 Where Coverage Really Matters in Your Project

You said you have:

* Components
* Composables
* Utilities
* Misc logic

Here’s how to prioritize:

---

## ✅ Utilities

These should be **near 100%**.

Why?

* They’re pure functions
* Easy to test
* Deterministic

If a utility isn’t 95–100%, something’s missing.

---

## ✅ Composables

Shoot for **85–95%**

Especially test:

* Reactive state changes
* Edge cases
* Errors
* Async behavior

These are logic-heavy and very important.

---

## ⚖️ Components

Aim for **75–90%**

You don’t need to test:

* Every Vuetify prop
* Every render branch caused by styling
* Every emitted event from child components you don’t own

Test:

* Business logic
* Form validation
* Store interactions
* Conditional rendering
* Emitted events
* Error states

---

# 🔎 About “Uncovered line #s”

Uncovered lines are fine **if they are:**

* Defensive code
* Rare edge-case guards
* Logging-only lines
* Framework boilerplate
* Type narrowing lines

They are NOT fine if they are:

* Error handling blocks
* Validation failures
* Async failure paths
* Store interaction failures

---

# 🚫 Don’t Chase 100%

100% often means:

* Testing implementation details
* Mocking too much
* Brittle tests
* Testing Vuetify instead of your logic
* Writing tests that exist only to increase coverage

That’s not impressive.

Intentional coverage is impressive.

---

# 🏆 A Realistic “Impressive” Portfolio Goal

For 34 test-worthy files:

* 85–92% statements
* 80–88% branches
* Clear test naming
* Clean mock setup
* No flakey async tests
* Good separation between unit and component tests

That screams “this person knows what they’re doing.”

---

# 💬 One More Important Thing

If you can say in an interview:

> “I prioritized business logic, composables, and validation paths over superficial render coverage.”

That’s stronger than:

> “I got 100% coverage.”

---

# 🧩 My Honest Recommendation for You

Given the amount of effort you're already putting into correctness and typing:

Aim for:

> **85%+ overall, 90%+ on utilities, 80%+ on components**

Then stop.

Polish readability instead of squeezing the last 5%.

---

If you'd like, I can also explain:

* How to interpret a coverage report intelligently
* How to quickly find “fake” coverage
* Or how to defend your coverage choices in an interview

What direction would be most helpful for you?


## Gemini's answer

Aiming for the "perfect" number in code coverage is often a trap. While high numbers look great on a README badge, 100% coverage can sometimes hide poor-quality tests that assert nothing of value.

However, for a portfolio project where you want to demonstrate professional rigor, here is a breakdown of the targets you should shoot for and what those specific Vitest metrics actually mean for your code.

---

### Recommended Targets for Portfolio Projects

| Metric | Target | Why it matters |
| --- | --- | --- |
| **% Stmts** (Statements) | **80% – 90%** | Ensures the bulk of your logic is actually being executed during tests. |
| **% Branch** | **75% – 85%** | Crucial for "composables" and "utilities." This tracks if you’ve tested both the `if` and the `else`. |
| **% Funcs** (Functions) | **90% – 100%** | Easy to hit. If a function isn't called at all in your tests, why is it in your codebase? |
| **% Lines** | **80% – 90%** | Similar to statements; provides a high-level view of "untouched" code. |
| **Uncovered Lines** | **Specific** | This shouldn't be a percentage, but a map for your next task. |

---

### Deep Dive: What to Prioritize

Not all of your 34 files deserve equal attention. To make your portfolio stand out to a hiring manager, focus your "coverage energy" where the logic lives:

#### 1. Utilities and Composables (Target: 95%+)

These are the building blocks of your app. Since they are usually "pure" functions or logic-heavy, they are the easiest to test and the most dangerous if they fail.

* **Focus:** Branch coverage. If a utility has a complex `switch` statement or multiple `if/else` blocks, make sure every path is hit.

#### 2. Components (Target: 70% – 80%)

Testing UI components often suffers from diminishing returns. Don't waste time testing that a `<div>` rendered; instead, test the **behavior**.

* **Focus:** Functional coverage. Does the button click trigger the emit? Does the prop change the displayed text?

#### 3. "The Odds and Ends" (Target: Variable)

For files like constants, types, or configuration, coverage is often irrelevant. You can actually exclude these from your Vitest config so they don't drag down your global average.

---

### Understanding the "Uncovered Line #s"

This is arguably the most important column in your Vitest report. It tells you exactly where your "blind spots" are.

* **Professional Tip:** Use the Vitest UI (`vitest --ui`) or the HTML reporter. It provides a color-coded view of your source code. Lines highlighted in red are the ones you've missed.
* **The Goal:** You don't need this to be empty, but you should be able to *justify* why a line is uncovered (e.g., "This handles an edge case that only occurs in a specific production environment").

---

### How to Configure Vitest for Success

In your `vitest.config.ts`, you can set "thresholds." If your coverage drops below these numbers, the test suite will fail—this is a great way to maintain discipline.

```typescript
// Example vitest.config.ts snippet
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8', // or 'istanbul'
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 90,
        lines: 80,
      },
    },
  },
})

```

> **A Note on Your Architecture:** Since you mentioned having 34 test-worthy files, **I'd love to take a look at your `vitest.config.ts` or the file structure of your `composables` folder.** Seeing how you've organized things will help me suggest specific testing patterns for those "odds and ends" you mentioned.

Would you like to share the code for one of your more complex composables or your Vitest configuration?

Not really, I'm just looking for the basic principle I should be following. I had assumed that 100% coverage in every column of the report was the Gold standard and everything else was second best. I actually achieved 100% across the board in my first phase of testing before I added a major new chunk of functionality. I'm asking three different AIs their views on this matter so I can assess when I've done enough testing.

Achieving 100% coverage is an impressive technical feat—especially in a portfolio project—but in professional environments, it is rarely viewed as the "Gold Standard." In fact, many senior developers view a forced 100% target as a **"Red Flag."**

The consensus in 2026 (and for the last decade) is that code coverage is a **qualitative tool, not a quantitative goal.** Here is the principle you should follow as you move into the next phase of your project.

### 1. The Principle of Diminishing Returns

The effort required to move from 0% to 80% coverage is often equal to the effort required to move from 90% to 100%.

* **The Danger of 100%:** To hit that final 10%, developers often write "brittle" tests. These are tests that verify *how* the code is written (implementation) rather than *what* the code does (behavior).
* **The Result:** When you refactor a function to be more efficient without changing its output, a "100% coverage" suite often breaks entirely, forcing you to rewrite tests for a feature that isn't actually broken.

### 2. Coverage Targets by Category

Instead of a flat 100% across all 34 files, professional suites typically use **tiered targets** based on risk:

| Category | Target | Logic |
| --- | --- | --- |
| **Utilities/Helpers** | **95% - 100%** | Pure logic. High reuse. These *should* be near 100%. |
| **Composables/Hooks** | **80% - 90%** | Business logic and state management. Focus on "Branch" coverage. |
| **Components** | **60% - 70%** | Focus on user interactions (clicks, inputs) rather than CSS/HTML structure. |
| **Glue Code/Config** | **0%** | Don't test your `vite.config.ts` or constants. Exclude them. |

### 3. Metric Breakdown: Which one is "King"?

If you have to prioritize one column in your Vitest report, make it **% Branch**.

* **% Stmts / % Lines:** These are "vanity metrics." You can hit 100% here just by running the code once, even if you never test the error handling.
* **% Funcs:** This just confirms you called the function. It doesn't mean the function worked.
* **% Branch (The Real MVP):** This tells you if you tested every `if`, `else`, `switch` case, and optional chain (`?.`). If your Branch coverage is high, your "logic" is truly tested.

### 4. How to "Assess" if You've Done Enough

Since you are using this for a portfolio, a hiring manager won't care if you have 100% coverage. They will care about your **Testing Strategy.** **You have "done enough" when:**

1. **Critical Paths are Green:** If a user can't log in or save data because of a bug, and your tests didn't catch it, coverage doesn't matter.
2. **Edge Cases are Covered:** Did you test what happens when an API returns a `404` or an empty array?
3. **The "Uncovered Lines" are Intentional:** Open your Vitest HTML report. Look at the red lines. If you can say, *"I didn't test this line because it's a fallback for a browser that no longer exists,"* you're done.

---

### A Better Portfolio Story

If I were interviewing you, I’d be much more impressed by this narrative:

> *"I hit 100% coverage in Phase 1, but as the app grew, I realized I was testing implementation details. In Phase 2, I shifted to a **Risk-Based Testing** approach, maintaining 100% on my core utilities while focusing on integration tests for my complex components. This kept my build times fast and my tests resilient to refactoring."*

Since you’re weighing different perspectives to find your own "definition of done," here is a final bit of distilled advice for your assessment:

**The "Refactor Test" is the ultimate judge.** If you can change the internal logic of a function (e.g., swapping a `for` loop for a `.map()`) and your 100% coverage suite stays green, you have **High-Quality Coverage**. If your tests break even though the output is the same, you have **Brittle Coverage**.

When the other AIs give you their numbers, look for that distinction. A portfolio that showcases *resilient* tests is always more impressive than one that just showcases *many* tests.

Good luck with the next phase of your project!


## Claude's answer

Great question, and here's a practical answer rather than a theoretical one:

## Recommended Targets for a Portfolio Project

| Metric | Minimum | Good | Excellent |
|--------|---------|------|-----------|
| % Stmts | 85% | 90% | 95%+ |
| % Branch | 75% | 85% | 90%+ |
| % Funcs | 80% | 90% | 95%+ |
| % Lines | 85% | 90% | 95%+ |

**You are currently at 97.17% statements / 90.52% branch / 97.17% lines**, which is genuinely excellent — well above what most professional teams require. Many mature codebases enforce 80% as their CI gate.

## The Nuanced Reality

**% Branch is always the hardest** and the least meaningful to chase. A branch miss could be a `?? "."` fallback that requires breaking `Intl` internals to trigger — not worth it. 90%+ branch coverage is exceptional.

**% Funcs can be misleading** — your 67% is almost entirely Vuetify SFC instrumentation artifacts and untested lifecycle hooks, not real gaps. Don't chase it.

**Uncovered lines matter more than the percentage.** The right question isn't "is my number high enough?" but "do I understand why each uncovered line isn't covered?" If the answer is "it's a catch block for an Intl failure that can't happen in jsdom" or "it's a module-level constant" — that's fine. If the answer is "I just never wrote that test" — that's worth fixing.

## For a Portfolio Project Specifically

Recruiters and reviewers who look at test suites are mostly checking that you:
1. Have tests at all
2. Test meaningful behavior, not just that functions exist
3. Understand the difference between unit and integration concerns
4. Can explain your coverage gaps intelligently

Your current suite demonstrates all four. The second-pass work you're doing now is genuinely above and beyond what most portfolio projects show, and finishing it will put you in rare company.