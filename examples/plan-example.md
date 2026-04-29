# Push notifications for the mobile onboarding flow

## Context
We are launching push notifications to drive day-1 retention in the React Native app. The onboarding screen must collect explicit consent before requesting OS permission, per current legal review.

## Requirements
- New consent screen before push permission prompt
- Consent must be auditable (user_id + timestamp + version)
- iOS and Android parity
- Telemetry: emit `push_consent_granted` / `push_consent_denied` events

## Open questions
- Should denial gate the next onboarding step, or just skip the permission prompt?
- Backend endpoint for consent storage already exists at `/users/:id/consents` — confirmed.

## Existing tasks (from product spike)
### Task: Build consent screen UI
Mock is in Figma. Should match the existing onboarding visual language.

#### Acceptance criteria
- Screen renders on iOS 16+ and Android 10+
- Two CTAs: "Allow" / "Skip for now"
- Localized copy in en, pl

### Task: Wire consent submission to backend
POST to /users/:id/consents with the consent record.
