// Agent-facing prompts: one stage at a time, not another upload UI.
export function nextConversationStep(state,project){
 if(!state.setup.complete)return {stage:'setup',action:'Run setup checks and resume missing prerequisites; no branding questionnaire yet.'};
 if(state.brand.status!=='complete'||state.style?.status!=='complete'){
  if(!state.onboarding?.materials)return {stage:'materials',question:'Do you have a website or brand materials you’d like me to use? Share a link or attach files here, or say “use simple defaults.”'};
  const choice=state.onboarding?.references??state.style?.plan?.referencesChoice;
  if(!choice)return {stage:'references',question:'Attach 1–3 videos whose editing style you like. Tell me what you like—or I can help identify it. You can also say “skip references.”',acceptsAttachments:true};
  if(!state.style?.plan)return {stage:'style',action:'Analyze supplied references or prepare default direction, then show a representative motion preview. Do not ask for display name/audience/tone.'};
  return {stage:'style-review',action:'Show the current motion preview, accept changes and request style approval. After approval immediately ask for the first clip.'};
 }
 const id=state.activeVideo,video=project.videos[id],record=state.videos[id];
 if(!video)return {stage:'footage',question:'Your style is ready. Attach the video you’d like me to edit here. If attachment access is unavailable, paste its full local file path and I’ll import it.',acceptsAttachments:true};
 if(!record?.editBrief)return {stage:'edit-brief',question:'What would you like from this edit? You can give a hook, length, or editing instructions—or use sensible defaults. If you used a script, optionally attach or paste it; natural changes in wording are fine.',suggestedAnswers:['Use sensible defaults'],acceptsAttachments:true,optionalFields:['Opening on-screen hook','Target length','Editing instructions including take cleanup','Script (optional; natural paraphrases allowed)']};
 if(record.draftRevision===record.revision)return {stage:'draft-review',action:'Show the playable current draft and ask for changes or final-export approval.'};
 return {stage:'edit',action:'Apply the recorded brief, run relevant checks and render one review draft; do not ask technical permission again.'};
}
