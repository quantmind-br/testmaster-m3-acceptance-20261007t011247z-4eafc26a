# TestMaster M3 hosted acceptance (disposable)

Public acceptance fixture for the TestMaster strict CI Action
([quantmind-br/testmaster](https://github.com/quantmind-br/testmaster)). `fixture/variant.json`
is the evaluated product state.

- `.github/workflows/testmaster.yml` is generated verbatim by `testmaster ci init github` and runs
  the declared setup script `ci/setup.sh` on `workflow_dispatch` and same-repository pull requests.
- `.github/workflows/acceptance-controls.yml` is a dispatch-only control matrix (empty,
  authorized-empty, cancel, input injection, SHA mismatch, read-only publisher) prepared by
  `setup.mjs`.

Both pin the public Action distribution commit and the runtime manifest SHA-256; the runtime is
downloaded anonymously from the public prerelease.
