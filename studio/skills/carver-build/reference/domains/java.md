# Java

### Java

- Use the project's declared JDK, build tool, and language level. Do not assume
  a newest JDK is compatible with an existing project.
- Prefer explicit types, immutable boundaries, checked failure handling where it
  improves correctness, and JUnit tests consistent with the project.
- Run the project build, targeted tests, static analysis, and packaging checks
  appropriate to Maven, Gradle, or the repository's actual toolchain.

**Java build practice.** Read the root and module build descriptors before
introducing a library, plugin, annotation processor, or Java feature. Preserve
module boundaries, dependency-management conventions, source/target release,
and framework idioms. Make nullability, resource ownership, transactions,
threading, and error translation explicit at service boundaries. Prefer
immutable value objects and small cohesive interfaces where they reduce the
possibility of invalid state; do not refactor unrelated code just to impose a
preferred pattern.

**Java verification.** Run the module-level targeted tests, then the declared
Maven or Gradle lifecycle needed to compile, test, analyze, and package the
affected deliverable. Test serialization, persistence, concurrency, and retry
semantics at the layer touched by the change. Report a skipped integration suite
or environment-only test rather than treating compilation as end-to-end proof.
