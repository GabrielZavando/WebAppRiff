# ci-release-workflow Specification

## Purpose
TBD - created by archiving change remove-release-workflow. Update Purpose after archive.
## Requirements
### Requirement: No framework-publish workflow in consumer repository
The consumer repository SHALL NOT contain a GitHub Actions workflow that publishes the root package to GitHub Packages on push to main; main-branch validation SHALL be provided by the existing CI workflow.

#### Scenario: Push to main without publish workflow
- **WHEN** a change is merged/pushed to `main` after `release.yml` is removed
- **THEN** no "Publish to GitHub Packages" run is triggered in GitHub Actions

#### Scenario: CI validation still enforced
- **WHEN** a change is pushed to `main` or opened as a PR
- **THEN** the existing `ci.yml` workflow runs the full validation gate and fails on errors

### Requirement: Tag-based deploy flow preserved
The removal SHALL NOT affect the tag-based (`v*`) and manual deploy workflow.

#### Scenario: Tag push still deploys
- **WHEN** a `v*` tag is pushed (or the deploy workflow is dispatched manually)
- **THEN** the staging/production deploy behaves exactly as before

