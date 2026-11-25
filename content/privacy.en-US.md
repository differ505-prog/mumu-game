# Privacy Policy and Children's Privacy Notice

**Scope:** Santa's Little Helper (木木遊戲) and all of its versions
**Effective date:** January 1, 2026
**Contact:** privacy@mumu-game.app

---

## 1. Our Principles

This app is designed for **children aged 3–6 and their parents**. We built it around one idea: **data minimisation**.

- We do **not** collect names, email addresses, phone numbers, street addresses, precise location, government identifiers, or any data that could directly identify a person.
- We do **not** perform behavioural advertising and do **not** integrate third-party advertising identifiers (such as IDFA or GAID). We do **not** share data with advertising networks.
- We do **not** ask children to register, enter real names, or use an email address.
- All learning progress data (level stars, skill mastery, encyclopedia unlocks) is stored **only on your device's browser** and is never uploaded to our servers unless you explicitly agree below.

## 2. What We Collect and Why

| Data type | Content | Purpose | Identifiable? |
| --- | --- | --- | --- |
| Learning progress | Completed levels, stars, skill mastery, unlocked dinosaurs | Generate the parent report, adjust difficulty, unlock encyclopedia entries | No |
| Learning samples | Skill axis, correct/incorrect, locale per answer | Evaluate encyclopedia unlock conditions and compute mastery | No |
| Assessment responses | Scale, item id, correctness, reaction time | Validate the effectiveness of phonological-awareness training | No |
| Anonymous usage statistics | Event name and parameters (level id, chapter, correctness) | Improve the product and validate retention | No |
| Referral code | 8-character code and its install attribution | Compute K-factor and referral effectiveness | No |
| Subscription interest | Plan type and amount | Validate pricing options | No |
| Consent state | Analytics / personalization / marketing flags and update time | Honour opt-in consent | No |

**Data minimisation measures:** telemetry records only the UTC date (never a precise timestamp) and automatically strips any field named email, name, ip, deviceId, userId, phone, or address.

## 3. Retention

| Data type | Retention period |
| --- | --- |
| Learning progress on device | Until you clear browser data or uninstall |
| Anonymous usage statistics | Raw events are rolled up and deleted after 90 days |
| De-identified assessment responses | 24 months, for academic or product analysis |
| Subscription interest records | 180 days, rolling |

You can delete every record on your device at any time via **Settings → Privacy consent → Delete all data**.

## 4. Sharing and Third Parties

We do **not** sell personal data and we do **not** share identifiable information. We use third-party services only in the following cases:

- **Cloudflare Pages** (static hosting): receives only an IP address and the request path for delivery and DDoS protection. It never receives teaching records.
- **Apple App Store / Google Play**: purchase and subscription management is handled by the platform store; we receive only the platform's transaction receipt and plan type.

All third-party services are located in **Taiwan and the United States**. We do **not** transfer children's data across borders to the EU or mainland China.

## 5. Your Rights as a Parent

Under Taiwan's Personal Data Protection Act (Articles 3 and 9), parents acting as legal guardians have the following rights over their children's data:

1. **Right of access** — view complete learning data under **Parent Report**.
2. **Right of rectification** — correct records by clearing the data and starting again.
3. **Right to erasure** — delete everything with one tap under **Delete all data**.
4. **Right to withdraw consent** — each of the three consent toggles (analytics / personalization / marketing) can be revoked independently, effective immediately.
5. **Right to stop collection** — once analytics consent is off, the app generates no telemetry events at all.

## 6. Consent Management

This app uses **opt-in** consent:

- On first launch, all three consent options are **off by default**.
- Each option can be **turned on or revoked independently**, and revocation takes effect immediately.
- While analytics consent is off, telemetry events are stored only in a local on-device queue (so you can inspect them) and are **never sent anywhere**.
- While personalization consent is off, difficulty adaptation uses only on-device mastery data and never affects core learning features.
- While marketing consent is off, the app sends no push notifications or marketing messages.

## 7. COPPA 2025 Amendments

The United States' amended Children's Online Privacy Protection Act (COPPA 2025) took effect on **April 22, 2026**. Its core changes include:

1. **Separate verifiable parental consent**: serving targeted advertising to children under 13 requires separate, verifiable parental consent plus the child's own confirmable authorization. This app **never** serves child-directed targeted advertising, so this requirement does not apply.
2. **Notice obligations for material changes**: when data purposes change we must obtain fresh consent. This app re-displays the consent screen whenever the consent items change.
3. **Security program requirements**: services handling children's data must use verifiable security practices. This app uses opt-in consent, data minimisation, on-device storage, and one-tap erasure, which align with that direction.

**What this app actually does:** `canTargetedAdvertise()` always returns `false`, blocking the targeted-advertising path at the code level rather than only in policy text.

## 8. Information Security

- On-device data is stored in `localStorage`; every read and write is wrapped in try/catch, so a storage failure never interrupts play.
- The Service Worker caches same-origin static assets only and injects no third-party scripts.
- The project has no external fonts and no CDN dependencies (the previous `fonts.googleapis.com` reference was removed) to reduce supply-chain risk.
- All SVG icons and character artwork are self-drawn, so there is no third-party licensing exposure.

## 9. Changes to This Policy

When this policy changes we update the "effective date" above and prompt parents to reconfirm the consent items on the app's first screen. If a change affects the purposes or categories of data collected, we stop the affected processing first and only resume it once fresh consent has been obtained.

## 10. Contact Us

If you have any questions about this policy or about your child's data, please contact us:

- Email: privacy@mumu-game.app
- Office hours: Monday to Friday, 10:00–18:00 (Taiwan time)

We reply within 7 business days.
