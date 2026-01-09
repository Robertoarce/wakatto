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
  | Other User Message Bubble   | Floating bubble showing other users' messages (shared) |

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

  | Element                  | Description                                      |
  |--------------------------|--------------------------------------------------|
  | Chat ScrollView          | Scrollable container for messages                |
  | Messages Container       | Inner content wrapper                            |
  | Message Bubble Container | Per-message wrapper                              |
  | Message Bubble           | Individual message card                          |
  | Character Name           | Character name in assistant messages             |
  | Sender Name Badge        | Colored badge showing sender name (shared convos)|
  | Message Text             | The actual message content                       |
  | Message Timestamp        | Time the message was sent                        |
  | Typing Cursor            | `|` cursor during typing animation               |
  | Editing Container        | Inline edit mode UI                              |
  | Edit Message Input       | TextInput for editing                            |
  | Edit Actions             | Cancel/Save buttons                              |

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

  11. COLLABORATION (shared conversations)

  | Element                    | Description                                      |
  |----------------------------|--------------------------------------------------|
  | Collab Button              | Shows participant count, opens collab options    |
  | Participant List Modal     | Shows all participants with roles                |
  | Invite Modal               | Create/share invite links and send emails        |
  | Join Conversation Modal    | Enter invite code to join a shared conversation  |
  | Other User Message Bubble  | Floating bubble for real-time messages from others|
  | Sender Name Badge          | Colored badge in chat history with sender name   |
  | User-specific Bubble Color | Each user gets unique color based on their ID    |

  12. TOASTS & NOTIFICATIONS

  | Element         | Description                             |
  |-----------------|-----------------------------------------|
  | Toast           | Popup notification for actions          |
  | Story Toast     | Special toast for conversation starters |
  | Alert Component | Custom modal alerts                     |

  ---
  Visual Layout Summary

  ┌─────────────────────────────────────────────────┐
  │  [Collab 2]                        [Fullscreen] │  ← Top Controls
  │  [Replay] [Stop/Poem]                           │  ← Playback Controls (top-left)
  │       ┌──────────────────────────────┐          │
  │       │ [UserName] Other user said.. │          │  ← Other User Bubble (shared)
  │       └──────────────────────────────┘          │
  │         ┌─────┐   ┌─────┐   ┌─────┐            │
  │         │ 3D  │   │ 3D  │   │ 3D  │            │  ← Character Display
  │         │Char │   │Char │   │Char │            │
  │         └──┬──┘   └──┬──┘   └──┬──┘            │
  │            │         │         │                │
  │         [Bubble]  [Bubble]  [Bubble]           │  ← Speech Bubbles
  │                                 [User Bubble]   │  ← User Speech Bubble (bottom-right)
  ├──────────────[ Chat Toggle ]────────────────────┤  ← Divider
  │  Character Name                                 │
  │  ┌─────────────────────────────────┐           │
  │  │ Message bubble                   │           │  ← Chat History
  │  └─────────────────────────────────┘           │
  │  [You]  ┌─────────────────────────┐            │
  │         │ Your message             │            │  ← User message (green)
  │         └─────────────────────────┘            │
  │  [Bob]  ┌─────────────────────────┐            │
  │         │ Other user's message     │            │  ← Other user (unique color)
  │         └─────────────────────────┘            │
  ├─────────────────────────────────────────────────┤
  │  [Warning Banner - if near limit]               │
  ├─────────────────────────────────────────────────┤
  │  ● 0:15 [⏸] [↻] [✓] [🗑]  "Live transcript..."  │  ← Recording UI
  │  ┌────────────────────────────────────────────┐ │
  │  │ Type in here..              [🎤] [Send]    │ │  ← Input Bar
  │  └────────────────────────────────────────────┘ │
  └─────────────────────────────────────────────────┘



    Visual Diagram

  ┌─────────────────────────────────────────────────────────┐
  │                    HEADER                               │ ← Natural height
  ├──────────┬──────────────────────────────────────────────┤
  │          │                                              │
  │          │                                              │
  │  SIDEBAR │          CHAT INTERFACE                      │ ← flex: 1
  │          │         (Tab.Screen content)                 │
  │  margin  │                                              │
  │  Left    │                                              │
  │          │                                              │
  ├──────────┴──────────────────────────────────────────────┤
  │  [Chat]     [Wakattors]     [Settings]                  │ ← Tab Bar (built-in)
  └─────────────────────────────────────────────────────────┘


    How Each Boundary is Controlled

  | Boundary         | Mechanism                                                     | Code Location        |
  |------------------|---------------------------------------------------------------|----------------------|
  | Top (Header)     | Flex column - Header takes natural height, content fills rest | MainTabs.tsx:693-696 |
  | Left (Sidebar)   | marginLeft: layout.sidebarWidth on desktop; overlay on mobile | MainTabs.tsx:711-715 |
  | Bottom (Tab Bar) | Tab.Navigator built-in tabBar positioning                     | MainTabs.tsx:716-733 |