# Implemented capability register

| Capability | Maintained implementation | Remaining limits |
|---|---|---|
| Versioned bootstrap | scripts/bootstrap.mjs, scripts/build-release.mjs, BOOTSTRAP-PROMPT.md | Public URL/hash are placeholders; only private local tests can be claimed. Windows x64 target; no automatic global tool installs. |
| Workspace/permission preflight | scripts/check-workspace.mjs; permission-workflow.md | Compares actual declared roots supplied by the agent; no permissions are granted, UI prompts cannot be simulated or guaranteed absent. |
| Setup/state/resume | scripts/studio.mjs and studio-state.mjs | Tool availability is not a render guarantee; Codex interprets context, not just keyword hints. |
| Reference styling | ReferenceStylePreview.tsx; captionAppearance measurements; style-plan referenceMatch | Presenter/stacked/graphic demonstrations, shared caption styling; no automatic font identification, similarity scoring, subject masking or general scene editor. |
| Brand preview/approval | studio brand / approve-brand; src/compositions/BrandPreview.tsx; src/studio.json | Website/asset interpretation is agent-led; preview still needs user judgement. |
| Optional reference intake/style review | studio reference-intake / style-plan; onboarding.md; eight-second BrandPreview | Agent inspects accessible media; silent illustrative motion is not proof of actual framing or a finished audio mix. No automatic reference-style analyzer. |
| Automatic local media import | studio import-media; scripts/import-media.mjs | Readable originals required; attachment transport unverified in current chat. Hash-checked copy, role ledger, automatic naming and footage brief. No upload UI. |
| Conversation stages/brief | studio next-question / onboarding-answer / brief; conversation.mjs | One-stage prompts, attachment invitation and persisted brief; actual question-box UI depends on the host. New videos require brief before first draft. |
| Intake/brief | studio new-video / intake; editor.mjs videoMetadata | Single source/section per video; keeps proportions, original audio, capped even dimensions. |
| Prepared speech | studio prepare-speech; prepare-speech.mjs, transcribe.mjs, align-transcript.mjs | Connected recognition/acoustic word alignment/import with resumable receipt and source/audio hashes. English only; local CPU downloads and listening review required. |
| Take cleanup | cleanup-analyze / cleanup-apply / cleanup-restore / take-review; speech-quality.mjs, take-review.mjs | Rejects unaligned timing, word intersections, tight context, incomplete kept sentences and low-confidence boundary words. Renderer blocks unresolved/stale repetition review. Semantic take choice and listening remain agent/user work; guards are rejection rules, not a quality guarantee. |
| Optional script assistance | studio script-import / script-analyze; script-assist.mjs | Separate hash-bound intended script; read-only lexical candidate/repeat reports. Agent must assess paraphrases and complete takes. No forced alignment or automatic best-take guarantee. |
| Timing/review | src/lib/timing.mjs, review-transcript.mjs, studio transcript; optional align-transcript.mjs + ctc-align.mjs | English CPU acoustic alignment is implemented with separate runtime/model downloads, confidence warnings and immutable output. It cannot recover omitted words; structural validity/model scores do not prove listening synchronization. |
| Captions | Captions.tsx; caption-layout.mjs | Fixed configured font and measured width grouping at actual word boundaries, one/two lines and stable highlight layout. Unaligned drafts blocked. No automatic spelling/listening correctness guarantee. |
| Graphics | src/components/Graphics.tsx; studio graphic | Callouts/headings/steps/real screenshot cards; agent must choose actual content/placement and inspect faces/captions. |
| Zoom/pan/fade | src/components/Effects.tsx; studio effect | Restrained amounts, frame-driven; no arbitrary multi-clip transition timeline or subject tracking. |
| Footage composition | src/compositions/EditedVideo.tsx, Root registry | Single-source local draft, title and original sound; no cloud editor/dashboard. |
| Approved sounds | studio sound and validateVideo; starter-pack catalogue/hash checks | Pack can be empty; no personal audio, automatic music or finished mix guarantee. |
| Preview/revision | studio preview / set / effect / graphic; revise state helper | Codex maps natural language to commands; HTTP is not listening proof. |
| Draft/final MP4 | studio draft / approve-video / export; editor.mjs renderVideo | Final wrapper enforces brand/revision/content fingerprint; metadata/audio checks are automatic, visual/listening review separate. |
| Checks | check, check:skill, check:editing, check:bootstrap | Synthetic/local-development evidence does not prove clean-machine or future-clip reliability. |

The agent uses these implementations instead of asking a beginner to run technical exercises. New optional dependency/tool installs require task authorization and licence review. The owner approved the custom free-use/no-redistribution licence, with GitHub platform rights preserved; see [licensing](../../../../docs/LICENSING.md). This does not relicense dependencies or establish legal review. The starter has no external project dependency or excluded editing skill.
