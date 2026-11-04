# Python

### Python

- Use the repository's declared Python version and dependency manager.
- Favor type annotations, isolated side effects, explicit exceptions, input
  validation, secure defaults, and `pytest`-style focused tests when present.
- Run formatter, linter, type checker, unit tests, and integration checks that
  the repository declares; report any omitted check.

**Python build practice.** First locate `pyproject.toml`, supported Python
versions, lockfile, packaging configuration, test configuration, and the
project's command runner. Preserve its dependency manager and virtual-environment
convention. New public functions need a clear contract, types where the project
uses them, validation at trust boundaries, and failures that retain useful
context without leaking secrets.

Keep I/O, time, randomness, process state, and network calls at explicit
boundaries so domain logic can be tested. Use standard-library facilities before
adding dependencies; when a dependency is justified, update the declared
constraint and lock artifact using the project’s own workflow. Avoid broad
exception swallowing, mutable module globals, hidden environment reads, and
filesystem writes that are not contained or recoverable.

**Python verification.** Run focused tests for the changed behavior, then the
repository's normal formatter/lint/type/test sequence when available. Exercise
CLI/API/database adapters with realistic invalid input as well as happy paths.
For migrations or jobs, prove repeatability and recovery behavior, not merely a
successful first execution.
