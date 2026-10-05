---
series: introducing-web-loom
part: 4
summary: AI wrote most of Web Loom's code. Here's how that worked, what kept it on track, and why I think knowing patterns matters more now, not less.
---

# Patterns in the Age of Agentic Coding

_Part 4 of 4 in the series "Introducing Web Loom"._

---

I should say this plainly, because it shapes how you should read everything in this series. **Most of the code in Web Loom was written by AI coding agents.**

That covers the packages, the demo apps, a lot of the tests and much of the documentation. My role was closer to architect and reviewer. I decided what to build and how it should be structured, wrote or approved the specs, read the output and sent it back when it was wrong.

I don't think that makes the project less interesting. If anything, it made the project a running experiment in a question I care about: **when an agent can write the code, what is the human still for?**

## What made it work

An AI agent is very good at continuing a pattern and very bad at inventing a consistent one across hundreds of sessions. Left alone, every session makes slightly different local choices. Multiply that by 750 commits and you get a codebase that contradicts itself.

So most of my effort went into the things around the code.

**Specs before code.** The very first pull request in the repo wasn't code. It was product requirement documents for the store and the event bus. Larger features, like each phase of the template engine, got a written spec with requirements, a design and a task checklist before an agent wrote any code.

**Instructions the agents actually read.** The repo has a `CLAUDE.md` at its root and a set of focused "skills". These are short documents on architecture, testing, package configuration, cross-framework patterns and versioning, which an agent loads when it works in that area. They encode decisions so they don't have to be re-made in every session. "Business data belongs in Models, not in the Store" is one sentence in a file, and it prevents a whole category of drift.

**Gates that don't negotiate.** Type-checking, linting and tests are part of the expected workflow before every commit, and the core published packages each have a CI workflow that builds and tests them on every pull request. A Git hook rejects commit messages that don't follow Conventional Commits. None of this is unusual, but with agents it stops being good hygiene and becomes load-bearing. An agent will happily tell you a change is done. The type checker and the test suite are what check whether it actually is.

**Policies written down after something went wrong.** At one point package versions had drifted: the template engine was at `1.2.0` while the core packages it depends on were still at `0.8.0`. The fix wasn't only to correct the numbers. It was to write a versioning policy (lockstep, patch-only until 1.0) and add a CI guard that enforces it. If a rule matters, it has to live somewhere an agent will run into it.

## The lesson from the RxJS migration

The clearest example came after the move from RxJS to signals, described in [Part 2](https://webloomframework.com/blog/from-rxjs-to-signals).

The runtime code was migrated. About six weeks later, a repo-wide audit found that the _guidance_ was still teaching the old way. `CONTRIBUTING.md` still said "Use RxJS for reactivity". The testing skill still showed RxJS-based test patterns. The steering document for one of the agent tools still described `BehaviorSubject` as the core primitive.

The audit rated these as the highest-priority fixes. In its own words, they are "the files a new contributor or an AI coding agent reads first, so a stale pattern here compounds."

That sentence sums up agentic development for me. With human contributors, out-of-date docs are an annoyance, because people notice that the code disagrees and adapt. Agents tend to trust the instructions. If those are wrong, the agents generate wrong code faster than anyone can review it. **Your architecture is only as consistent as the context you give your agents.**

## Why patterns still matter

There's a tempting conclusion to draw from all this: if agents write the code, why learn MVVM, the Command pattern or event aggregation at all? Just describe what you want.

I've come to the opposite conclusion, for four reasons.

**1. Agents copy the context you give them.** An agent working in a codebase with clear layers produces code that respects those layers. An agent working in a tangle produces more tangle. Patterns are how you build a codebase that is easy to continue correctly.

**2. Clear boundaries turn vague requests into bounded tasks.** "Add a 'clear completed' button" is open-ended in a codebase where logic can live anywhere. In an MVVM codebase it means three specific things: a command on the ViewModel, a can-execute condition and a button bound to both. The smaller and better-defined the task, the better the output, and the easier it is to review.

**3. You can't review what you don't understand.** The scarce skill is no longer typing code. It's judging code: spotting that a component has quietly started managing business state, or that a subscription is never disposed. That judgement comes from knowing what "good" looks like, and patterns are the compressed, named form of that knowledge.

**4. Pattern names are a shared vocabulary.** "Make this a Command with a can-execute condition" or "publish an event on the bus instead of calling the other feature directly" carries a lot of meaning in a few words, for a colleague and for an agent alike. Names like ViewModel, Command, Repository and Mediator are decades of experience packed into words that both you and the model already understand.

Web Loom leans into this. Its own MCP server, `@web-loom/mcp-server`, gives AI assistants scaffolding tools for models, ViewModels, commands and plugins. It also exposes each package's documentation and an explanation of the MVVM architecture as resources the assistant can read. The idea is simple: if agents are going to write the code, give them the patterns directly.

## Not a replacement, but an exploration

I'll repeat what I said in [Part 1](https://webloomframework.com/blog/a-playground-that-grew-into-a-framework), because it's the honest framing for the whole series. **Web Loom is not trying to replace your favourite framework.** React, Vue, Angular, Solid, Svelte and the rest are great at rendering and have ecosystems Web Loom will never match. You almost certainly shouldn't rewrite a working app around it.

What I hope it offers is a well-documented place to explore an idea that the web has mostly overlooked. Business logic can live in plain, framework-free, testable classes, and the framework can be a thin, replaceable layer on top. Some of the packages may be useful to you directly. More likely, a few of the ideas will change how you structure code in whatever framework you already use. Either outcome would make me happy.

Building it with agents taught me one more thing. The tools that write code are changing fast. The ideas underneath, separation of concerns, explicit state, commands and events, have outlasted every one of those tools. They're worth keeping in your head, whoever or whatever is typing.

## Where to go from here

- **Browse the code:** [github.com/bretuobay/web-loom](https://github.com/bretuobay/web-loom).
- **Read the docs:** start at [Getting Started](https://webloomframework.com/docs/getting-started), or see how the core fits together in [Core Concepts](https://webloomframework.com/docs/core-concepts).
- **Read the blog series:** one article per package, ending with [Putting It All Together](https://webloomframework.com/blog/11-putting-it-all-together).
- **Read the book:** 23 chapters, from [Why MVVM Matters for Modern Frontend](https://webloomframework.com/book/chapter2) to [Testing MVVM Applications](https://webloomframework.com/book/chapter19) and [Plugin Architecture and Extensibility](https://webloomframework.com/book/chapter20).
- **Try it:** `npm create web-loom@latest`.

If you've built something similar, think I've got something wrong, or have found your own ways of keeping AI-written code coherent, I'd love to hear about it in the comments. The experiment is ongoing.

---

_This is the final part of the series "Introducing Web Loom". [Part 1: A Playground That Grew Into a Framework](https://webloomframework.com/blog/a-playground-that-grew-into-a-framework) · [Part 2: From RxJS to Signals](https://webloomframework.com/blog/from-rxjs-to-signals) · [Part 3: One ViewModel, Many Views](https://webloomframework.com/blog/one-viewmodel-many-views)._
