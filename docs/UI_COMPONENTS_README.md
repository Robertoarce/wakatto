# UI Component Library

Modern, accessible, and animated UI components inspired by Blocks, DiceUI, and KokonutUI.

## Components

### Button

A versatile button component with multiple variants, sizes, and states.

```tsx
import { Button } from './components/ui';

<Button
  title="Click me"
  onPress={handlePress}
  variant="primary" // primary, secondary, outline, ghost, danger, success
  size="md" // sm, md, lg
  icon="checkmark-circle"
  iconPosition="left" // left, right
  fullWidth
  loading={isLoading}
  disabled={false}
/>
```

**Props:**
- `title`: Button text
- `onPress`: Click handler
- `variant`: Visual style (default: 'primary')
- `size`: Button size (default: 'md')
- `icon`: Ionicons icon name (optional)
- `iconPosition`: Icon placement (default: 'left')
- `fullWidth`: Stretch to container width
- `loading`: Show loading spinner
- `disabled`: Disable interaction

**Variants:**
- **primary**: Purple background (#8b5cf6)
- **secondary**: Blue background (#6366f1)
- **outline**: Transparent with border
- **ghost**: Completely transparent
- **danger**: Red background (#ef4444)
- **success**: Green background (#10b981)

---

### Input

Enhanced text input with label, error states, icons, and password toggle.

```tsx
import { Input } from './components/ui';

<Input
  label="Email"
  placeholder="you@example.com"
  value={email}
  onChangeText={setEmail}
  icon="mail-outline"
  iconPosition="left" // left, right
  error="Invalid email address"
  helperText="We'll never share your email"
  showPasswordToggle={true}
  secureTextEntry
/>
```

**Props:**
- All standard React Native `TextInput` props
- `label`: Field label above input
- `error`: Error message (red)
- `helperText`: Helper text below input
- `icon`: Ionicons icon name
- `iconPosition`: Icon placement
- `showPasswordToggle`: Show/hide password button
- `containerStyle`: Custom container styles

**Features:**
- Automatic password visibility toggle
- Error state styling
- Icon support on both sides
- Helper text for guidance

---

### Card

Container component with multiple visual styles.

```tsx
import { Card } from './components/ui';

<Card
  title="Card Title"
  description="Optional subtitle"
  variant="elevated" // default, elevated, outlined, glass
  onPress={handlePress} // Makes card pressable
>
  <Text>Card content goes here</Text>
</Card>
```

**Props:**
- `children`: Card content
- `title`: Optional card title
- `description`: Optional subtitle
- `variant`: Visual style (default: 'default')
- `onPress`: Makes card tappable
- `style`: Custom styles

**Variants:**
- **default**: Standard card with border
- **elevated**: Prominent shadow, no border
- **outlined**: Heavy border, no background
- **glass**: Semi-transparent glassmorphism effect

---

### Badge

Small label component for status indicators.

```tsx
import { Badge } from './components/ui';

<Badge
  label="New"
  variant="primary" // default, primary, secondary, success, warning, danger, info
  size="md" // sm, md, lg
  icon="star"
/>
```

**Props:**
- `label`: Badge text
- `variant`: Color scheme (default: 'default')
- `size`: Badge size (default: 'md')
- `icon`: Ionicons icon name
- `style`: Custom styles

**Variants:**
- **default**: Gray (#3f3f46)
- **primary**: Purple (#8b5cf6)
- **secondary**: Blue (#6366f1)
- **success**: Green (#10b981)
- **warning**: Yellow (#fbbf24)
- **danger**: Red (#ef4444)
- **info**: Light blue (#3b82f6)

---

### Switch

Animated toggle switch component.

```tsx
import { Switch } from './components/ui';

<Switch
  value={isEnabled}
  onValueChange={setIsEnabled}
  disabled={false}
  activeColor="#8b5cf6"
  inactiveColor="#3f3f46"
  size="md" // sm, md, lg
/>
```

**Props:**
- `value`: Current state (boolean)
- `onValueChange`: Toggle handler
- `disabled`: Disable interaction
- `activeColor`: Color when on
- `inactiveColor`: Color when off
- `size`: Switch size

**Features:**
- Smooth spring animation
- Customizable colors
- Three size variants

---

### MessageBubble

Animated chat message bubble with fade-in and slide effects.

```tsx
import { MessageBubble } from './components/ui';

<MessageBubble
  content="Hello, world!"
  role="user" // user, assistant
  characterName="Freud"
  characterColor="#ff6b35"
  timestamp="2 mins ago"
  onLongPress={handleLongPress}
  position="left" // left, right, center
/>
```

**Props:**
- `content`: Message text
- `role`: Sender type
- `characterName`: Name displayed above message
- `characterColor`: Accent color for character messages
- `timestamp`: Optional time display
- `onLongPress`: Long press handler
- `position`: Bubble alignment

**Features:**
- Smooth entrance animations
- Character-specific styling
- Shadow effects based on role
- Long press support for actions

---

### LoadingDots

Animated three-dot loading indicator.

```tsx
import { LoadingDots } from './components/ui';

<LoadingDots
  color="#8b5cf6"
  size={8}
/>
```

**Props:**
- `color`: Dot color (default: '#8b5cf6')
- `size`: Dot diameter (default: 8)

**Features:**
- Sequential bounce animation
- Smooth spring physics
- Customizable appearance

---

### Skeleton

Loading placeholder with pulsing animation.

```tsx
import { Skeleton } from './components/ui';

<Skeleton
  width="100%"
  height={20}
  borderRadius={8}
/>
```

**Props:**
- `width`: Skeleton width (number or string)
- `height`: Skeleton height
- `borderRadius`: Corner radius
- `style`: Additional styles

**Use cases:**
- Loading states
- Content placeholders
- Progressive loading

---

### Toast

Notification toast with auto-dismiss.

```tsx
import { Toast } from './components/ui';

<Toast
  message="Settings saved successfully!"
  variant="success" // success, error, warning, info
  visible={showToast}
  onDismiss={handleDismiss}
  duration={3000}
/>
```

**Props:**
- `message`: Notification text
- `variant`: Visual style
- `visible`: Show/hide state
- `onDismiss`: Dismiss callback
- `duration`: Auto-dismiss time (ms)

**Variants:**
- **success**: Green with checkmark icon
- **error**: Red with error icon
- **warning**: Yellow with warning icon
- **info**: Blue with info icon

**Features:**
- Slide-in animation from top
- Auto-dismiss timer
- Icon per variant
- Backdrop blur effect

---

## Design Philosophy

These components follow modern UI/UX principles:

1. **Accessibility**: WAI-ARIA compliant, keyboard navigable
2. **Consistency**: Unified design language across all components
3. **Responsiveness**: Adapts to different screen sizes
4. **Performance**: Optimized animations using native driver
5. **Flexibility**: Highly customizable via props and styles

## Styling

All components use a dark theme by default with the following color palette:

- **Background**: #0f0f0f, #171717, #1f1f1f
- **Borders**: #27272a, #3a3a3a, #3f3f46
- **Text**: #ffffff, #d1d5db, #a1a1aa, #71717a
- **Primary**: #8b5cf6 (purple)
- **Secondary**: #6366f1 (blue)
- **Success**: #10b981 (green)
- **Danger**: #ef4444 (red)
- **Warning**: #fbbf24 (yellow)

## Animation Principles

Components use React Native's Animated API with:

- **Spring animations**: Natural, physics-based motion
- **Timing animations**: Smooth, controlled transitions
- **Native driver**: Hardware-accelerated performance
- **Stagger effects**: Sequential animations for lists

## Best Practices

1. **Use variants** for consistent styling instead of custom colors
2. **Leverage fullWidth** on buttons in mobile layouts
3. **Provide loading states** for async operations
4. **Show errors inline** using the Input error prop
5. **Toast for confirmations**, alerts for critical actions
6. **Skeleton loaders** for better perceived performance

## Examples

### Login Form
```tsx
<Card variant="elevated">
  <Input
    label="Email"
    icon="mail-outline"
    value={email}
    onChangeText={setEmail}
    error={emailError}
  />
  <Input
    label="Password"
    icon="lock-closed-outline"
    showPasswordToggle
    value={password}
    onChangeText={setPassword}
  />
  <Button
    title="Sign In"
    onPress={handleSignIn}
    loading={isLoading}
    fullWidth
  />
</Card>
```

### Settings Section
```tsx
<Card title="Notifications">
  <View style={styles.setting}>
    <Text>Email notifications</Text>
    <Switch
      value={emailNotifs}
      onValueChange={setEmailNotifs}
    />
  </View>
  <Badge label="Premium" variant="warning" />
</Card>
```

### Chat Message
```tsx
{messages.map((msg) => (
  <MessageBubble
    key={msg.id}
    content={msg.content}
    role={msg.role}
    characterName={msg.character?.name}
    characterColor={msg.character?.color}
    timestamp={formatTime(msg.created_at)}
    onLongPress={() => handleMessageAction(msg.id)}
  />
))}
```

## Migration Guide

### From old TextInput to Input:
```tsx
// Before
<TextInput
  style={styles.input}
  placeholder="Email"
  value={email}
  onChangeText={setEmail}
/>

// After
<Input
  label="Email"
  icon="mail-outline"
  placeholder="Email"
  value={email}
  onChangeText={setEmail}
/>
```

### From old TouchableOpacity button to Button:
```tsx
// Before
<TouchableOpacity style={styles.button} onPress={handlePress}>
  <Text style={styles.buttonText}>Submit</Text>
</TouchableOpacity>

// After
<Button
  title="Submit"
  onPress={handlePress}
  variant="primary"
  fullWidth
/>
```

### From old View card to Card:
```tsx
// Before
<View style={styles.card}>
  <Text style={styles.title}>Title</Text>
  {children}
</View>

// After
<Card
  title="Title"
  variant="elevated"
>
  {children}
</Card>
```

---

Built with ❤️ inspired by Blocks, DiceUI, and KokonutUI
