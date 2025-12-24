  Chat Screen UI Elements

  1. CHARACTER DISPLAY AREA (top section)

  | Element                     | Description                                            |
  |-----------------------------|--------------------------------------------------------|
  | Character Display Container | Main 3D viewport area                                  |
  | Characters Row              | Container holding all Wakattors                        |
  | Floating Character Wrapper  | Per-character container with entrance/float animations |
  | Character (3D)              | The actual 3D Wakattor model                           |
  | Character Name Label        | Name shown on hover above character                    |
  | Speech Bubble               | Comic-style bubble showing AI response                 |
  | Animated Bubble             | Individual bubble with slide/fade transitions          |
  | Fading Line                 | Single line of text with typing effect                 |
  | Empty Character State       | "Click to select" placeholder when no characters       |

  2. PLAYBACK CONTROLS (top-left overlay)

  | Element                    | Description                      |
  |----------------------------|----------------------------------|
  | Playback Buttons Container | Row holding playback controls    |
  | Replay Button              | Replays all character messages   |
  | Stop/Play Button           | Stop animation or play test poem |

  3. USER SPEECH BUBBLE (top-right)

  | Element                      | Description                  |
  |------------------------------|------------------------------|
  | User Speech Bubble Container | Shows user's pending message |
  | Typing Cursor                | Blinking `                   |

  4. MOBILE BUBBLE STACK (mobile portrait only)

  | Element             | Description                                    |
  |---------------------|------------------------------------------------|
  | Mobile Bubble Stack | Stacked speech bubbles for multiple characters |

  5. DIVIDER (between character area and chat)

  | Element               | Description                               |
  |-----------------------|-------------------------------------------|
  | Divider               | Thin separator line (draggable to resize) |
  | Divider Toggle Button | Button to show/hide chat history          |
  | Message Badge         | Count of messages in conversation         |

  6. LANDSCAPE TOGGLE (mobile landscape only)

  | Element                 | Description                                             |
  |-------------------------|---------------------------------------------------------|
  | Landscape Toggle Button | Floating button to switch between Characters/Chat views |
  | Landscape Toggle Badge  | Message count badge                                     |

  7. FULLSCREEN BUTTON (web only)

  | Element            | Description                        |
  |--------------------|------------------------------------|
  | Fullscreen Button  | Expand/contract icon               |
  | Fullscreen Tooltip | "Enter/Exit fullscreen" hover text |

  8. CHAT HISTORY (scrollable message list)

  | Element                  | Description                          |
  |--------------------------|--------------------------------------|
  | Chat ScrollView          | Scrollable container for messages    |
  | Messages Container       | Inner content wrapper                |
  | Message Bubble Container | Per-message wrapper                  |
  | Message Bubble           | Individual message card              |
  | Character Name           | Character name in assistant messages |
  | Message Text             | The actual message content           |
  | Message Timestamp        | Time the message was sent            |
  | Typing Cursor            | `                                    |
  | Editing Container        | Inline edit mode UI                  |
  | Edit Message Input       | TextInput for editing                |
  | Edit Actions             | Cancel/Save buttons                  |

  9. USAGE & LIMITS (warning banners)

  | Element                 | Description                           |
  |-------------------------|---------------------------------------|
  | Limit Warning Banner    | Yellow/red banner at 80%/90% usage    |
  | Blocked Input Indicator | Shown when at 100% usage limit        |
  | Upgrade Prompt Modal    | Modal suggesting subscription upgrade |

  10. INPUT AREA (bottom section)

  | Element                    | Description                       |
  |----------------------------|-----------------------------------|
  | Input Container            | Main input area wrapper           |
  | Recording Status Container | Voice recording UI                |
  | Recording Dot              | Red pulsing dot when recording    |
  | Recording Text             | Timer showing recording duration  |
  | Pause/Resume Button        | Pause/resume recording            |
  | Restart Button             | Restart recording from beginning  |
  | Confirm Button             | Checkmark to finish recording     |
  | Delete Button              | Trash icon to cancel recording    |
  | Transcribing Status        | Spinner + "Transcribing..." text  |
  | Live Transcript Container  | Shows real-time speech-to-text    |
  | Input Wrapper              | Rounded input bar                 |
  | Text Input                 | Main message input field          |
  | Action Buttons             | Container for input actions       |
  | Microphone Button          | Start/stop voice recording        |
  | TTS Toggle Button          | Enable/disable text-to-speech     |
  | Send Button                | Send message (or loading spinner) |

  11. TOASTS & NOTIFICATIONS

  | Element         | Description                             |
  |-----------------|-----------------------------------------|
  | Toast           | Popup notification for actions          |
  | Story Toast     | Special toast for conversation starters |
  | Alert Component | Custom modal alerts                     |

  ---
  Visual Layout Summary

  ┌─────────────────────────────────────────────────┐
  │  [Replay] [Stop/Poem]          [User Bubble]    │  ← Playback Controls
  │                                                 │
  │         ┌─────┐   ┌─────┐   ┌─────┐            │
  │         │ 3D  │   │ 3D  │   │ 3D  │            │  ← Character Display
  │         │Char │   │Char │   │Char │            │
  │         └──┬──┘   └──┬──┘   └──┬──┘            │
  │            │         │         │                │
  │         [Bubble]  [Bubble]  [Bubble]           │  ← Speech Bubbles
  │                                    [Fullscreen] │
  ├──────────────[ Chat Toggle ]────────────────────┤  ← Divider
  │  Character Name                                 │
  │  ┌─────────────────────────────────┐           │
  │  │ Message bubble                   │           │  ← Chat History
  │  └─────────────────────────────────┘           │
  │                    ┌─────────────────────────┐ │
  │                    │ User message        You │ │
  │                    └─────────────────────────┘ │
  ├─────────────────────────────────────────────────┤
  │  [Warning Banner - if near limit]               │
  ├─────────────────────────────────────────────────┤
  │  ● 0:15 [⏸] [↻] [✓] [🗑]  "Live transcript..."  │  ← Recording UI
  │  ┌────────────────────────────────────────────┐ │
  │  │ Type in here..          [🎤] [🔊] [Send]   │ │  ← Input Bar
  │  └────────────────────────────────────────────┘ │
  └─────────────────────────────────────────────────┘