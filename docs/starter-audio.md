# Bundled sound location

Only `public/audio/starter-pack` may contain supplied giveaway sound effects. The included catalogue.json lists exactly the sounds accepted into this candidate; it now contains four maintainer-approved CC0 sounds. Do not collect all of public/audio or treat personal sounds as starter assets. Recipient-added private sounds do not acquire redistribution rights through this project.

Before including a sound, the package maintainer must verify permission to redistribute that actual audio file, retain asset-specific licence evidence, and obtain the user's approval of the sound. A commercial video-use licence is not necessarily a standalone redistribution licence. A link to CC0 terms is not proof of an asset's CC0 designation. Include required notices/attribution with the audio, and recheck when the file changes.

Keep original filenames and the package path. A later authorized composition references a bundled item as staticFile('audio/starter-pack/<filename>'); do not add public/ to that argument. No audio component or mandatory cue is installed by this policy. Use any accepted sound sparingly, preserving clear speech and checking the actual mix by listening.

The source project packaging process selects only catalogue-approved sounds/evidence by file hash, never an entire audio directory. Rights and sound approval are separate gates. This candidate retains no source project's personal sound catalogue, approvals or sound files. No public licence is chosen for the project itself by this sound policy.

## Included choices

- pop.mp3 — Bubble_Pop by arttim: a small callout or single confirmation.
- mouse click.wav — Mouse Click by HunteR4708: an intentional product UI click.
- keyboard.wav — Keyboard typing by vllyrl: actual typing activity, not a continuous speech bed.
- whoosh.wav — Swish Swipe Short by Qvantor: an occasional swipe/panel move.

Run node scripts/studio.mjs sounds for the local selection list; the agent handles this, not the recipient. Use studio sound <id> --file "mouse click.wav" --start <seconds> only when useful. No download or cataloguing is required. Defaults use conservative recommended per-file gains, adjustable for the real mix. Originals are not normalized or altered; keyboard peaks round to 0 dBFS, so preserve headroom. All are CC0 1.0; attribution optional. Source/evidence and maintainer approval are recorded in the packaged catalogue. Download dates unknown; assistant listening not performed.
