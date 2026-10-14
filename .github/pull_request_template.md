# Change

Describe the problem, resulting behavior and linked issue. Keep one epic subissue
per PR.

Closes #

## Architecture and compatibility

- [ ] Read all Meta and local ADRs and relevant guides; record applicable decisions or conflicts below.
- [ ] Keep public contracts independent of Nest, Angular, Nx and implementation repositories.
- [ ] For package changes, use lifecycle-appropriate Conventional Commits with exact Nx scopes and explain wire/API compatibility and consumer impact; preserve migration evidence for breaks.

## Validation

Record commands and results, including `yarn install --immutable` and `yarn check`.
For public contract changes, link baseline, compatibility and actual HTTP
conformance evidence appropriate to the implementation stage. State remaining
gaps; package availability alone does not demonstrate consumer adoption.
