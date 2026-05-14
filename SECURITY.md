# Security Policy

_Last updated: 2026-05-14 · Version: 1.1_

## Reporting a Vulnerability

If you believe you have found a security vulnerability in this repository or in
any service it interacts with, please report it privately so we can address it
before it is publicly disclosed.

- **Email:** [security@decentraland.org](mailto:security@decentraland.org)
- **GitHub:** [private vulnerability report](https://github.com/decentraland/sites/security/advisories/new)
  via GitHub's "Report a vulnerability" workflow. Preferred when the issue is
  specific to this repository, as it keeps discussion attached to the source.

When reporting, please include as much of the following as possible:

- A clear description of the issue and its impact.
- Steps to reproduce, including affected URLs, requests, or commits.
- Any proof-of-concept code, screenshots, or logs.
- The environment (`decentraland.org`, `decentraland.zone`, `decentraland.today`)
  and the approximate time of testing.
- Your name or handle for credit (optional).

Do **not** open a public GitHub issue or pull request for security reports.
Do **not** disclose the issue on social media, blogs, or chat platforms until
we have confirmed a remediation timeline with you.

## What to Expect

We aim to respond to every report on a best-effort basis. Typical targets:

- **Acknowledgement:** within 3 business days of receipt.
- **Initial assessment:** within 10 business days of acknowledgement.
- **Remediation updates:** at least every 14 days while a fix is in progress.
- **Coordinated disclosure:** publication date agreed with the reporter; we
  generally aim for ≤ 90 days from acknowledgement, sooner for issues with an
  active exploitation risk.

If we miss a target, we will tell you why and propose a new date — we will not
go silent.

## Scope

### In scope

- Source code in this repository.
- Build, deployment, and CI configuration in `.github/`, `vercel.json`,
  `scripts/`, and `api/`.
- Production deployments served from `decentraland.org`, `decentraland.zone`,
  and `decentraland.today` that are powered by this codebase.
- Published artifacts derived from this repository (e.g. the `@dcl/sites` npm
  package and any deployed bundles that contain code authored here).

### Out of scope

Reports limited to the items below will generally be closed without
remediation. They may still be useful as context, but they do not by themselves
qualify as a vulnerability:

- Findings that depend on physical access, social engineering of Decentraland
  staff, or compromised user devices.
- Denial-of-service via volumetric traffic, large request floods, or other
  resource-exhaustion attacks against shared infrastructure.
- Self-XSS that requires the victim to paste attacker-supplied content into
  their own browser console or address bar.
- Reports generated solely by automated scanners without a working
  proof-of-concept or a demonstrated security impact.
- Missing security headers, weak TLS cipher preferences, or other "best
  practice" findings that do not exploit a concrete weakness.
- Vulnerabilities in third-party services we consume (please report those
  directly to the upstream vendor; we are happy to help coordinate).
- Issues that only affect unsupported branches, archived deployments, or
  preview URLs that are not linked from production.

## Safe Harbor

We will not pursue legal action — and we will actively support requests for
authorization with hosting providers, app stores, or law enforcement — against
researchers who:

- Make a good-faith effort to comply with this policy.
- Limit testing to accounts, content, and data that you own or have explicit
  permission to access.
- Avoid privacy violations, data destruction, service degradation, and any
  attempt to access data belonging to other users.
- Stop testing and report immediately if you encounter user data, credentials,
  or production keys.
- Give us reasonable time to remediate before any public disclosure.

This policy is intended to be consistent with the principles set out in
[disclose.io](https://disclose.io). Research conducted under this policy is
authorized under the U.S. Computer Fraud and Abuse Act (CFAA) and analogous
laws to the extent permitted, and we will defend that good-faith
authorization if a researcher's activity is later challenged by a third party.

## Supported Versions

Only the `master` branch and the currently deployed production build are
supported for security fixes. Older tags, branches, preview deployments, and
forks do not receive security updates from this repository.

## Recognition

We maintain a public list of researchers who have responsibly reported
vulnerabilities at
[github.com/decentraland/sites/security/advisories](https://github.com/decentraland/sites/security/advisories)
(once an advisory has been published with the reporter's consent). Decentraland
does not currently run a paid bug bounty program; recognition is by attribution
and, where applicable, swag.

## Revision History

- **1.1 (2026-05-14):** add GitHub private advisory channel, clarify
  disclosure timeline, expand out-of-scope list, link to disclose.io,
  add CFAA safe-harbor language, document published-artifact scope.
- **1.0:** initial policy.
