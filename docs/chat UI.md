  Chat Screen UI Elements

┌─────────────────────────────────────────────────┐
│  HEADER (MainTabs.tsx)                          │  ← [☰ Sidebar] [🟣 Wakatto] [user@email] [Logout]
│  Natural height, hidden in fullscreen/landscape │
├─────────────────────────────────────────────────┤
│  contentContainer > mainContentWrapper          │
│  ┌─────────────────────────────────────────────┐│
│  │  ChatInterface (returned as <> Fragment)     ││
│  │  ┌─────────────────────────────────────────┐││
│  │  │  KeyboardAvoidingView                   │││
│  │  │  ┌─────────────────────────────────────┐│││
│  │  │  │  characterDisplayContainer          ││││  ← This is what you see
│  │  │  │  ...                                ││││
│  │  │  ├─────────────────────────────────────┤│││
│  │  │  │  Divider / Chat Toggle              ││││
│  │  │  ├─────────────────────────────────────┤│││
│  │  │  │  Chat History / Input               ││││
│  │  │  └─────────────────────────────────────┘│││
│  │  └─────────────────────────────────────────┘││
│  └─────────────────────────────────────────────┘│
├─────────────────────────────────────────────────┤
│  Tab Bar: [Chat] [Wakattors] [Settings]         │
└─────────────────────────────────────────────────┘


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



    Detailed View: Above the Chat Toggle (Character Display Area)

  The entire area above the divider is a single `characterDisplayContainer` View
  with `overflow: visible`. All overlay elements inside it use absolute positioning.

  ┌─────────────────────────────────────────────────────────────────┐
  │  characterDisplayContainer (flex:1 on web, height on mobile)   │
  │                                                                │
  │  ┌──────────────────────────────────────────────────────────┐  │
  │  │  Other User Bubble (abs: top:12, left:50%, z:100)       │  │  ← shared convos only
  │  │  ┌───────────────────────────┐  [✕]                     │  │     centered, dismissable
  │  │  │ [👤 UserName]              │                          │  │
  │  │  │  "Their message content"  │                          │  │
  │  │  └───────────────────────────┘                          │  │
  │  └──────────────────────────────────────────────────────────┘  │
  │                                                                │
  │  ┌──────────────────┐                 ┌──────────────────────┐ │
  │  │ Playback Controls│                 │ Collab Buttons       │ │
  │  │ (abs: bottom:8,  │                 │ (abs: bottom:8,      │ │
  │  │  left:8, z:10)   │                 │  right:8, z:10)      │ │
  │  │                  │                 │                      │ │
  │  │ [▶ Poem] [🔊] [🗑│Clear]           │ [👥 2] or expanded:  │ │
  │  │                  │                 │ [✕][👁 View][+Invite] │ │
  │  │                  │                 │ [↪ Join]             │ │
  │  └──────────────────┘                 └──────────────────────┘ │
  │                                                                │
  │  ┌──── Mobile Bubble Stack (abs: top:8, z:300) ────────────┐  │
  │  │  (mobile portrait + multi-char only, hidden if chat open)│  │
  │  │  ┌─[CharName]────────────────────────┐                  │  │
  │  │  │  Stacked speech bubble (scrollable)│                  │  │
  │  │  └───────────────────────────────────┘                  │  │
  │  │  ┌─[CharName]────────────────────────┐                  │  │
  │  │  │  Another bubble                    │                  │  │
  │  │  └───────────────────────────────────┘                  │  │
  │  │  ═══════════════════════════════════ (yellow divider)    │  │
  │  │  [Other User Bubble - mobile pos]                       │  │
  │  │  [Toast notification area]                              │  │
  │  └─────────────────────────────────────────────────────────┘  │
  │                                                                │
  │     ┌─ Characters Row (relative flow, fills container) ─────┐  │
  │     │                                                       │  │
  │     │   FloatingCharWrapper     FloatingCharWrapper          │  │
  │     │   (abs positioned via     (abs positioned via          │  │
  │     │    semi-circle layout)     semi-circle layout)         │  │
  │     │                                                       │  │
  │     │    ┌────────────┐          ┌────────────┐             │  │
  │     │    │[SpeechBubb]│          │[SpeechBubb]│  z:500      │  │  ← above char (top:-20)
  │     │    │ CharName   │          │ CharName   │             │  │
  │     │    │ "AI text..." │         │ "AI text..." │            │  │
  │     │    └────────────┘          └────────────┘             │  │
  │     │    ┌────────────┐          ┌────────────┐             │  │
  │     │    │   3D Model │          │   3D Model │             │  │  ← CharacterDisplay3D
  │     │    │  (Wakattor)│          │  (Wakattor)│             │  │
  │     │    └────────────┘          └────────────┘             │  │
  │     │    *action text*           *action text*              │  │  ← FloatingActionText
  │     │    [Name Label]            [Name Label]               │  │  ← on hover only
  │     │                                                       │  │
  │     │   (empty state: "Click to select" if no chars)        │  │
  │     └───────────────────────────────────────────────────────┘  │
  │                                                                │
  │  ┌── User Speech Bubble (abs: bottom:60, z:10) ────────────┐  │
  │  │  ┌─────────────────────────────┐                        │  │  ← centered (left/right:15%)
  │  │  │  User's pending message |    │  (typing cursor)       │  │     purple bg, shown during
  │  │  └─────────────────────────────┘                        │  │     message send animation
  │  └─────────────────────────────────────────────────────────┘  │
  │                                                                │
  │  ┌── Thinking Indicator (abs: bottom:20, z:15) ────────────┐  │
  │  │              [💬 Thinking ...]                            │  │  ← shown while AI processes
  │  └─────────────────────────────────────────────────────────┘  │
  │                                                                │
  └────────────────────────────────────────────────────────────────┘
  ════════════════════[ 🗨 Chat Toggle  42 ]═══════════════════════  ← Divider (z:50)


    Z-Index Stacking Order (above chat toggle)

  | z-index | Element                    | Position       |
  |---------|----------------------------|----------------|
  | 500     | Speech Bubbles             | Above each 3D char (top:-20) |
  | 300     | Mobile Bubble Stack        | abs top:8      |
  | 100     | Other User Message Bubble  | abs top:12, centered |
  | 100     | Fullscreen Button (web)    | abs top:8, right:8 (outside container) |
  | 15      | Thinking Indicator         | abs bottom:20  |
  | 10      | Playback Controls          | abs bottom:8, left:8 |
  | 10      | Collab Buttons             | abs bottom:8, right:8 |
  | 10      | User Speech Bubble         | abs bottom:60  |
  | 0-10    | 3D Characters (per-char)   | abs, semi-circle positioned |


    Single vs Multi-Character Layout Differences

  | Aspect               | Single Character                  | Multiple Characters (2-5)               |
  |----------------------|-----------------------------------|-----------------------------------------|
  | Character position   | Shifted left to make room for bubble | Semi-circle arrangement (table view)  |
  | Speech bubble        | Large, right of character (65%)   | Above each character (top:-20)          |
  | Mobile portrait      | Bubble next to character          | Bubbles in stacked Mobile Bubble Stack  |
  | Text formatting      | Newlines after sentences          | Raw text (no reformatting)              |
  | Scale                | 1.0 (full size)                   | 0.8-1.1 (perspective: center smaller)   |
  | Vertical depth       | Centered                          | Center higher (further), edges lower    |


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