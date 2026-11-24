# Working edit/review/export commands

Follow [low-friction project work](permission-workflow.md). An edit/revision request authorizes in-scope captions, overlays, effects, checks and review renders. Do the work, then present the draft for creative review; do not ask permission for each command. Preserve final-export approval.

The agent translates natural language into maintained commands; the user need not learn flags or frames. Registry: src/studio.json; brand rules: brand/BRAND.md; private brief: docs/briefs/<id>.local.md. Keep sections and source audio intact unless explicitly requested.

- studio intake <id> --source <public-relative file> --title "Title" --duration 15 registers Video-<id>.
- studio prepare-speech <id> --language en performs recognition, acoustic word alignment and import before captions/cuts. Missing dependencies require the disclosed --setup true path. Render/cleanup reject unaligned phrase estimates. Do not bypass the guard with raw CLI. Captions keep the configured font/weight/placement and split groups to fit measured width; they never shrink each phrase independently.
- studio set <id> --title-size .05 --remove-effect all makes a smaller title and removes zoom/effects. --title, --captions true/false, --highlight true/false and named remove-graphic/remove-sound are supported. Every change clears approval.
- studio effect <id> --kind zoom --name detail --start 2 --end 4 --amount .04 adds restrained frame-driven zoom; pan/fade are also implemented. No mandatory movement, face crop or unsupported subject tracking.
- studio graphic <id> --kind callout/steps/screenshot --name <id> --text "Supplied point" --start <seconds> --end <seconds>; --steps "One|Two" or --asset <real image path> as appropriate. Keep content factual and inspect placement. No invented actual UI/claims. The agent chooses timing and describes what appears, which spoken point it supports and uploaded versus created graphics for Approve/Request changes. Removing an identified graphic/effect preserves underlying footage.
- studio sound <id> --file <approved starter filename> --start <seconds> --volume .15 uses only the starter-pack catalogue with both rights/approval gates and matching hash. Empty pack is fine. No automatic music, personal sounds or finished-mix claim.

Run studio preview Video-<id> (or BrandPreview) to start the existing Studio on an available port, HTTP-check the actual URL and print a restart command. No reliance on another project/server. The terminal stays open. studio draft <id> renders a versioned playable MP4 without pretending it is approved. The agent runs technical checks, metadata/frame inspection and listening where available; distinguish those forms of evidence.
Preview checks TCP listeners on IPv4/IPv6 and the project cwd reported by the pinned Remotion version's own Studio detection endpoint. An unrelated Studio must not satisfy readiness. Recheck this integration when upgrading Remotion.

After revisions and actual user approval, studio approve-video <id> --note "actual approval of current draft" stores revision and a fingerprint covering source/asset bytes, brand, video data and source code. studio export <id> refuses stale/unapproved state, renders H.264/yuv420p/30fps with concurrency 1 and conservative decoder limits, probes metadata/audio and keeps existing exports. Brand approval must match current choices. Raw CLI is not an alternate way to bypass approval.

The maintained components are Effects.tsx, Captions.tsx, Graphics.tsx, BrandPreview.tsx and EditedVideo.tsx. No arbitrary multi-track timeline, cross-clip transition editor or model alignment certificate is claimed. Rights and clean-machine release gates remain; do not publish automatically.

The current default pack includes pop.mp3, mouse click.wav, keyboard.wav and whoosh.wav. Use studio sounds to inspect intended uses and conservative starting volumes; they are already local and verified/approved. No recipient download or new catalogue task is required. Do not auto-fill every cut or obscure speech; any final mix still needs listening and level checks.

## Source quality

Cleanup records original-source keep ranges; it no longer encodes a video/audio
intermediate. SourceFootage plays each range with frame-based Sequence timing and
source trim, while effects/captions stay on the edited global timeline. Existing
legacy cleanup files remain preserved; their compressed editedSource is not used
for footage playback. New apply/restore still binds original media/transcript/plan
hashes. Never replace original footage with a draft or social-media download.

Draft/final exports use PNG capture, H.264 CRF16/medium, yuv420p, bt709, AAC320k,
concurrency1 and conservative decoder limits. MP4 is lossy; no zero-loss promise.
The original-resolution caps/no-upscale default remain. The renderer saves a
quality report and warns about low-resolution footage, enlargement and fallback
transcodes; it rejects known HDR transfers pending explicit colour handling.
Compatibility conversion remains opt-in for demonstrated decoder failures and
is not a default quality step. It cannot silently replace original cleanup media.
Inspect matching original/export frames (clear of overlays) and source-mapped
audio around joins; metadata/bitrate alone does not prove visual/listening quality.
A 320x568 input stays low-detail even if enlarged to1080p. Offer the original
camera file when available; missing higher-resolution media does not block a draft.
