# Provenance and technical sources

Written for this candidate from the user's setup/brand/edit/revision/export requirements, inspected candidate code and the official references below. No excluded editing skill, third-party example, component or storyboard template was used as an authoring source. Similar task names are user requirements, not evidence of implementation. No public licence is chosen by this document.

## Reuse decisions

- scripts/studio-state.mjs and scripts/studio.mjs: inspected completely. Their project authoring record in this conversation predates this skill; the generic helpers were written for local progress, folder creation and approval bookkeeping, not taken from the downloaded editing package. Candidate-manifest hashes identify the inspected copies. Reused by reference, not duplicated into a new system.

This phase makes a small candidate-only routing change: an explicit brand/onboarding mention precedes generic setup matching, and “smaller” is recognized as a revision hint. The five requested example intents are tested. This remains a limited keyword helper; the coding agent must interpret negation/mixed requests and never infer approval from a match.
- src/Root.tsx and src/index.ts: inspected neutral candidate readiness screen and entry; original candidate construction is documented in the authoring record. It contains no media, brand assets or third-party template component. Reused only as the known preview entry.
- docs/briefs/TEMPLATE.md and brand/BRAND.md: inspected candidate placeholders. Fields represent current user requirements. The skill points at these existing recipient records; it does not reuse the personal brand or an external storyboard.
- Existing candidate docs/workflow.md and earlier adapted project documents: not used as text to derive this skill. A previous “independently authored” label alone is insufficient provenance. Skill instructions/supporting notes were written afresh from the present brief and the inspected command interfaces. Existing docs remain background candidate instructions, not evidence that missing features work.
- Node built-ins and dependency API calls are not copies of their implementation. No dependency, font, image, sound, model or excluded skill source is embedded in the skill. Tool documentation links are technical references, not an assertion of redistribution rights over upstream assets.

The authoring record plus inspected code/interfaces supports these limited reuse decisions; a string scan or absence of copyright headers alone cannot prove authorship. Public licensing and transitive dependency questions in docs/RIGHTS.md remain open. The new skill does not establish clean-room legal certification or remove those release gates.

## Official references checked 2026-11-16

- [Codex skill location and format](https://developers.openai.com/codex/skills): repository .agents/skills, SKILL.md with name/description; optional references. No agents/openai.yaml or plugin installation is needed for this project-scoped test. Open the candidate as its own folder outside another repository for a clean discovery test; parent/user skills may otherwise be visible. Do not use them to fill candidate gaps.
- [Remotion frame-based animation](https://www.remotion.dev/docs/animating-properties), [local public assets](https://www.remotion.dev/docs/staticfile), [video component](https://www.remotion.dev/docs/offthreadvideo), [Caption type](https://www.remotion.dev/docs/captions/caption), [render CLI](https://www.remotion.dev/docs/cli/render).
- [FFprobe](https://ffmpeg.org/ffprobe.html) for metadata/JSON and [FFmpeg](https://ffmpeg.org/ffmpeg.html#Main-options) for source-section/audio options.

Online docs may advance beyond pinned Remotion 4.0.542. Confirm any new API/option against installed types/help before implementation. This skill adds coordination, not a downloaded engine or prebuilt editor.

Implementation update 2026-11-17: original editor/brand/graphics/effects/caption components, engine integration, review helper, export gate and bootstrap/release scripts were authored in this candidate from user requirements and official APIs, without copying excluded code or personal media. whisper.cpp v1.9.2 was selected because it supplies official CPU Windows assets; the v1.9.5 tag supplied no binaries. Model source/checksum: https://github.com/ggml-org/whisper.cpp/blob/v1.9.5/models/README.md ; actual raw model/engine output remains .local or private video data and is never release input. No new public licence is chosen.
