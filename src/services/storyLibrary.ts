/**
 * Story Library - Collection of conversation starters for Wakattors
 *
 * Stories are shown via Toast when a new conversation starts,
 * then Wakattors discuss the topic until the user joins.
 */

export type StoryType =
  | 'scenario' | 'theme'           // Original
  | 'hypothetical' | 'memory'      // Narrative
  | 'dream' | 'confession'
  | 'dilemma' | 'debate'           // Interactive
  | 'challenge' | 'riddle'
  | 'gossip' | 'secret'            // Social
  | 'recommendation'
  | 'discovery' | 'observation'    // Observational
  | 'prediction'
  | 'joke' | 'nostalgia';          // Light

export interface Story {
  id: string;
  type: StoryType;
  toastText: string;        // Short text for Toast display (max ~50 chars)
  fullContext: string;      // Full context for AI prompt
  characterMatch?: string[]; // Optional: prefer certain characters (by id)
}

// ============================================
// STORY COLLECTION
// ============================================

const STORIES: Story[] = [
  // ============================================
  // SCENARIOS (Narrative hooks)
  // ============================================
  {
    id: 'scenario-old-letter',
    type: 'scenario',
    toastText: 'Jung found an old letter...',
    fullContext: 'Jung just discovered an old letter from a former patient, written years ago but never sent. The letter contains a confession that changes everything they thought they knew about that case.',
  },
  {
    id: 'scenario-cancelled-patient',
    type: 'scenario',
    toastText: 'A patient cancelled unexpectedly...',
    fullContext: 'A patient who has been coming for years suddenly cancelled all future appointments with no explanation. The characters are speculating about what might have happened.',
  },
  {
    id: 'scenario-strange-visitor',
    type: 'scenario',
    toastText: 'A stranger appeared at the door...',
    fullContext: 'A mysterious stranger appeared at the office claiming to have information about one of the characters\' most famous theories. They left without giving their name.',
  },
  {
    id: 'scenario-missing-notes',
    type: 'scenario',
    toastText: 'The case notes have vanished...',
    fullContext: 'Important case notes have gone missing from the office. Someone moved them, but who? And why? The characters are trying to piece together what happened.',
  },

  // ============================================
  // THEMES (Philosophical topics)
  // ============================================
  {
    id: 'theme-dreams',
    type: 'theme',
    toastText: 'The nature of dreams...',
    fullContext: 'The characters are discussing what dreams really mean. Are they messages from the unconscious? Random neural firing? Windows into hidden desires?',
  },
  {
    id: 'theme-self',
    type: 'theme',
    toastText: 'What defines the self?',
    fullContext: 'A deep discussion about personal identity. What makes you "you"? Is there a core self, or are we constantly changing? How much of ourselves do we truly know?',
  },
  {
    id: 'theme-suffering',
    type: 'theme',
    toastText: 'The meaning of suffering...',
    fullContext: 'Why do humans suffer? Is there purpose in pain? The characters debate whether suffering is necessary for growth or simply something to be minimized.',
  },
  {
    id: 'theme-forgetting',
    type: 'theme',
    toastText: 'Why do we forget?',
    fullContext: 'The psychology of forgetting. Is it protective? Do we forget on purpose? What happens to memories that seem lost? Can anything truly be forgotten?',
  },
  {
    id: 'theme-love',
    type: 'theme',
    toastText: 'The psychology of love...',
    fullContext: 'What is love, really? Is it chemical? Evolutionary? Spiritual? The characters explore the many faces of love and attachment.',
  },
  {
    id: 'theme-creativity',
    type: 'theme',
    toastText: 'Where does creativity come from?',
    fullContext: 'The source of creative inspiration. Does it bubble up from the unconscious? Is it divine? Can it be cultivated, or is it a gift some have and others don\'t?',
  },

  // ============================================
  // HYPOTHETICALS (What-if scenarios)
  // ============================================
  {
    id: 'hypo-read-minds',
    type: 'hypothetical',
    toastText: 'What if you could read minds?',
    fullContext: 'If you could read the minds of your patients for one day, would you? What would you hope to find? What would you fear discovering?',
  },
  {
    id: 'hypo-share-memories',
    type: 'hypothetical',
    toastText: 'What if memories could be shared?',
    fullContext: 'Imagine if you could transfer a memory from one person to another. How would therapy change? Would it be helpful or dangerous?',
  },
  {
    id: 'hypo-erase-trauma',
    type: 'hypothetical',
    toastText: 'What if trauma could be erased?',
    fullContext: 'If there was a pill that could erase traumatic memories completely, should it exist? Would removing the pain also remove something essential?',
  },
  {
    id: 'hypo-immortality',
    type: 'hypothetical',
    toastText: 'What if humans lived forever?',
    fullContext: 'How would the human psyche change if death was no longer inevitable? Would we find new meaning, or lose all motivation?',
  },

  // ============================================
  // MEMORIES (Shared past experiences)
  // ============================================
  {
    id: 'memory-vienna',
    type: 'memory',
    toastText: 'Remember Vienna, 1909?',
    fullContext: 'The characters are reminiscing about a pivotal conference in Vienna where they first presented their ideas to the world. The reactions were... memorable.',
  },
  {
    id: 'memory-first-patient',
    type: 'memory',
    toastText: 'My very first patient...',
    fullContext: 'One of the characters is remembering their very first patient - the case that shaped everything that came after. The lessons learned still resonate.',
  },
  {
    id: 'memory-breakthrough',
    type: 'memory',
    toastText: 'The day everything changed...',
    fullContext: 'Remembering a moment of breakthrough - when a theory suddenly crystallized, when understanding dawned, when years of work finally made sense.',
  },
  {
    id: 'memory-mistake',
    type: 'memory',
    toastText: 'A mistake I\'ll never forget...',
    fullContext: 'One of the characters is reflecting on a professional mistake that haunts them. What went wrong? What did they learn? Do they still carry guilt?',
  },

  // ============================================
  // DREAMS (Dream narratives)
  // ============================================
  {
    id: 'dream-recurring',
    type: 'dream',
    toastText: 'A recurring dream haunts me...',
    fullContext: 'One of the characters has been having the same dream repeatedly. They\'re trying to interpret its meaning with the others\' help.',
  },
  {
    id: 'dream-strange',
    type: 'dream',
    toastText: 'I had the strangest dream...',
    fullContext: 'A vivid, bizarre dream from last night. Flying fish? Speaking shadows? The imagery is wild, and the interpretation is up for debate.',
  },
  {
    id: 'dream-prophetic',
    type: 'dream',
    toastText: 'Was this dream prophetic?',
    fullContext: 'A dream that seemed to predict something that later happened. Coincidence? The unconscious picking up on subtle cues? Or something more mysterious?',
  },

  // ============================================
  // CONFESSIONS (Personal admissions)
  // ============================================
  {
    id: 'confession-doubt',
    type: 'confession',
    toastText: 'I\'ve never told anyone this...',
    fullContext: 'One of the characters is about to share something they\'ve kept secret - a doubt, a fear, a hidden truth about themselves or their work.',
  },
  {
    id: 'confession-wrong',
    type: 'confession',
    toastText: 'I think I was wrong about...',
    fullContext: 'A character is admitting they may have been wrong about something they\'ve publicly defended for years. What changed their mind?',
  },
  {
    id: 'confession-envy',
    type: 'confession',
    toastText: 'I must admit, I was envious...',
    fullContext: 'One character confessing to professional jealousy toward another. The admission opens up a vulnerable conversation about competition and recognition.',
  },

  // ============================================
  // DILEMMAS (Ethical puzzles)
  // ============================================
  {
    id: 'dilemma-lie',
    type: 'dilemma',
    toastText: 'Should I lie to protect them?',
    fullContext: 'A patient has asked to lie to their family about the diagnosis. It would spare pain but prevent honest closure. What\'s the right thing to do?',
  },
  {
    id: 'dilemma-danger',
    type: 'dilemma',
    toastText: 'When a patient becomes dangerous...',
    fullContext: 'A patient has revealed thoughts of harming someone. When does confidentiality yield to preventing harm? Where is the line?',
  },
  {
    id: 'dilemma-truth',
    type: 'dilemma',
    toastText: 'Is the truth always helpful?',
    fullContext: 'Sometimes the truth hurts more than it helps. Should a therapist always push for truth, or are some illusions worth preserving?',
  },

  // ============================================
  // DEBATES (Arguments in progress)
  // ============================================
  {
    id: 'debate-free-will',
    type: 'debate',
    toastText: 'Free will is an illusion!',
    fullContext: 'A heated debate about determinism. Are we truly free to choose, or are all our decisions predetermined by unconscious forces, biology, and circumstance?',
  },
  {
    id: 'debate-nature-nurture',
    type: 'debate',
    toastText: 'Nature versus nurture...',
    fullContext: 'The eternal debate: how much of who we are is innate versus shaped by experience? The characters have strong, differing opinions.',
  },
  {
    id: 'debate-medication',
    type: 'debate',
    toastText: 'Should we medicate the mind?',
    fullContext: 'A debate about psychiatric medication. Is it a valuable tool or a crutch that prevents real healing? Where\'s the balance?',
  },

  // ============================================
  // CHALLENGES (Intellectual provocations)
  // ============================================
  {
    id: 'challenge-fear-dark',
    type: 'challenge',
    toastText: 'Why do humans fear the dark?',
    fullContext: 'A challenge to explain the universal fear of darkness. Is it evolutionary? Symbolic? What does our fear of the dark reveal about the human psyche?',
  },
  {
    id: 'challenge-why-dream',
    type: 'challenge',
    toastText: 'Why do we dream at all?',
    fullContext: 'What is the purpose of dreaming? Memory consolidation? Wish fulfillment? Random noise? A challenge to provide a satisfying explanation.',
  },
  {
    id: 'challenge-happiness',
    type: 'challenge',
    toastText: 'Can anyone be truly happy?',
    fullContext: 'Is lasting happiness possible, or is the human condition fundamentally one of striving and dissatisfaction? A challenge to define and defend happiness.',
  },

  // ============================================
  // RIDDLES (Puzzles and mysteries)
  // ============================================
  {
    id: 'riddle-patient',
    type: 'riddle',
    toastText: 'A patient spoke in riddles...',
    fullContext: 'A patient came in speaking only in metaphors and riddles. The characters are trying to decode what they were really saying.',
  },
  {
    id: 'riddle-behavior',
    type: 'riddle',
    toastText: 'Why would someone do this?',
    fullContext: 'A puzzling case: a patient\'s behavior makes no logical sense on the surface. The characters are playing detective to understand the hidden logic.',
  },

  // ============================================
  // GOSSIP (Light social talk)
  // ============================================
  {
    id: 'gossip-colleague',
    type: 'gossip',
    toastText: 'Did you hear about Dr. Smith?',
    fullContext: 'Some juicy professional gossip about a colleague. A scandal? A surprising career move? The characters are catching up on the latest news.',
  },
  {
    id: 'gossip-conference',
    type: 'gossip',
    toastText: 'You won\'t believe what happened...',
    fullContext: 'Something dramatic happened at a recent conference. The characters are sharing their versions of the story with increasing embellishment.',
  },

  // ============================================
  // SECRETS (Hidden knowledge)
  // ============================================
  {
    id: 'secret-discovered',
    type: 'secret',
    toastText: 'Can you keep a secret?',
    fullContext: 'One character has discovered something they probably shouldn\'t know. Should they share it? With whom? What are the consequences of knowing?',
  },
  {
    id: 'secret-theory',
    type: 'secret',
    toastText: 'I have a secret theory...',
    fullContext: 'A character has developed a theory they\'re not ready to publish. It\'s radical, possibly controversial. They\'re testing it on their colleagues first.',
  },

  // ============================================
  // RECOMMENDATIONS (Sharing discoveries)
  // ============================================
  {
    id: 'recommend-book',
    type: 'recommendation',
    toastText: 'You MUST read this book!',
    fullContext: 'One character is enthusiastically recommending a book that changed their thinking. The others are skeptical but curious.',
  },
  {
    id: 'recommend-case',
    type: 'recommendation',
    toastText: 'I found a fascinating case...',
    fullContext: 'A character has discovered an old case study that\'s remarkably relevant to current discussions. They\'re sharing the details.',
  },

  // ============================================
  // DISCOVERIES (Eureka moments)
  // ============================================
  {
    id: 'discovery-pattern',
    type: 'discovery',
    toastText: 'I just realized something...',
    fullContext: 'A character just had an insight - a pattern they\'ve noticed, a connection they\'ve made. They\'re excitedly sharing their eureka moment.',
  },
  {
    id: 'discovery-research',
    type: 'discovery',
    toastText: 'A pattern emerged in my research...',
    fullContext: 'After years of data, a pattern has finally emerged. It might confirm a theory, or it might challenge everything. The implications are being discussed.',
  },

  // ============================================
  // OBSERVATIONS (Noticing things)
  // ============================================
  {
    id: 'observation-behavior',
    type: 'observation',
    toastText: 'I noticed something peculiar...',
    fullContext: 'A character noticed something odd about human behavior - in a patient, on the street, in themselves. They\'re analyzing what it might mean.',
  },
  {
    id: 'observation-society',
    type: 'observation',
    toastText: 'Society is changing rapidly...',
    fullContext: 'An observation about how society and human behavior are evolving. What does it mean for the psyche? For therapy? For the future?',
  },

  // ============================================
  // PREDICTIONS (Future forecasting)
  // ============================================
  {
    id: 'prediction-psychology',
    type: 'prediction',
    toastText: 'I have a theory about the future...',
    fullContext: 'A character is making predictions about the future of psychology, therapy, or human nature. Bold claims that invite debate.',
  },
  {
    id: 'prediction-humanity',
    type: 'prediction',
    toastText: 'Mark my words...',
    fullContext: 'A confident prediction about where humanity is heading. Optimistic? Pessimistic? The others have thoughts about this forecast.',
  },

  // ============================================
  // JOKES (Humor and levity)
  // ============================================
  {
    id: 'joke-patient',
    type: 'joke',
    toastText: 'A patient told me the funniest thing...',
    fullContext: 'Time for some levity. A patient said something unintentionally hilarious, or a therapy session took an unexpectedly funny turn.',
  },
  {
    id: 'joke-profession',
    type: 'joke',
    toastText: 'Have you heard the one about...?',
    fullContext: 'Psychology jokes, therapist humor, or witty observations about the profession. The characters are in a playful mood.',
  },
  {
    id: 'joke-self',
    type: 'joke',
    toastText: 'I have to laugh at myself...',
    fullContext: 'Self-deprecating humor. A character is sharing an embarrassing moment or acknowledging their own quirks with good humor.',
  },

  // ============================================
  // NOSTALGIA (Looking back)
  // ============================================
  {
    id: 'nostalgia-old-days',
    type: 'nostalgia',
    toastText: 'Back in my day...',
    fullContext: 'Reminiscing about how things used to be. Better? Worse? Different? The characters are comparing past and present with varying degrees of wistfulness.',
  },
  {
    id: 'nostalgia-simpler',
    type: 'nostalgia',
    toastText: 'Things were simpler then...',
    fullContext: 'A nostalgic look at simpler times. Was life really easier before, or is memory playing tricks? A meditation on change and loss.',
  },
  {
    id: 'nostalgia-youth',
    type: 'nostalgia',
    toastText: 'When I was young...',
    fullContext: 'Stories from youth - the dreams, the naivety, the energy. How much has changed? What remains the same? A warm trip down memory lane.',
  },

  // ============================================
  // ADDITIONAL STORIES (to reach 100+)
  // ============================================

  // Daily Life & Observations
  {
    id: 'obs-morning-ritual',
    type: 'observation',
    toastText: 'Morning rituals reveal so much...',
    fullContext: 'The characters discuss how morning routines reflect our inner state. What does your first hour reveal about your priorities and fears?',
  },
  {
    id: 'obs-strangers',
    type: 'observation',
    toastText: 'The lives of strangers fascinate me...',
    fullContext: 'Watching people on the street - what stories do their faces tell? The characters speculate about the inner lives of passersby.',
  },
  {
    id: 'obs-silence',
    type: 'observation',
    toastText: 'Silence speaks volumes...',
    fullContext: 'The different types of silence: comfortable, awkward, heavy, healing. What does silence reveal that words cannot?',
  },
  {
    id: 'obs-handwriting',
    type: 'observation',
    toastText: 'Handwriting reveals personality...',
    fullContext: 'Can you read someone through their handwriting? The characters examine specimens and debate what the loops and slants mean.',
  },
  {
    id: 'obs-waiting',
    type: 'observation',
    toastText: 'How people wait is telling...',
    fullContext: 'In waiting rooms, bus stops, queues - how people fill empty time reveals their inner world. What do you do while waiting?',
  },

  // Emotions & Feelings
  {
    id: 'theme-loneliness',
    type: 'theme',
    toastText: 'The epidemic of loneliness...',
    fullContext: 'Why do so many feel alone even when surrounded by people? The difference between solitude and loneliness. Can we cure isolation?',
  },
  {
    id: 'theme-anger',
    type: 'theme',
    toastText: 'What is anger really saying?',
    fullContext: 'Beneath every anger lies something else - fear, hurt, frustration. The characters explore the messages hidden in rage.',
  },
  {
    id: 'theme-joy',
    type: 'theme',
    toastText: 'What does pure joy feel like?',
    fullContext: 'Moments of genuine happiness - are they rare? Can they be cultivated? The characters share their experiences of true joy.',
  },
  {
    id: 'theme-guilt',
    type: 'theme',
    toastText: 'The weight of guilt...',
    fullContext: 'Healthy guilt versus toxic shame. When does guilt serve us, and when does it become a prison? How do we forgive ourselves?',
  },
  {
    id: 'theme-envy',
    type: 'theme',
    toastText: 'Why do we envy others?',
    fullContext: 'The psychology of envy. What does jealousy reveal about our own desires? Can envy ever be constructive?',
  },
  {
    id: 'theme-nostalgia',
    type: 'theme',
    toastText: 'Why does nostalgia hurt so good?',
    fullContext: 'The bittersweet ache of remembering. Why do we long for the past even when the present is good? Is nostalgia healthy?',
  },

  // Relationships & Connection
  {
    id: 'theme-friendship',
    type: 'theme',
    toastText: 'What makes a true friend?',
    fullContext: 'The qualities of deep friendship. How do we recognize real connection? Why do some friendships last while others fade?',
  },
  {
    id: 'theme-boundaries',
    type: 'theme',
    toastText: 'The art of saying no...',
    fullContext: 'Setting healthy boundaries - why is it so hard? The guilt, the fear of rejection. How do we protect ourselves while staying open?',
  },
  {
    id: 'theme-trust',
    type: 'theme',
    toastText: 'How do we rebuild trust?',
    fullContext: 'After betrayal, can trust be restored? The slow process of rebuilding. Is forgiveness required for healing?',
  },
  {
    id: 'theme-family',
    type: 'theme',
    toastText: 'Family shapes us forever...',
    fullContext: 'The lasting impact of family dynamics. How do we break unhealthy patterns? Can we choose our own path while honoring our roots?',
  },
  {
    id: 'theme-attachment',
    type: 'theme',
    toastText: 'Our attachment styles define us...',
    fullContext: 'Anxious, avoidant, secure - how early bonds shape all our relationships. Can attachment patterns be changed?',
  },

  // Self-Discovery
  {
    id: 'theme-masks',
    type: 'theme',
    toastText: 'The masks we wear...',
    fullContext: 'The different versions of ourselves we present to the world. Are any of them the "real" us? What happens when masks slip?',
  },
  {
    id: 'theme-purpose',
    type: 'theme',
    toastText: 'Finding purpose in life...',
    fullContext: 'Is there a destined purpose, or do we create our own meaning? How do people find what they\'re meant to do?',
  },
  {
    id: 'theme-authenticity',
    type: 'theme',
    toastText: 'Being truly authentic...',
    fullContext: 'What does it mean to be genuine? The courage to be yourself despite pressure to conform. Is total authenticity even possible?',
  },
  {
    id: 'theme-shadow',
    type: 'theme',
    toastText: 'Embracing our shadow side...',
    fullContext: 'The parts of ourselves we hide or deny. What happens when we integrate our darker aspects instead of suppressing them?',
  },
  {
    id: 'theme-growth',
    type: 'theme',
    toastText: 'Can people truly change?',
    fullContext: 'The debate about personal transformation. Are we fixed, or forever capable of becoming someone new? What triggers real change?',
  },

  // Hypotheticals & Thought Experiments
  {
    id: 'hypo-no-fear',
    type: 'hypothetical',
    toastText: 'What if you had no fear?',
    fullContext: 'If fear vanished completely, what would you do differently? Would fearlessness be a gift or a curse?',
  },
  {
    id: 'hypo-truth-serum',
    type: 'hypothetical',
    toastText: 'What if everyone spoke only truth?',
    fullContext: 'A world without lies. Would society collapse or flourish? What role do white lies play in human connection?',
  },
  {
    id: 'hypo-relive-day',
    type: 'hypothetical',
    toastText: 'What day would you relive?',
    fullContext: 'If you could experience one day from your past again, which would it be? Would you change anything or just observe?',
  },
  {
    id: 'hypo-switch-lives',
    type: 'hypothetical',
    toastText: 'Would you switch lives with someone?',
    fullContext: 'If you could trade places with anyone for a year, who would it be? What do you imagine they experience that you don\'t?',
  },
  {
    id: 'hypo-know-death',
    type: 'hypothetical',
    toastText: 'Would you want to know when you\'ll die?',
    fullContext: 'If you could know the exact date of your death, would you want to? How would that knowledge change how you live?',
  },
  {
    id: 'hypo-perfect-memory',
    type: 'hypothetical',
    toastText: 'What if you remembered everything?',
    fullContext: 'Perfect recall of every moment - blessing or curse? The role of forgetting in mental health and moving forward.',
  },

  // Dilemmas & Decisions
  {
    id: 'dilemma-honesty',
    type: 'dilemma',
    toastText: 'Honesty vs. kindness...',
    fullContext: 'When the truth will hurt, is it better to be honest or kind? Where is the balance between authenticity and compassion?',
  },
  {
    id: 'dilemma-past-mistakes',
    type: 'dilemma',
    toastText: 'When past mistakes resurface...',
    fullContext: 'Something from long ago threatens to come to light. Should you confess preemptively or hope it stays buried?',
  },
  {
    id: 'dilemma-loyalty',
    type: 'dilemma',
    toastText: 'Loyalty to self vs. others...',
    fullContext: 'When your needs conflict with those you care about, how do you choose? Is self-sacrifice noble or self-destructive?',
  },

  // Philosophical Questions
  {
    id: 'debate-consciousness',
    type: 'debate',
    toastText: 'What is consciousness anyway?',
    fullContext: 'The hard problem of consciousness. How do physical brain processes create subjective experience? Are we more than our neurons?',
  },
  {
    id: 'debate-afterlife',
    type: 'debate',
    toastText: 'What happens after we die?',
    fullContext: 'The eternal question. Does consciousness persist? Is there an afterlife, reincarnation, or simply nothing? What do we hope for?',
  },
  {
    id: 'debate-meaning',
    type: 'debate',
    toastText: 'Does life have inherent meaning?',
    fullContext: 'Is meaning discovered or created? The existentialist view versus the belief in cosmic purpose. How does this shape how we live?',
  },
  {
    id: 'debate-evil',
    type: 'debate',
    toastText: 'Is anyone truly evil?',
    fullContext: 'Are some people born bad, or does evil arise from circumstances? Can we understand without excusing? The nature of moral failing.',
  },

  // Personal Challenges
  {
    id: 'challenge-regret',
    type: 'challenge',
    toastText: 'What is your biggest regret?',
    fullContext: 'A vulnerable question about roads not taken. What would you do differently? Can we make peace with our regrets?',
  },
  {
    id: 'challenge-proud',
    type: 'challenge',
    toastText: 'What are you most proud of?',
    fullContext: 'A moment of genuine pride - not just achievement, but character. What accomplishment defines who you are?',
  },
  {
    id: 'challenge-fear',
    type: 'challenge',
    toastText: 'What fear holds you back most?',
    fullContext: 'The fear that shapes your choices. What would you do if it didn\'t exist? How do we overcome our deepest fears?',
  },

  // Light Topics
  {
    id: 'joke-therapy-dog',
    type: 'joke',
    toastText: 'My patient brought their dog...',
    fullContext: 'A funny story about an unexpected therapy session. The pet who attended, the chaos that ensued, the lesson learned.',
  },
  {
    id: 'joke-freudian-slip',
    type: 'joke',
    toastText: 'The most embarrassing slip...',
    fullContext: 'A collection of hilarious Freudian slips - accidental revelations that couldn\'t be unsaid. The humor in human psychology.',
  },
  {
    id: 'gossip-rival',
    type: 'gossip',
    toastText: 'Our old rival published again...',
    fullContext: 'A professional rival has a new book/paper out. The characters are reading between the lines and finding it amusing.',
  },

  // Dreams & Symbolism
  {
    id: 'dream-flying',
    type: 'dream',
    toastText: 'Dreams of flying mean what?',
    fullContext: 'The universal dream of flight. Freedom? Escape? Ambition? The characters debate interpretations of this common dream.',
  },
  {
    id: 'dream-teeth',
    type: 'dream',
    toastText: 'Why do we dream about losing teeth?',
    fullContext: 'One of the most common nightmares. Loss of control? Fear of aging? Anxiety about appearance? Multiple theories explored.',
  },
  {
    id: 'dream-chase',
    type: 'dream',
    toastText: 'Being chased in dreams...',
    fullContext: 'Running from something unknown. What are we really fleeing? The metaphors of pursuit in our unconscious.',
  },

  // Modern Life
  {
    id: 'obs-screens',
    type: 'observation',
    toastText: 'We\'re all glued to screens...',
    fullContext: 'The psychological impact of constant connectivity. Are we more connected or more isolated? What are we avoiding?',
  },
  {
    id: 'obs-comparison',
    type: 'observation',
    toastText: 'Social media and comparison...',
    fullContext: 'The endless comparison to curated lives. How does seeing everyone\'s highlights affect our sense of self?',
  },
  {
    id: 'obs-busyness',
    type: 'observation',
    toastText: 'Why are we always so busy?',
    fullContext: 'The cult of busyness. Is constant activity productive or avoidant? What are we running from by never stopping?',
  },

  // Wisdom & Advice
  {
    id: 'recommend-habit',
    type: 'recommendation',
    toastText: 'This one habit changed everything...',
    fullContext: 'A small practice that had outsized impact. The power of tiny changes. What habit would you recommend to anyone?',
  },
  {
    id: 'recommend-question',
    type: 'recommendation',
    toastText: 'The most powerful question...',
    fullContext: 'A single question that unlocks insight. What question do you ask yourself or your patients that reveals the most?',
  },
  {
    id: 'discovery-connection',
    type: 'discovery',
    toastText: 'Everything is connected...',
    fullContext: 'A sudden realization about how seemingly unrelated things are linked. The web of causation in human psychology.',
  },

  // Secrets & Confessions
  {
    id: 'confession-imposter',
    type: 'confession',
    toastText: 'Sometimes I feel like a fraud...',
    fullContext: 'Imposter syndrome even among experts. The secret doubt that you don\'t really know what you\'re doing. Is anyone immune?',
  },
  {
    id: 'confession-tired',
    type: 'confession',
    toastText: 'I\'m exhausted by people...',
    fullContext: 'The burnout of caring professions. When empathy becomes draining. How do healers heal themselves?',
  },
  {
    id: 'secret-hope',
    type: 'secret',
    toastText: 'My secret hope for humanity...',
    fullContext: 'A private optimism or pessimism about where we\'re heading. What do you really believe about human potential?',
  },
];

// ============================================
// FUNCTIONS
// ============================================

/**
 * Get a random story, optionally filtered by character preferences
 */
export function getRandomStory(characterIds?: string[]): Story {
  let candidates = STORIES;

  // If character IDs provided, prefer stories that match those characters
  if (characterIds && characterIds.length > 0) {
    const matchedStories = STORIES.filter(story => {
      if (!story.characterMatch) return true; // Stories without preference are always candidates
      return story.characterMatch.some(id => characterIds.includes(id));
    });

    // Only use matched stories if we found some, otherwise fall back to all
    if (matchedStories.length > 0) {
      candidates = matchedStories;
    }
  }

  const randomIndex = Math.floor(Math.random() * candidates.length);
  return candidates[randomIndex];
}

/**
 * Get all stories of a specific type
 */
export function getStoriesByType(type: StoryType): Story[] {
  return STORIES.filter(story => story.type === type);
}

/**
 * Get a random story of a specific type
 */
export function getRandomStoryByType(type: StoryType): Story | null {
  const stories = getStoriesByType(type);
  if (stories.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * stories.length);
  return stories[randomIndex];
}

/**
 * Get story by ID
 */
export function getStoryById(id: string): Story | undefined {
  return STORIES.find(story => story.id === id);
}

/**
 * Get all available story types
 */
export function getAvailableTypes(): StoryType[] {
  const types = new Set<StoryType>();
  STORIES.forEach(story => types.add(story.type));
  return Array.from(types);
}

/**
 * Get count of stories by type
 */
export function getStoryCountByType(): Record<StoryType, number> {
  const counts: Partial<Record<StoryType, number>> = {};
  STORIES.forEach(story => {
    counts[story.type] = (counts[story.type] || 0) + 1;
  });
  return counts as Record<StoryType, number>;
}

// Export the total count for reference
export const TOTAL_STORY_COUNT = STORIES.length;
