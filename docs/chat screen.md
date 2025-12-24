
  Main Areas

  | Term              | Component                       | Description                             |
  |-------------------|---------------------------------|-----------------------------------------|
  | Chat Interface    | ChatInterface.tsx               | Main container orchestrating everything |
  | Chat Sidebar      | ChatSidebar.tsx                 | Left panel for conversation history     |
  | Character Display | CharacterDisplay3D.tsx          | 3D character rendering area             |
  | Message History   | ScrollView in ChatInterface     | Scrollable chat message list            |
  | Input Area        | Bottom section in ChatInterface | Text input, voice, send button          |

  Character-Related Components

  | Term              | Component                    | Description                                   |
  |-------------------|------------------------------|-----------------------------------------------|
  | Character Wrapper | FloatingCharacterWrapper.tsx | Handles entrance animations & floating effect |
  | Name Label        | CharacterNameLabel.tsx       | Character name displayed on hover             |
  | Speech Bubble     | CharacterSpeechBubble.tsx    | Bubble showing current AI response            |
  | Animated Bubble   | AnimatedBubble.tsx           | Individual bubble with slide/fade animations  |
  | Fading Line       | FadingLine.tsx               | Single line of text with typing effect        |

  Message & UI Components

  | Term            | Component               | Description                      |
  |-----------------|-------------------------|----------------------------------|
  | Message Bubble  | MessageBubble.tsx       | Individual chat history message  |
  | Loading Dots    | LoadingDots.tsx         | "..." animation while waiting    |
  | Toast           | Toast.tsx               | Notification popups              |
  | Usage Meter     | UsageMeter.tsx          | Token/message limit display      |
  | Warning Banner  | LimitWarningBanner.tsx  | 80%/90% usage warnings           |
  | Blocked Overlay | BlockedStateOverlay.tsx | Full overlay when limits reached |

  Suggested Terminology

  When discussing the UI:
  - Character area / 3D viewport - the character display section
  - Speech bubble / response bubble - the character's current message
  - Chat history / message history - scrollable past messages
  - Input bar / message input - bottom text input area
  - Sidebar / conversation list - left navigation panel
