# Agent-managed media intake

Explicitly offer optional website/brand materials and 1–3 style references before style approval; request essential raw footage when editing. Resume previously answered questions. Ask which files are references versus footage only when ambiguous. Ask what the user likes, offering help identifying the style. Retain all analysis/motion-review/approval requirements in onboarding.md.

Check [project access](permission-workflow.md) once. Supplied-media import within the active project is part of an authorized edit, not a new permission question. Original files outside the workspace may still require narrowly scoped read access under the actual platform policy.

## Access first, organization internal

If a video attached to THIS conversation exposes an original-file path or a documented retrieval tool, verify readable bytes and probe its video stream before claiming file access. Then ask users to attach videos directly in this verified environment. A thumbnail, filename, attachment chip, browser playback or description alone does not establish original-file access. Do not search unrelated chats or private application caches. Do not assume an attachment URL can be downloaded with available credentials. No video attachment was provided in the current Windows test; direct attachment original-file delivery remains unverified, not proven unsupported.

Where original access is absent, blocked or unverified, explain this plainly and ask for the full local file path instead: “Give me the full path to the video on this computer; I’ll import it and manage the folders.” A Windows user can right-click a file in Explorer, choose Copy as path and paste it. Handle the surrounding quotation marks when forming tool arguments. This is the normal verified fallback, not a request to copy/organize project files. If the path belongs to a different machine, explain that local execution cannot read it; discuss the available transfer mechanism before proceeding. A permission denial is not missing software. Do not make a separate upload application or upload media to a service.

The agent chooses a video ID, then runs:

    node scripts/studio.mjs import-media --role footage --video <id> --source <readable original absolute path>
    node scripts/studio.mjs import-media --role reference --source <readable original absolute path>
    node scripts/studio.mjs import-media --role brand --source <readable original absolute path>

Use --origin accessible-attachment only when the path actually came from a readable original attachment; this label is provenance, not a transport implementation. Default is local-path. Preserve originals. The helper copies exact bytes with a stable sanitized/hash filename, refuses collisions, records role/origin/hash/metadata in ignored .local/media-imports.json and updates the footage brief/state without resetting approvals. It does not register an edit or invalidate approval merely by adding an unused file. Use its returned asset for studio intake or reference analysis. Folder selection, naming, JSON and briefs are agent work. Missing optional references/materials do not block a polished default.

## Access is not perception

Report separately: original bytes readable; ffprobe metadata; sampled frames inspected; motion playback assessed; audio actually heard. FFmpeg decoding, waveform/level checks and transcription are not listening. Frame sampling is not continuous motion review. Use available tools for each, clearly marking unavailable assessments. Import alone must never be reported as watching/hearing the video. Keep analysis observations/time ranges/method distinct from proposed reusable style. No creator branding/content copying or reference sound extraction.

## Current verification record

On 2026-11-17 in local Windows Codex: available tool inventory supplied filesystem/shell/FFmpeg access but no general video-attachment retrieval tool; this chat's list_artifacts returned an empty list. That list is not a complete composer capability test. No actual video attachment was supplied, so accepting it in the composer, resolving its original, persistence and byte identity remain untested. The official Codex feature page checked did not establish this exact attachment-to-original behavior. Do not infer rejection from this absence. Local import is tested with an actual synthetic MP4; original preservation, role separation, idempotent naming, brief updates and collision/error handling are checked by npm.cmd run check:import. No claim of attachment watching/hearing is made. A later real attachment can upgrade this evidence after successful probing/import; a path fallback should not require another onboarding reset.
