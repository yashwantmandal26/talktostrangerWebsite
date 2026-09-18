// icebreakers.js — Curated Indian Conversation Starters, Debates & Fun Dilemmas

export const ICEBREAKER_CATEGORIES = [
  { id: 'all', label: '🎲 All Topics' },
  { id: 'debates', label: '🔥 Spicy Debates' },
  { id: 'bollywood', label: '🎬 Bollywood & Memes' },
  { id: 'relatable', label: '☕ Desi Life & Chai' },
  { id: 'wouldyourather', label: '🤔 Would You Rather' },
];

export const ICEBREAKERS = [
  // Spicy Debates
  {
    category: 'debates',
    tag: 'Spicy Debate',
    text: 'Biryani debate once and for all: Hyderabadi, Kolkata (with aloo), or Lucknowi? Defend your answer! 🍛',
  },
  {
    category: 'debates',
    tag: 'Spicy Debate',
    text: 'Maggi with ketchup: An absolute crime against humanity or surprisingly acceptable? 🍜',
  },
  {
    category: 'debates',
    tag: 'Cricket Debate',
    text: 'Virat Kohli 82* vs Pakistan (2022) OR MS Dhoni 2011 World Cup winning six — which one gave you goosebumps? 🏏',
  },
  {
    category: 'debates',
    tag: 'Chai Debate',
    text: 'Chai vs Coffee: If you could only drink one for the rest of your life, which one stays? ☕',
  },
  {
    category: 'debates',
    tag: 'City War',
    text: 'Which city has the undisputed best street food in India: Delhi, Mumbai, Kolkata, or Indore? 🥟',
  },
  {
    category: 'debates',
    tag: 'Pop Culture',
    text: 'Is Marvel cinema completely dead or can Robert Downey Jr as Dr Doom actually revive it? 🍿',
  },

  // Bollywood & Memes
  {
    category: 'bollywood',
    tag: 'Bollywood',
    text: 'If you had to describe your current life using one Bollywood movie title, what is it? 🎬',
  },
  {
    category: 'bollywood',
    tag: 'Bollywood',
    text: 'What is the most overrated Bollywood movie according to you that everyone else loves? 🎭',
  },
  {
    category: 'bollywood',
    tag: 'Bollywood Dialogue',
    text: 'Drop your all-time favorite Bollywood dialogue and I’ll try to guess the movie without Googling! 🎯',
  },
  {
    category: 'bollywood',
    tag: 'Music',
    text: 'Old school 2000s Bollywood songs (KK, Mohit Chauhan, Emraan Hashmi era) vs Modern Punjabi/Desi Hip-Hop? 🎧',
  },
  {
    category: 'bollywood',
    tag: 'Memes',
    text: 'Hera Pheri, Dhamaal, or Welcome — pick the peak Indian comedy movie of all time! 😂',
  },

  // Desi Life & Chai
  {
    category: 'relatable',
    tag: 'Desi Life',
    text: 'What is the most ridiculous excuse you ever gave your parents to go hang out with friends? 🙈',
  },
  {
    category: 'relatable',
    tag: 'Desi Life',
    text: 'What’s a weird food combination that you secretly love even though others judge you for it? 🥪',
  },
  {
    category: 'relatable',
    tag: 'Night Owl',
    text: 'What’s keeping you awake at this hour? Pure boredom, deep thoughts, or broken sleep cycle? 🌙',
  },
  {
    category: 'relatable',
    tag: 'Travel',
    text: 'The Goa trip that actually happens VS The spontaneous road trip to Himachal — which one is the dream? 🏔️',
  },
  {
    category: 'relatable',
    tag: 'Hostel / College',
    text: 'What is your go-to 2 AM midnight snack when hunger hits hard? 🍟',
  },
  {
    category: 'relatable',
    tag: 'Work & Studies',
    text: 'If money was not an issue at all, what would you genuinely spend your life doing every day? 💼',
  },

  // Would You Rather
  {
    category: 'wouldyourather',
    tag: 'Would You Rather',
    text: 'Would you rather: Be stuck in Bangalore Silk Board traffic for 4 hours OR survive Delhi peak summer without AC? 🚗',
  },
  {
    category: 'wouldyourather',
    tag: 'Would You Rather',
    text: 'Would you rather: Have unlimited free Swiggy/Zomato for life OR unlimited free flight tickets anywhere in India? ✈️',
  },
  {
    category: 'wouldyourather',
    tag: 'Would You Rather',
    text: 'Would you rather: Always speak whatever is on your mind without filter, OR never be able to speak again? 🗣️',
  },
  {
    category: 'wouldyourather',
    tag: 'Would You Rather',
    text: 'Would you rather: Live in the 90s without smartphones & social media, OR in 2050 with full AI robots? 🤖',
  },
];

export function getRandomIcebreaker(category = 'all') {
  const pool = category === 'all'
    ? ICEBREAKERS
    : ICEBREAKERS.filter((item) => item.category === category);
  if (pool.length === 0) return ICEBREAKERS[0];
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}
