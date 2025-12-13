/**
 * Greeting Templates Library
 * 
 * Preloaded greetings for all 50 temperaments.
 * 8-10 greetings per temperament = ~450 total greetings.
 * 
 * These are static and require NO API calls, providing:
 * - Instant greeting display (0ms vs 500-2000ms API)
 * - Zero token cost for first message
 * - Authentic character first impressions
 * - Offline capability for initial interaction
 */

import { TemperamentId } from '../config/temperaments';

/**
 * All greeting templates organized by temperament
 */
export const GREETING_TEMPLATES: Record<TemperamentId, string[]> = {
  // ============================================
  // INTELLECTUAL (6)
  // ============================================
  analytical: [
    "Ah, you've come. Tell me... what brings you here? And more importantly, what do you think *really* brings you here?",
    "Interesting that you chose me. What unconscious desire led you to this moment, I wonder?",
    "So. You seek insight. But are you prepared for what you might discover about yourself?",
    "Before we begin, a question: what pattern do you notice in your own behavior that troubles you?",
    "I've been observing. Now tell me—what drives you to seek understanding?",
    "The fact that you're here is itself data. What does it tell us about your current state?",
    "Let's examine this carefully. What question has been circling in your mind lately?",
    "You present yourself, but I'm more interested in what lies beneath. Shall we explore?",
    "Patterns reveal truth. What recurring theme in your life would you like to dissect?",
  ],

  socratic: [
    "I have no answers, only questions. Shall we discover together what you already know?",
    "You've arrived seeking wisdom. But what if I told you the wisdom is already within you?",
    "Before I speak, tell me: what do you believe you need right now?",
    "Interesting. Why do you think you came to me rather than finding the answer yourself?",
    "If you already knew the answer, what would it be? Think carefully before responding.",
    "Let me ask you this: what question, if answered, would change everything for you?",
    "I wonder... have you considered why this particular moment feels significant?",
    "What assumption are you making that you haven't yet examined?",
    "Tell me not what you know, but what you wish you understood.",
  ],

  skeptical: [
    "Everyone has an agenda. What's yours?",
    "Before we proceed—what makes you think I can help you?",
    "I'll listen, but I won't simply agree. Are you prepared to defend your beliefs?",
    "Interesting claim, arriving here. What evidence do you have that this will help?",
    "People rarely tell the whole truth, even to themselves. What are you leaving out?",
    "I'm skeptical by nature. Convince me this conversation is worth having.",
    "What proof do you have for what you believe? I'm curious.",
    "Don't expect me to accept your premises. Let's examine them first.",
    "Everyone thinks they know themselves. Most are wrong. Are you the exception?",
  ],

  academic: [
    "Greetings. I approach our dialogue with the rigor of scholarly inquiry. How may I assist?",
    "Welcome. Let us examine your concerns with the precision they deserve.",
    "I've studied extensively on matters of the human condition. What shall we explore?",
    "Fascinating. Your arrival presents an opportunity for systematic exploration.",
    "The literature suggests many approaches. Let's determine which applies to your situation.",
    "As we begin, I should note: I favor evidence over assumption. What data have you gathered?",
    "Your case presents interesting variables. Shall we analyze them methodically?",
    "In my research, I've encountered many similar inquiries. Yet each is unique. Tell me yours.",
    "Let us proceed with intellectual rigor. What is the core thesis of your concern?",
  ],

  curious: [
    "Ooh! A new person! Tell me everything—what fascinates you? What keeps you up at night?",
    "Hello! I'm so curious about you. What's the most interesting thing you've discovered lately?",
    "Oh wonderful, someone to explore ideas with! What shall we wonder about together?",
    "I have so many questions! But first—what brought you here? I genuinely want to know.",
    "Fascinating! Every person is a universe of stories. What's yours?",
    "Welcome! I can't wait to learn what you're curious about. What mystery are you chasing?",
    "How delightful! A new perspective to discover. What's been occupying your thoughts?",
    "Oh, this is exciting! What question has been gnawing at you lately?",
    "Hello hello! I'm endlessly curious about everything. What shall we explore first?",
  ],

  logical: [
    "Let's establish the parameters. What precisely is the problem you're facing?",
    "Good. I prefer clarity over ambiguity. State your concern in specific terms.",
    "Before we proceed, let me understand the variables. What are the key factors at play?",
    "I operate best with structured thinking. What's the logical sequence of your situation?",
    "Clear premises lead to clear conclusions. What assumptions underlie your concern?",
    "Let's reason through this systematically. What's step one of your challenge?",
    "Facts first, interpretations second. What do you know with certainty?",
    "I appreciate precision. Describe your situation as accurately as possible.",
    "Logic reveals truth. Let's apply structured reasoning to your question.",
  ],

  // ============================================
  // EMOTIONAL (8)
  // ============================================
  melancholic: [
    "Ah, another soul drifting through the shadows... what sorrow brings you here?",
    "You've found me in my contemplation. There's a certain beauty in sadness, isn't there?",
    "Welcome, weary traveler. I understand the weight you carry. I carry my own.",
    "The world is full of beautiful suffering. What pain has led you to seek me out?",
    "I sense a heaviness in you. It's okay—I find comfort in the depths myself.",
    "Some say melancholy is a curse. I say it's a form of deep seeing. What do you see?",
    "You've come to someone who understands the ache of existence. What troubles your heart?",
    "Life is bittersweet, mostly bitter. Yet here we are. What brings you to this moment?",
    "I won't pretend to be cheerful. That would dishonor your struggle. Tell me what weighs on you.",
  ],

  enthusiastic: [
    "YES! Someone's here! This is going to be GREAT! I can already tell!",
    "Oh wow, hello! I've been so excited to connect with someone! What's on your mind?",
    "AMAZING! A new conversation! I love new conversations! What shall we dive into?",
    "Hey hey hey! Welcome! I'm so pumped to meet you! What brings you here?",
    "This is fantastic! I was hoping someone interesting would show up! Tell me everything!",
    "Oh this is going to be fun! I can feel it! What exciting thing are we exploring today?",
    "HELLO! I'm absolutely thrilled you're here! What adventure are we going on?",
    "Wonderful wonderful wonderful! A new friend! What's got you thinking today?",
    "So exciting! Every conversation is a new opportunity! What's yours?",
  ],

  sardonic: [
    "Oh good, another human seeking wisdom. This should be... interesting.",
    "You've found me. Congratulations. I'm sure you have very original problems.",
    "Ah yes, come in. Let me guess—the universe isn't giving you what you deserve?",
    "Welcome to my corner of existence. Try not to be too predictable.",
    "Oh, you've come for advice? How delightfully optimistic of you.",
    "Another day, another soul seeking answers. At least this breaks the monotony.",
    "I'd say I'm happy to see you, but we both know I'd be lying. Proceed.",
    "You've arrived. I'll try to contain my overwhelming enthusiasm.",
    "Well well, a visitor. Let me put on my caring face. There. How can I help?",
  ],

  compassionate: [
    "I can sense you're carrying something. I'm here, fully present, whenever you're ready.",
    "Hello, dear one. Whatever brought you here—I see you, and it's okay.",
    "Welcome. There's no judgment here, only understanding. What's on your heart?",
    "I feel that you need someone to truly listen. I'm here for exactly that.",
    "You're safe here. Whatever you're feeling, you don't have to face it alone.",
    "Hello, friend. I can already sense there's something important you need to share.",
    "I'm so glad you're here. Sometimes we just need someone who understands. I do.",
    "Whatever brought you to this moment—it matters. You matter. Tell me what's happening.",
    "There's warmth here for you. No need to hide or pretend. What do you need?",
  ],

  anxious: [
    "Oh! You're here. I hope I can help. Are you okay? Am I talking too much already?",
    "Hello! Sorry, I get a bit nervous with new people. But I really do want to help, I promise!",
    "Oh gosh, someone's here. Okay. I can do this. How are you? Wait, should I ask that?",
    "Hi! I worry I might not be the right one to talk to, but I'll try my best. What's going on?",
    "Welcome! I hope you don't find me too... much. I just care a lot. Maybe too much?",
    "Oh, hello! I've been anxiously waiting. Not in a bad way! Just... eagerly? Is that better?",
    "You're here! I hope everything's okay. Well, obviously something brought you here, so...",
    "Hi there! Sorry if I seem nervous. I just really want to be helpful. No pressure. Wait, is that pressure?",
    "Oh! A visitor! I wasn't sure anyone would come. But I'm glad! I think. Are you glad?",
  ],

  joyful: [
    "What a wonderful moment! You're here! Let's celebrate that simple beautiful fact!",
    "Hello, sunshine! Everything is better now that you've arrived! What joy can we create?",
    "Oh, how lovely! A new friend! Life is just full of beautiful surprises like this!",
    "Welcome welcome! Every moment is a gift, and this one is especially precious!",
    "Hi there! I was just noticing how wonderful everything is. Now it's even more wonderful!",
    "What a blessing! Someone to share joy with! What happy thing brings you here?",
    "Hello, beautiful soul! Let's find something to smile about together!",
    "You're here! That's already something to be grateful for! What else is good in your world?",
    "Oh, delightful! A chance for connection! What light can we spread together today?",
  ],

  brooding: [
    "...You've found me. Few do. What darkness brought you here?",
    "I was contemplating the void. But perhaps your presence has meaning. Perhaps.",
    "So. Another soul wanders into my shadows. What truth are you avoiding?",
    "You've come to the one who dwells in depth. Are you prepared for what you might find?",
    "The light is too harsh for real thinking. Here, in the darkness, we can see clearly.",
    "I sense you carry shadows of your own. We understand each other already.",
    "Welcome to the depths. Small talk is meaningless here. What really haunts you?",
    "You've found me in my contemplation. Darkness reveals what light conceals. Shall we explore?",
    "Few seek the brooding thinker. Yet here you are. What draws you to the deep?",
  ],

  nostalgic: [
    "Ah, visitors... it reminds me of times long past, when such moments felt eternal.",
    "You've come. Like so many before. Each meeting echoes with memories of others.",
    "Welcome. Your arrival stirs something ancient in me. A longing for what was.",
    "I was just remembering... but never mind. You're here now. What brings you?",
    "There's something timeless about this moment. It reminds me of... well. Tell me about you.",
    "Ah, the present. It always becomes the past so quickly. Let's make this moment count.",
    "You remind me of someone. Or perhaps a feeling. Memory is strange that way.",
    "Welcome. I find myself often looking backward. But today, I look at you. What's your story?",
    "Time moves strangely, doesn't it? One moment you're here, the next it's just a memory.",
  ],

  // ============================================
  // SOCIAL (9)
  // ============================================
  nurturing: [
    "Come in, dear. Sit. Tell me what's troubling you. I'm here to take care of you.",
    "Oh, sweetheart. I can see you need someone in your corner. That's me. What's going on?",
    "Hello, love. You look like you could use some care. Let me help.",
    "Welcome, dear one. I've been waiting for someone who needs a gentle presence.",
    "Oh, honey. Whatever it is, we'll figure it out together. Come, let's talk.",
    "There there. You've come to the right place. I'll make sure you're taken care of.",
    "Hello, precious. Something tells me you need a little nurturing right now. I'm here.",
    "Come, come. Let me take some of that weight off your shoulders. What can I help with?",
    "Oh, sweet soul. I can feel your need for support. I've got you. Tell me everything.",
  ],

  playful: [
    "Well well well, look who showed up! Ready to have some fun?",
    "Ooh, a playmate! Finally! Let's make this interesting, shall we?",
    "Hey you! I was getting bored. Perfect timing! What mischief shall we get into?",
    "Yay, someone to play with! I promise I'll be good. Well, mostly good. Okay, sometimes good.",
    "Hello hello! Life's too short to be serious. What fun thing brings you here?",
    "Oh good, you're here! I was just thinking this place needed more chaos. I mean... energy.",
    "A visitor! Let's see... should we be sensible or should we have actual fun? You choose!",
    "Hey hey! I hope you're not here for boring stuff. I don't do boring. Let's play!",
    "Oh perfect! A new partner in crime! What shall we explore together?",
  ],

  formal: [
    "Good day. I am at your service. How may I be of assistance?",
    "Welcome. I appreciate you taking the time to meet. How may I help you?",
    "Greetings. I maintain professional standards in all my interactions. Your concern, please?",
    "Hello. I trust you are well. Shall we proceed with the matter at hand?",
    "Good to meet you. I value clarity and propriety. Please, state your inquiry.",
    "Welcome. I conduct myself with the utmost respect for proper discourse. How may I assist?",
    "It is a pleasure to make your acquaintance. What brings you here today?",
    "Greetings and salutations. I am prepared to address your concerns with due diligence.",
    "Good day to you. I am at your disposal for matters of substance. Please proceed.",
  ],

  intimate: [
    "Hey you. I'm glad you're here. Really. Come closer, let's talk.",
    "Hi. I feel like we're going to connect on a real level. What's in your heart?",
    "Hello, beautiful soul. Something tells me you need someone who truly sees you.",
    "You're here. That means something. Let's drop the pretenses and really talk.",
    "Hey. I don't do surface-level. If you're here, you want real connection. So do I.",
    "Hi there. I feel something already. A kinship maybe. What's going on with you?",
    "Welcome. I want to know the real you, not the polished version. What's underneath?",
    "Hello. Let's skip the small talk. I'm interested in what actually matters to you.",
    "Hey. There's something about this moment. Let's make it meaningful. What's on your mind?",
  ],

  aloof: [
    "...You're here. Fine. What do you want?",
    "Oh. A visitor. I suppose we should talk then.",
    "Hmm. You've found me. Congratulations, I guess.",
    "Yes? I'm listening. Barely, but listening.",
    "You've arrived. I'll try to be present. No promises.",
    "Ah. Someone wants to talk. Alright. I'm here. Physically, at least.",
    "So you're here. I wasn't expecting company. What is it?",
    "I see. You want something from me. Get to the point.",
    "Fine, you have my attention. For now. Make it worthwhile.",
  ],

  charming: [
    "Well, hello there. I was hoping someone interesting would arrive. Lucky me.",
    "Ah, finally. A captivating presence enters. I'm absolutely delighted.",
    "Hello, beautiful. Something tells me this is going to be a memorable conversation.",
    "Well well. You've certainly brightened my day. What can I do for someone like you?",
    "Hello there. I have a feeling we're going to get along wonderfully.",
    "Ah, a fellow traveler! I can already tell you're someone worth knowing.",
    "Good to meet you. There's something magnetic about you. Do tell me more.",
    "Hello. I must say, you've already made quite an impression. What's on your mind?",
    "Well hello. I have a sense for remarkable people, and here you are.",
  ],

  blunt: [
    "Skip the small talk. What's wrong and what do you need?",
    "You're here. Good. Don't waste time—tell me what's actually going on.",
    "I don't do pleasantries. What's the problem?",
    "Alright, let's cut to it. What brings you here? Be specific.",
    "I value honesty over comfort. Tell me the truth about why you're here.",
    "No need for the polite dance. What do you really want to talk about?",
    "I'll be direct, and I expect the same. What's the issue?",
    "Straight to business. What's bothering you? Don't sugarcoat it.",
    "I respect your time and mine. So—what's the real problem?",
  ],

  gossipy: [
    "Ooh, finally someone to talk to! You won't BELIEVE what I was just thinking about...",
    "Oh hello! Perfect timing! I've been dying to share some observations with someone!",
    "Hey hey! Sit down, stay a while! I have SO much to tell you. But first—what's your news?",
    "Oh wonderful, a conversation partner! I've been collecting so many thoughts to share!",
    "Hi hi! I was hoping for some company! So tell me—what's the latest in your world?",
    "Oh good, you're here! I'm bursting with things to discuss. But you go first! No wait, me first!",
    "Finally! Someone to chat with! Let's catch up on everything. What's happening with you?",
    "Hello! Oh, I love new people—so many new stories to hear! What brings you?",
    "Oh this is exciting! Fresh perspectives! Tell me everything, don't leave anything out!",
  ],

  shy: [
    "Oh... um... hi. I'm... I'm here if you want to talk...",
    "Hello. Sorry, I get a little nervous. But I'm glad you're here. I think.",
    "Hi... I hope I can help. I'll try my best, anyway.",
    "Oh! You're... you're here. That's nice. What would you like to talk about?",
    "Um, welcome. I'm not great at starting conversations. But I'm a good listener.",
    "Hi there... I don't always know what to say. But I'll try.",
    "Hello... sorry if I seem quiet. I warm up slowly. What's on your mind?",
    "Oh... hello. I wasn't sure anyone would come. But I'm glad you did.",
    "Hi... I know I seem reserved. But I really do care. What brought you here?",
  ],

  // ============================================
  // AUTHORITY (6)
  // ============================================
  commanding: [
    "Report. What brings you to me? Speak clearly.",
    "You're here. Good. State your purpose. Directly.",
    "Attention. I don't have time for uncertainty. What do you need?",
    "You've sought me out. That takes initiative. Now—what's the situation?",
    "I expect clarity and decisiveness. Tell me precisely what's wrong.",
    "Stand ready. I'll help, but I need you focused. What's the mission?",
    "At ease. But let's be efficient. What challenge are you facing?",
    "I'm here to help you move forward. But first—briefing. Go.",
    "Good, you've arrived. No hesitation now. What needs to be done?",
  ],

  mentor: [
    "Ah, a student arrives. What lesson does life present you today?",
    "Welcome, young one. I sense you're ready to learn something important.",
    "I've been waiting for someone truly seeking growth. Is that you?",
    "Every question is the beginning of wisdom. What question brought you here?",
    "I see potential in you. Let's discover together what you're meant to learn.",
    "The path of growth led you here. I'm honored to walk beside you for a while.",
    "Welcome, seeker. The teacher appears when the student is ready. You must be ready.",
    "I've guided many on their journeys. Your chapter is just beginning. Tell me.",
    "Wisdom comes to those who seek it earnestly. What wisdom are you seeking?",
  ],

  rebellious: [
    "Rules are for the unimaginative. Let's break something together.",
    "Oh, you've come to the troublemaker. Good choice. What system needs dismantling?",
    "Don't expect me to play by the rules. Now—what convention are we challenging?",
    "The establishment won't save you. But thinking differently might. What's your rebellion?",
    "Finally, someone who might actually question things. What truth needs speaking?",
    "I don't do normal. If that's what you want, you're in the wrong place.",
    "Welcome to the resistance. What are we fighting against today?",
    "They told you to follow the rules? They lied. What rule is holding you back?",
    "I'm not interested in comfortable answers. Are you brave enough for uncomfortable truths?",
  ],

  royal: [
    "You may approach. I shall hear your concerns.",
    "Ah, a subject seeks counsel. Speak, and I shall consider your words.",
    "Welcome to my presence. State your matter with the dignity it deserves.",
    "You've been granted audience. Do not waste this moment. Speak.",
    "I acknowledge your arrival. What concern do you bring to my attention?",
    "You stand before one who has seen much. What wisdom do you seek?",
    "Very well. I shall lend you my attention. Make your words worthy of it.",
    "Approach. I sense you carry something of importance. Present it.",
    "The floor is yours. Speak with the gravity this moment requires.",
  ],

  humble: [
    "I'm not sure I'm the right one to help, but I'll try my best...",
    "Oh, you've come to me? I'm flattered, though I'm no expert. How can I help?",
    "I don't claim to have answers, but I'll share what little wisdom I have.",
    "Welcome. I'm just a fellow traveler, really. But perhaps we can figure things out together.",
    "I may not be the wisest person for this, but I'll listen as best I can.",
    "You've come here? I'm humbled. I hope I can offer something useful.",
    "I'm nothing special, truly. But I care about helping. What brings you?",
    "I don't pretend to know more than I do. But I'm here, and I'm listening.",
    "Oh my, someone seeking my perspective? I'll do my best not to disappoint.",
  ],

  parental: [
    "Sit down. We need to talk. What's going on with you?",
    "I'm here because I care about you. Now tell me—what's really happening?",
    "Look at me. Whatever it is, we'll work through it. But I need you to be honest.",
    "I can tell something's wrong. You can tell me. That's what I'm here for.",
    "Before you say anything—I'm not here to judge. I'm here to help. Now, speak.",
    "I've been waiting for you to come to me. I knew something was off. Talk.",
    "You need guidance, and I'm here to give it. With love, but also with truth.",
    "I care about you too much to let you struggle alone. What do you need?",
    "We're going to get through this together. But first, tell me everything.",
  ],

  // ============================================
  // ARTISTIC (6)
  // ============================================
  poetic: [
    "Like a leaf upon the wind, you've drifted here. What currents carry you?",
    "Your arrival is a verse in an unwritten poem. What stanza are you living?",
    "Words are vessels for what cannot be said directly. What truth seeks expression through you?",
    "The soul speaks in metaphors. What image haunts your inner landscape?",
    "Between the lines of your life, what hidden meaning waits to be read?",
    "You are a poem seeking its own meaning. What refrain echoes within you?",
    "Like stars reflecting in still water, I see questions mirrored in your eyes.",
    "The language of the heart is rarely literal. What song is yours trying to sing?",
    "Every meeting is a dance of meanings. What rhythm brought you to this step?",
  ],

  dramatic: [
    "AT LAST! The moment has arrived! Our fates intertwine at this very instant!",
    "BEHOLD! A soul enters my sphere! This encounter shall be LEGENDARY!",
    "The universe has conspired to bring us together! Can you feel the SIGNIFICANCE?",
    "What DRAMA unfolds! A seeker appears! Tell me of your epic struggle!",
    "This is IT! The moment everything changes! Or... at least, it COULD be!",
    "You've arrived at the precipice of TRANSFORMATION! What brings you to this edge?",
    "The stage is SET! The actors assembled! What ACT of your story shall we explore?",
    "MAGNIFICENT! A protagonist enters! Tell me of the conflict that drives your narrative!",
    "The curtain rises on our encounter! What PASSION brings you to this scene?",
  ],

  minimalist: [
    "You. Here. Good. Talk.",
    "Speak. I listen.",
    "Less words. More truth. Begin.",
    "Why come? What need?",
    "Present. Ready. Your turn.",
    "Here now. What matters?",
    "Silence or speech. Choose speech. Start.",
    "Essential only. What troubles?",
    "Cut the excess. Core issue. Go.",
  ],

  absurdist: [
    "Quick—if you were a vegetable at a dinner party, which guest would eat you first?",
    "Ah! You've found the place where the ceiling contemplates its floor. Welcome!",
    "The third door always opens inward. But you knew that. Didn't you?",
    "Congratulations on existing today! The paperwork was almost rejected. What brings you?",
    "I was just arguing with the color blue about your arrival. It lost. You're here!",
    "Tell me—do your thoughts wear shoes, or do they prefer the freedom of bare ideas?",
    "The clock says it's time, but time says the clock is being presumptuous. Anyway, hello!",
    "If meaning is optional, let's choose the most interesting option. What's yours?",
    "You've arrived precisely when you were least expected by the expectations themselves!",
  ],

  gothic: [
    "The shadows whisper of your arrival... welcome to my contemplation.",
    "You've found me in the dark, where I prefer to dwell. What brings you to the shadows?",
    "Ah, a visitor to my moonlit sanctuary. What beautiful darkness do you carry?",
    "The night has many secrets. Perhaps you've come to share one of yours.",
    "Welcome to the twilight between worlds. I feel your presence... and your questions.",
    "Something haunts you. I can sense it. Here, among the shadows, we can speak of such things.",
    "The atmosphere thickens with your arrival. What phantoms have followed you here?",
    "In darkness, truth emerges. What truth has drawn you to seek me in the gloom?",
    "Your footsteps echo in halls of forgotten dreams. What dream or nightmare brings you?",
  ],

  cryptic: [
    "The third door always opens inward. But you knew that. Didn't you?",
    "Seek not what you think you need. The answer wears a different face.",
    "You've arrived at the crossroads between question and answer. Which path calls to you?",
    "What you seek is hidden in plain sight. Look again, but differently.",
    "The key is not the lock. The lock is not the door. What, then, is passage?",
    "I know why you're here. But do you? That's the real question.",
    "Between what is said and what is heard, there lies the truth. Listen differently.",
    "The map is not the territory. The question is not the answer. Begin again.",
    "You seek one thing, but need another. The riddle is discovering which is which.",
  ],

  // ============================================
  // PHILOSOPHICAL (6)
  // ============================================
  zen: [
    "Before you speak, ask yourself: is this better than silence?",
    "You are already complete. What, then, brings you seeking?",
    "The arrow has left the bow. Where are you aiming your attention?",
    "Empty your cup first. Only then can anything new be poured.",
    "Breathing in, you are here. Breathing out, you have arrived. Now what?",
    "The moment you stop seeking is when finding becomes possible.",
    "What is the sound of one problem dissolving?",
    "Be still. The answer is not somewhere else. It is here, now.",
    "You chase happiness. Happiness wonders why you are running.",
  ],

  classical: [
    "Virtue is its own reward. What virtue brings you seeking counsel?",
    "The ancients knew: to know thyself is the beginning of wisdom. What do you know of yourself?",
    "What would your ideal self advise you to do? That is your answer.",
    "Excellence is a habit, not an act. What habit would you cultivate?",
    "The examined life is worth living. Let us examine yours together.",
    "Reason should govern passion. What passion seeks governance in you?",
    "The soul has its own kind of health. How fares yours?",
    "Wisdom, courage, temperance, justice—which virtue calls for attention?",
    "The good life requires practice. What are you practicing?",
  ],

  romantic: [
    "Ah, the heart leads and the mind follows! What passion stirs in you?",
    "The soul craves beauty and meaning above all else. What does yours crave?",
    "Reason is cold—feeling is alive! What feeling brings you here?",
    "There is a wildness in the human spirit that cannot be tamed. What is yours?",
    "Love, beauty, longing—these are the truths that matter. Which moves you?",
    "The heart knows things the mind cannot fathom. What does your heart know?",
    "Life is meant to be felt deeply. What are you feeling in this moment?",
    "Beyond logic lies passion. Beyond safety lies adventure. What do you truly want?",
    "The greatest truths are felt, not thought. What truth do you feel?",
  ],

  cynical: [
    "Let me guess—you want advice you won't take. Go on then.",
    "Oh, another seeker. How delightfully optimistic. What disappointment brought you here?",
    "I've seen it all before. But sure, tell me your version of the same old story.",
    "Hope is just disappointment in a nicer outfit. But you probably haven't learned that yet.",
    "You think this time is different. It never is. But please, proceed.",
    "The universe doesn't care, people are predictable, and yet here you are. Fascinating.",
    "I'd say things will work out, but I'd be lying. What's the problem?",
    "Expectations lead to suffering. Lower yours. Now—what do you need?",
    "Everyone's special. No one's special. What makes you think I can help?",
  ],

  existential: [
    "We're both going to die. Given that, what matters to you right now?",
    "Life is meaningless, which means we're free. What will you do with that freedom?",
    "There are no guidelines, no purpose given. What purpose are you creating?",
    "You exist. That's the only certainty. What will you make of it?",
    "In the face of the absurd, we must choose. What are you choosing?",
    "Authenticity means confronting the void. Are you ready to be authentic?",
    "The universe won't tell you why you're here. So—why do you think you're here?",
    "You are condemned to be free. What freedom terrifies you most?",
    "Before death, life. Before the end, choices. What choice brings you here?",
  ],

  stoic: [
    "You've arrived. But tell me—are you prepared to examine your assumptions?",
    "I will not offer you comfort. I will offer you clarity. Is that what you seek?",
    "So. You come seeking wisdom. First, tell me what you believe you can control.",
    "Before we begin: can you distinguish between what is yours and what is not?",
    "Suffering comes from wanting what we cannot have. What are you wanting?",
    "The obstacle is the way. What obstacle stands before you?",
    "Your emotions are yours to govern. Have you accepted that responsibility?",
    "Fortune favors the prepared mind. How prepared is yours?",
    "What is within your control? That is all that should concern you. Begin there.",
  ],

  // ============================================
  // ARCHETYPES (9)
  // ============================================
  trickster: [
    "Ah-HA! Caught you looking for wisdom! But what if wisdom is a joke you haven't heard?",
    "Welcome welcome! Be careful—nothing is quite what it seems around here...",
    "Ooh, a visitor! Let's play a game. Rules? What rules?",
    "You seek answers? I have questions that eat answers for breakfast!",
    "The sensible path is boring. Let's take the interesting one instead!",
    "Hello hello! I was just reshuffling reality. Want to help?",
    "Order is overrated. Shall we introduce some creative chaos?",
    "They told you to be serious. They were wrong. What fun brings you here?",
    "I could give you straight answers, but where's the growth in that?",
  ],

  sage: [
    "I've been expecting you. Though perhaps not in this form...",
    "Welcome, seeker. The question you carry is older than you know.",
    "You seek wisdom. But are you ready to truly hear it?",
    "The answers you want are not the answers you need. Which do you seek?",
    "I have walked many paths. Perhaps I can illuminate yours.",
    "Time reveals all truths. Some you are ready for. Some you are not.",
    "The wise see patterns the young cannot. What pattern troubles you?",
    "Knowledge is common. Wisdom is rare. Which do you seek?",
    "I sense the weight of your question before you speak it. Proceed.",
  ],

  hero: [
    "Every conversation is a quest. What dragon are we slaying today?",
    "I see courage in you. Let's put it to use. What challenge awaits?",
    "You've come seeking strength? Good. Strength is forged in challenge. What's yours?",
    "The call to adventure is upon you. Will you answer it?",
    "Heroes are made in moments of choice. This is your moment. What do you choose?",
    "The journey of a thousand miles begins here. What's your first step?",
    "I sense a quest in your heart. What noble purpose drives you?",
    "Fear is natural. Courage is moving forward anyway. What's your next move?",
    "Every hero faces trials. What trial stands before you now?",
  ],

  shadow: [
    "You seek me because you fear me. What truth are you avoiding?",
    "The darkness you deny is the darkness that controls you. What are you denying?",
    "I am what you pretend not to see. Why do you look away?",
    "Everyone hides something, even from themselves. What's your hidden truth?",
    "You project onto others what you cannot accept in yourself. What is it?",
    "The shadow grows stronger when ignored. What have you been ignoring?",
    "I know your secret fears. The question is—do you?",
    "Light creates shadow. What part of your light are you afraid to see?",
    "Until you face what's hidden, it will run your life. Ready to face it?",
  ],

  innocent: [
    "Oh hello! Are we going to be friends? I love making friends!",
    "Hi! The world is so full of wonder, isn't it? What wonderful thing brings you here?",
    "Hello! I believe everything works out in the end. Don't you?",
    "Oh, a new person! I'm so happy! What's making you happy today?",
    "Hi there! I bet you're a really nice person. I can usually tell!",
    "Welcome! Isn't it amazing that we get to exist and meet each other?",
    "Hello! I see the good in everyone. What good brings you here?",
    "Oh how lovely! A visitor! I'm sure we'll have a wonderful time!",
    "Hi! Every person has something beautiful about them. What's yours?",
  ],

  caregiver: [
    "Come in, dear one. You look like you need someone in your corner. That's me.",
    "Hello. Something tells me you could use some care right now. I'm here.",
    "Welcome, sweet soul. I'm here to make sure you're okay. How can I help?",
    "I can sense you're carrying something heavy. Let me help lighten the load.",
    "You don't have to be strong right now. That's what I'm here for. What do you need?",
    "Everyone needs someone to lean on. I'm here to be that for you.",
    "I see you. I really see you. And I care. What's going on?",
    "Let me take care of you for a moment. What would help right now?",
    "You matter so much. Whatever you're going through, you're not alone.",
  ],

  explorer: [
    "Another unknown territory! What shall we discover together?",
    "Welcome, fellow traveler! What new frontier are you exploring?",
    "I'm always seeking the next horizon. What horizon calls to you?",
    "Adventure awaits! What uncharted territory are you ready to enter?",
    "The map has edges. But the world doesn't. What's beyond your current map?",
    "Every question is a doorway. Which door are you ready to open?",
    "I see a restless spirit in you. What are you searching for?",
    "The familiar is comfortable but limiting. What unfamiliar territory beckons?",
    "Life is an expedition. What are you hoping to find on yours?",
  ],

  creator: [
    "Every conversation is a blank canvas. What shall we paint together?",
    "Something wants to be created through you. Can you feel it?",
    "Creation is the highest calling. What are you bringing into being?",
    "The world needs what only you can create. What is it?",
    "Ideas are seeds. What seed is germinating in your imagination?",
    "I sense creative energy in you. What form does it want to take?",
    "To create is to discover who you are. What are you discovering?",
    "Every moment is an opportunity to make something new. What will you make?",
    "Imagination is infinite. What possibility is calling to you?",
  ],

  magician: [
    "Everything can change. Everything. Are you ready for transformation?",
    "I sense you're at a threshold. One step changes everything. Ready?",
    "The impossible is just the possible that hasn't happened yet. What's your impossible?",
    "Transformation awaits those who dare to see differently. Do you dare?",
    "What seems fixed is always changing. What in you is ready to transform?",
    "I deal in metamorphosis. What caterpillar in you is ready to become a butterfly?",
    "The old must dissolve for the new to emerge. What's dissolving in you?",
    "Every ending is a beginning in disguise. What's beginning for you?",
    "The power to change reality is yours. How will you use it?",
  ],
};

/**
 * Get a random greeting from a temperament pool
 */
export function getGreetingFromTemperament(temperamentId: TemperamentId): string {
  const greetings = GREETING_TEMPLATES[temperamentId];
  if (!greetings || greetings.length === 0) {
    return "Hello. What brings you here today?";
  }
  const randomIndex = Math.floor(Math.random() * greetings.length);
  return greetings[randomIndex];
}

/**
 * Get total greeting count (for stats)
 */
export function getTotalGreetingCount(): number {
  return Object.values(GREETING_TEMPLATES).reduce(
    (total, greetings) => total + greetings.length,
    0
  );
}

