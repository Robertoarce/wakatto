# Voice Features - Re-implementation Plan

## Current Status
- ✅ Backup branch created: `backup-voice-features`
- ✅ Main branch reset to colleague's work: `origin/gemini-branch`
- 🔄 Ready to re-implement voice features on new foundation

## Files to Restore from backup-voice-features

### Voice Recording Services
1. **src/services/voiceRecording.ts** - Core voice recording functionality
   - MediaRecorder API integration
   - Audio blob handling
   - Recording state management

2. **src/services/speechToText.ts** - Whisper API integration
   - Audio transcription service
   - Fallback for browsers without Web Speech API

3. **src/services/speechToTextLive.ts** - Web Speech API integration
   - Live transcription
   - Real-time speech recognition

4. **src/utils/browserDetection.ts** - Browser compatibility
   - Detect browser (Chrome, Edge, Brave, Firefox, Safari)
   - Check voice recording support
   - Provide user guidance

### Therapeutic Prompt System
5. **src/prompts/index.ts** - Main prompt system
6. **src/prompts/psychoanalytic.ts** - Freudian style
7. **src/prompts/jungian.ts** - Jung's analytical psychology
8. **src/prompts/adlerian.ts** - Adler's individual psychology
9. **src/prompts/cognitive.ts** - CBT approach
10. **src/prompts/compassionate.ts** - Compassion-focused therapy
11. **src/prompts/creative.ts** - Creative therapy
12. **src/prompts/existential.ts** - Existential therapy
13. **src/prompts/mindfulness.ts** - Mindfulness-based approach
14. **src/prompts/narrative.ts** - Narrative therapy
15. **src/prompts/positive.ts** - Positive psychology
16. **src/prompts/socratic.ts** - Socratic questioning
17. **src/prompts/README.md** - Documentation

### Modified Files (Need Careful Merge)
- **src/components/ChatInterface.tsx** - Voice UI integration
  - Needs to be integrated with new multi-character system
  - Voice button, recording state, live transcript display

- **src/services/aiService.ts** - May have conflicts with backend proxy
  - Check compatibility with Supabase edge function

### Package Dependencies
Note: The current branch uses newer Three.js versions, so NO NEED for:
- ~~expo-gl: ^16.0.7~~ (not needed with newer @react-three/fiber)
- ~~expo-three: ^8.0.0~~ (not needed with newer @react-three/drei)

## Integration Strategy

### Phase 1: Restore Core Voice Services ✅
1. Copy voice recording services (no dependencies on other code)
2. Copy browser detection utilities
3. Test in isolation

### Phase 2: Integrate with Multi-Character System 🔄
1. Update ChatInterface to work with new multi-character architecture
2. Voice input should work with `selectedCharacters` array
3. Update UI to show recording state alongside 3D characters

### Phase 3: Restore Prompt System 📋
1. Copy all prompt files
2. Update SettingsScreen to include prompt selector
3. Integrate with character configuration system
4. Each character could have their own prompt style

### Phase 4: Testing 🧪
1. Test voice recording in different browsers
2. Test live transcription vs Whisper fallback
3. Test integration with multi-character conversations
4. Test prompt system with different characters

## Key Differences to Consider

### Colleague's Branch Has:
- Multi-character system (up to 5 characters)
- Character-specific messages (`characterId` field)
- Backend proxy via Supabase Edge Function
- New navigation structure
- Removed old ChatInterface voice UI

### Your Voice Features Have:
- Voice recording with dual transcription (Web Speech + Whisper)
- 11 therapeutic prompt styles
- Browser compatibility system
- Voice UI in ChatInterface

### Integration Points:
1. **ChatInterface** - Major changes needed
   - Colleague removed voice features
   - Added character selection UI
   - Added resizable 3D character display
   - Changed `onSendMessage` signature to include `selectedCharacters`

2. **AI Service** - Check compatibility
   - Colleague uses Supabase edge function proxy
   - Your version may have different API structure
   - Need to ensure voice transcripts work with new backend

3. **Settings Screen** - Merge needed
   - Colleague's version may have character settings
   - Your version has prompt selector
   - Both should coexist

## Commands to Extract Files

```bash
# Extract individual files from backup branch
git show backup-voice-features:src/services/voiceRecording.ts > src/services/voiceRecording.ts
git show backup-voice-features:src/services/speechToText.ts > src/services/speechToText.ts
git show backup-voice-features:src/services/speechToTextLive.ts > src/services/speechToTextLive.ts
git show backup-voice-features:src/utils/browserDetection.ts > src/utils/browserDetection.ts

# Extract all prompt files
mkdir -p src/prompts
git show backup-voice-features:src/prompts/index.ts > src/prompts/index.ts
# ... etc for each prompt file
```

## Next Steps
1. Start with Phase 1: Restore voice services
2. Test voice recording independently
3. Update ChatInterface carefully to integrate with multi-character system
4. Add prompt system
5. Test thoroughly
6. Commit and push integrated features
