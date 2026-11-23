# AI Video Studio — maintained implementation, private development

Proposed terms: free use and customization, commercial video work and free
sharing are allowed; resale of the starter or paid access to it as a software
product requires permission. See [the licensing summary](docs/LICENSING.md) and
[draft licence](LICENSE.md). This is a custom source-available licence, not an
open-source licence. Wording and public release remain unapproved; third-party
components keep their own terms.

## Intended recipient delivery: one prompt, no manual ZIP

Open an empty writable folder in Codex and paste the prompt in [BOOTSTRAP-PROMPT.md](BOOTSTRAP-PROMPT.md). It will retrieve a specific maintained release, verify hashes, install locked dependencies, run checks and start guided brand onboarding. The public release URL/version/hash are clearly marked placeholders: there is no working public download yet. Do not replace them with guesses. The agent must not generate a replacement editor.

Windows x64 with Node/npm and FFmpeg/ffprobe is the current target. The agent checks prerequisites and explains installation/permission steps that cannot be automated safely. A coding agent can require a subscription, Remotion licensing has eligibility conditions, and browser/model downloads need internet/storage. No paid API or media upload is required. Requested English captions/take cleanup use a ~142 MiB recognition model, ~95 MB acoustic model and a separate local CPU runtime; no GPU or Python setup. Downloads are handled by the agent, not by asking you to manage model files. Listening review is still necessary.

## Permissions: set the project up once

Keep this studio folder open as the active Codex project with workspace-write access. Merely changing the terminal folder is insufficient. If a local test copy was created elsewhere, open that copy as its own project once; otherwise normal edits can keep triggering Allow prompts. The agent checks this boundary and follows the [low-friction workflow](.agents/skills/ai-video-studio/references/permission-workflow.md).

“Edit this video” authorizes the ordinary work needed for a draft, including captions, graphics, zooms, checks and preview renders. You should not be asked again for each step. Installation/network/protected-file requests may still trigger Codex controls. Where available, the permissions menu below the composer offers Approve for me for eligible automatic review; it retains the sandbox and is optional. No global settings are changed by this starter. Brand review and approval before final export are creative decisions, not repeated technical permission requests.

## What you do after bootstrap

First, the agent asks whether you have a website or brand materials—or want simple defaults. No display-name, audience or tone questionnaire is required.

Next, a separate question invites you to attach 1–3 videos whose editing style you like. Tell the agent what you like, or ask it to help identify the style. References are optional. Where this conversation exposes readable original files, attach them here; otherwise provide a full local path and the agent imports them. Files from another chat are not automatically accessible.

After analyzing the references, the agent aims to closely match their text/caption styling, placement and layout using your brand choices. It shows a representative motion preview and clearly identifies font/motion approximations. Request changes naturally. Once you approve it, the agent immediately asks you to attach the first video you want edited. You do not organize folders or supply a filename before attaching.

Before rendering the first draft, one short question box asks what you want: an optional opening on-screen hook, target length and any editing instructions. Write naturally or choose sensible defaults. If you already gave these instructions, the agent saves them without asking again. It manages the brief and editing commands internally. The host may use a chat question when no question-box tool is available.

For an uncut recording, say “remove the bad takes and false starts.” The agent inspects the full recording, selects takes and produces a reviewable captioned edit with a removal summary. Original media is retained, uncertain choices are flagged and you can ask to put material back.

Open the actual preview URL the agent provides and listen/watch. Ask naturally: “Make the title smaller and remove that zoom.” Review the revision, then say “I approve this current version; export it.” The agent performs technical checks and gives the MP4 path. Automatic wording/timing can be wrong, so listening/readability approval matters. Nothing is published automatically.

If preview stops, ask “restart preview”. The agent runs node scripts/studio.mjs preview in the installed project and gives the newly verified URL; the port may change. The printed restart command works from that same project folder. If setup fails, say “resume setup” and include the error. Bootstrap resumes the same version without overwriting unrelated/changed files.

## Internal development only

Until a public release exists, maintainers open this candidate folder and invoke $ai-video-studio using its local [skill](.agents/skills/ai-video-studio/SKILL.md). No third-party editing skill is required. The agent, not the recipient, runs development checks. [Rights](docs/RIGHTS.md), final licence wording/publication approval and clean-machine validation remain release gates. The owner's free-use/no-resale policy is recorded in the draft; it is not MIT or a completed legal review.
# Optional script

If you used a script, attach or paste it alongside your footage. Rough wording is fine: natural paraphrases should stay natural. Codex manages the files. Scripts help compare intended points and alternate takes; they do not supply reliable speech timestamps. Unscripted videos remain supported without one.

