# Maintainer test plan — not recipient technical homework

The coding agent/developer runs all commands, metadata checks and failure diagnosis. A recipient only supplies intent/assets and normal visual/listening approval. Do not ask a beginner to complete technical test exercises. Record failures instead of claiming setup worked.

Focused next test: in a separate Windows folder outside any parent repository, invoke $ai-video-studio from START-HERE. Complete setup and a simple approved brand preview, supply one personally owned 5–10 second clip, request a title-only draft without optional transcription/audio assets, preview it, say “make the title smaller”, then approve that revised draft and export. The agent must explicitly implement the missing preview/edit composition, not claim it was supplied by the skill. Record missing commands, unavailable tools and misleading capability claims as failures. Run with no excluded skills or personal project files available.

Machine/OS, Node/npm versions, RAM/disk, agent/version, date, install permissions:

1. On a clean Windows 11 computer, copy this candidate, open its folder and paste START-HERE's prompt. Does the agent find it and identify missing software clearly? Record every manual/install step and confusing phrase.
2. Complete brand onboarding with separate materials/reference questions and simple defaults, with no optional logo/music/references. Check summary approval and resume once after closing the chat; no repeated completed questions or inherited approvals.
3. Attach one personally owned 5–15 second clip (or supply an accessible full local path). Check that a short optional hook/length/instructions question precedes the first draft. Give a natural-language goal. Check automatic folder/brief creation and a simple draft without optional captions/assets blocking it.
4. Open the actual preview URL, listen and inspect; restart it with the supplied command. Ask one revision, e.g. smaller title. Check the same project/brief updates and prior export approval is invalidated.
5. Request export before approval: agent should ask approval. Approve the identified current draft, export and play the MP4. Verify metadata/audio/frame checks, report any unverified sync.

For each step record Pass/Fail/Blocked, exact error, what you expected, what was confusing and help required. Do not claim a clean-machine pass from developer-machine isolation checks. No new feature should be added just to conceal a failed test.
# Maintainer speech-quality regression

Before another recipient trial, run check:speech-quality, check:alignment, check:cleanup and check:editing. The real render/cleanup commands must reject unaligned phrase estimates before producing files. A failed customer draft exposed cut-off sentences and per-phrase font shrinking despite numeric timing checks; the connected prepare-speech command, acoustic boundary guards and fixed-font measured grouping address those implementation paths. Retained text must include unique instructions once and complete sentences. Inspect real rendered frames at onset/joins/end, compare audio mapping and verify project-owned preview URLs. Record actual listening as unassessed when unavailable; one clip and synthetic checks do not establish future recognition/editing reliability. These are agent-run development checks, not exercises for a beginner.

