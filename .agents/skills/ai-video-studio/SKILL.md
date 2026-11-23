---
name: ai-video-studio
description: Guide this starter project's local setup, brand onboarding, footage edits, plain-language revisions and approved exports. Use for requests such as set up my video studio, help with my brand, edit this video, change this draft or export the approved version.
---

# AI Video Studio

Operate from the folder containing this candidate's package.json. Read its AGENTS.md and brand/BRAND.md. Keep the recipient's files and decisions intact. Do not require a second skill or an existing developer installation.

First inspect [the capability register](references/capabilities.md). It distinguishes executable helpers from features the agent would still have to build. Do not present a planned feature as a working one.

Follow [low-friction project work](references/permission-workflow.md): verify the active writable project once; do already authorized editing/draft work without asking permission per command. System security approvals and creative/final-export approvals are separate.

Use [short guided conversation](references/conversation.md) for the exact stage sequence, attachment invitations and first-draft brief. No required display-name/audience/tone questionnaire; immediately invite footage after style approval.

## Choose the next step

Read local progress with `node scripts/studio.mjs status`. Interpret the conversation, not just the keyword hint; negated requests are not authorization. Resume the earliest missing prerequisite without repeating answered questions.

- **Setup or brand:** follow [onboarding](references/onboarding.md). Ask a short question only when its answer changes the next action. For supplied references, use [close reference matching](references/reference-matching.md); the preview must reflect measured typography/captions/layout, with explicit deviations. Optional branding material is not a prerequisite for a simple draft. A brand preview and approval must refer to actual displayed choices, not a generic readiness screen.
- **New footage:** use `node scripts/studio.mjs new-video <id>` and maintain the created brief from conversation. Follow [automatic media import](references/intake.md): use readable attachment originals when verified, otherwise import a supplied local path. Manage folders internally; never assume another chat’s files. Inspect media using [media and timing](references/media.md). If transcription is requested, use the maintained local pipeline and explain its model download and alignment limitations.
- **Captions or take cleanup:** first run `studio prepare-speech` as described in [media and timing](references/media.md), then follow [take cleanup](references/take-cleanup.md) when requested. Preserve full sentences and use guarded cuts. Do not bypass acoustic/caption checks or fall back to phrase estimates to get a render.
- **Editing or revision:** use [editing and review](references/editing.md). Let the user describe the result in everyday language. Translate that into the maintained editing commands, preserving audio and important framing. A revision invalidates the current export approval.
- **Preview or export:** use the candidate's own Remotion commands described in editing and review. Verify the actual server URL. Final export waits for explicit approval of the identified current draft; tests or a graphic-only approval do not supply it.

Keep the brief current, state which checks ran, and identify blockers and unverified playback/listening. Do not upload media, obtain optional assets/tools or invent product evidence. This skill coordinates a coding agent; it orchestrates the maintained local implementations and must not claim model alignment or untested capabilities.

Authorship and official technical sources: [provenance](references/provenance.md). Use only the branch relevant to the user's present request.
