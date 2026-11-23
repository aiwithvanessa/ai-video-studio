# AI Video Studio starter test

The owner selected the custom free-use/no-resale policy in [LICENSE.md](LICENSE.md),
with [plain-language guidance](docs/LICENSING.md). It is draft wording for review,
not MIT/open source or approval to publish. Preserve third-party terms and CC0
asset permissions; apply restrictions only to original covered material. Do not
invent legal review, change the named licensor or remove draft status silently.

Follow [low-friction permissions](.agents/skills/ai-video-studio/references/permission-workflow.md) before setup/editing. A user edit request authorizes normal in-scope implementation and draft rendering. Use default sandbox permissions inside the active project; do not request repeated consent for captions, effects, briefs or checks. Fix a workspace mismatch once rather than escalating every edit. Brand/current-final-export review remains separate from system Allow dialogs.

Bundled sound effects may come only from public/audio/starter-pack and its filtered catalogue.json. Follow [starter audio policy](docs/starter-audio.md); no broad public/audio copying or personal-sound inclusion. Retain the path, actual redistribution evidence and separate sound approval. Empty catalogue means no bundled sounds, not permission to find replacements.

Use the original project skill [ai-video-studio](.agents/skills/ai-video-studio/SKILL.md) for setup, brand onboarding, edit, revision and export conversations. Its capability register is authoritative about what is implemented versus agent work still needed. It uses only candidate-local helpers and official technical references; do not fill gaps with another workspace's skill or assets.

Read START-HERE.md and docs/workflow.md. This is a local Windows 11 test candidate, not a released product. Work in this folder only. Use npm.cmd in PowerShell. Never assume software, files or attachments from another chat exist. Inspect before editing; preserve existing files.

Supplied references should be imitated closely in typography, captions and layout, subject to explicit brand/user choices. Follow the skill’s reference-matching review; generic previews are only for users without references. Do not copy creator content/branding or claim unassessed motion/audio.

Follow the skill’s [short guided conversation](.agents/skills/ai-video-studio/references/conversation.md): no required name/audience/tone questionnaire, separate reference invitation, immediate post-style footage invitation, and a short optional hook/length/instructions question before the first draft.

Use scripts/studio-state.mjs and .local/studio-state.json for setup/brand/video progress. Missing state means fresh, not approved. Never inherit approvals. Resume missing steps. Optional logos/music/fonts/references/captions do not block a basic draft. Maintain private briefs from the conversation and create per-video folders with the existing helper. Brand rules live in brand/BRAND.md. Recognize setup, brand, edit, revision and export in context; keyword hints are not permission.

Use Remotion 4.0.542, React/TypeScript and frame-driven timing, staticFile for local public assets and contain sizing unless a crop is justified/approved. Keep shared reusable components in src/components and compositions in src/compositions when needed, content through props. Do not build another editor. Local CPU transcription/caption/editing implementations are now supplied; engine/model downloads remain recipient-local and permission-aware. Never fabricate timestamps. No third-party editing skill is bundled or required.

Wait for explicit approval of the current identified draft before final export; revisions clear approval. Preview and export verification must distinguish HTTP, frame inspection, playback and listening. Use concurrency 1, H.264/yuv420p; captioned renders use one extraction thread and 128 MiB decoded cache. Do not install globally/change settings or upload media silently. Report missing software versus PATH/permissions. Do not claim clean-machine support from local checks.

Use the maintained studio commands/components in the capability register instead of regenerating the editor for each recipient. Future empty-folder delivery uses BOOTSTRAP-PROMPT.md and a verified pinned release. Public URL placeholders are not functioning downloads. The agent runs technical checks; the user supplies intent/assets, reviews playback and approves choices.

Brand approval includes the explicit optional materials/reference offer and current motion-style review described in the onboarding reference. Preserve identity approvals when resuming a missing style step; do not infer that references were declined.

Use the skill’s automatic media import instructions for references, brand materials and footage. Attachment originals must be readable before claiming support; otherwise ask for a full local path and import it automatically. Users do not maintain project folders. File access, frame inspection, motion playback and listening are distinct evidence.

For requested bad-take cleanup follow the skill’s take-cleanup reference: inspect the full section, preserve originals, select/report takes, use bound reversible cut plans and mapped captions, and require draft review before final export. No blanket filler/repetition deletion or fabricated word timing.

Offer an optional script with editing intake (attach/paste; natural paraphrases allowed). Use the skill’s script-assisted review and script-import/script-analyze helpers. Scripts guide intended points and alternate-take review; they are not proof of spoken wording or alignment. Check the full retained transcript for repeated instructions and incomplete sentences before rendering. Keep rejected-draft feedback and recognition/timing limitations visible.

Captioned speech edits use `studio prepare-speech <id> --language en --setup true` (setup true only when dependencies are needed; disclose downloads once). It executes base.en recognition, acoustic word alignment, validation and import, reusing current valid results. Cleanup and caption rendering enforce alignment; raw/phrase outputs are diagnostic data, not a fallback for publishing a draft. Never bypass these guards through raw Remotion CLI or weaken them to complete a render. If preparation fails, preserve source and report the blocker or provide an explicitly uncaptioned, uncut preview. Keep approved caption font/placement stable: split groups to fit; do not resize each phrase. Alignment currently supports English and still needs actual listening review.
