// triviaQuestions.js — Indian Pop Culture, Bollywood, Cricket & Desi Trivia Questions

export const TRIVIA_QUESTIONS = [
  {
    id: 1,
    category: 'Bollywood',
    question: 'In the iconic movie "3 Idiots", what was Rancho’s real legal name?',
    options: ['Phunsukh Wangdu', 'Ranchhoddas Chhanchhad', 'Farhan Qureshi', 'Chatur Ramalingam'],
    answer: 0,
  },
  {
    id: 2,
    category: 'Bollywood',
    question: 'Which movie features the legendary meme line: "Utha le re baba, utha le... mereko nahi re, in dono ko utha le!"?',
    options: ['Dhamaal', 'Welcome', 'Hera Pheri', 'Golmaal: Fun Unlimited'],
    answer: 2,
  },
  {
    id: 3,
    category: 'Cricket',
    question: 'Against which country did Rohit Sharma hit his record-breaking 264 ODI runs in 2014?',
    options: ['Australia', 'Sri Lanka', 'West Indies', 'South Africa'],
    answer: 1,
  },
  {
    id: 4,
    category: 'Bollywood',
    question: 'In "Sholay", what was the name of Basanti’s horse?',
    options: ['Badal', 'Dhanno', 'Chetak', 'Toofan'],
    answer: 1,
  },
  {
    id: 5,
    category: 'Cricket',
    question: 'Who bowled the historic final over in the 2007 T20 World Cup Final against Pakistan?',
    options: ['S. Sreesanth', 'Joginder Sharma', 'Irfan Pathan', 'Harbhajan Singh'],
    answer: 1,
  },
  {
    id: 6,
    category: 'Desi Food',
    question: 'Which Indian city is globally world-famous for its distinct "Hyderabadi Dum Biryani"?',
    options: ['Lucknow', 'Hyderabad', 'Kolkata', 'Bhopal'],
    answer: 1,
  },
  {
    id: 7,
    category: 'Bollywood',
    question: 'In "Dangal", which real-life wrestler did Aamir Khan portray on screen?',
    options: ['Mahavir Singh Phogat', 'Sushil Kumar', 'Yogeshwar Dutt', 'Bajrang Punia'],
    answer: 0,
  },
  {
    id: 8,
    category: 'Pop Culture',
    question: 'Which Indian song became the first Indian film song to win the Oscar for Best Original Song in 2023?',
    options: ['Jai Ho', 'Naatu Naatu', 'Kesariya', 'Chaiyya Chaiyya'],
    answer: 1,
  },
  {
    id: 9,
    category: 'Cricket',
    question: 'Which team won the inaugural edition of the Indian Premier League (IPL) in 2008?',
    options: ['Chennai Super Kings', 'Mumbai Indians', 'Rajasthan Royals', 'Kolkata Knight Riders'],
    answer: 2,
  },
  {
    id: 10,
    category: 'Bollywood',
    question: 'Complete the dialogue: "Bade bade deshon mein aisi choti choti baatein..."',
    options: ['...hoti rehti hai, Senorita', '...chalti rehti hai, dost', '...yaad nahi rehti', '...bhool jaani chahiye'],
    answer: 0,
  },
  {
    id: 11,
    category: 'Desi Culture',
    question: 'What is the literal translation of the popular Hindi slang word "Jugaad"?',
    options: ['Hard work', 'Innovative / makeshift fix', 'Shortcut scam', 'Government approval'],
    answer: 1,
  },
  {
    id: 12,
    category: 'Bollywood',
    question: 'In "Yeh Jawaani Hai Deewani", what was Bunny’s dream profession?',
    options: ['Travel Photographer / Videographer', 'Investment Banker', 'Bollywood Actor', 'Chef in Paris'],
    answer: 0,
  },
  {
    id: 13,
    category: 'Geography',
    question: 'Which Indian city is affectionately known as the "Silicon Valley of India"?',
    options: ['Hyderabad', 'Pune', 'Bengaluru', 'Gurugram'],
    answer: 2,
  },
  {
    id: 14,
    category: 'Cricket',
    question: 'Who holds the record for the fastest 50 in T20 International cricket for India (12 balls)?',
    options: ['Yuvraj Singh', 'Suryakumar Yadav', 'Hardik Pandya', 'Rishabh Pant'],
    answer: 0,
  },
  {
    id: 15,
    category: 'Bollywood',
    question: 'In "Gangs of Wasseypur", who played the ruthless character Sardar Khan?',
    options: ['Nawazuddin Siddiqui', 'Manoj Bajpayee', 'Pankaj Tripathi', 'Tigmanshu Dhulia'],
    answer: 1,
  },
  {
    id: 16,
    category: 'Desi Food',
    question: 'Poha and Jalebi is the quintessential breakfast combination of which Indian state/region?',
    options: ['Gujarat', 'Madhya Pradesh (Malwa)', 'Punjab', 'Rajasthan'],
    answer: 1,
  },
  {
    id: 17,
    category: 'Bollywood',
    question: 'Which character famously declared: "Teja main hoon, mark idhar hai!"?',
    options: ['Crime Master Gogo', 'Teja / Amar Prem', 'Robert', 'Bhallaladeva'],
    answer: 1,
  },
  {
    id: 18,
    category: 'Cricket',
    question: 'How many times has MS Dhoni captained Chennai Super Kings (CSK) to IPL trophies?',
    options: ['3 times', '4 times', '5 times', '6 times'],
    answer: 2,
  },
];

export function getRandomQuizSet(count = 5) {
  const shuffled = [...TRIVIA_QUESTIONS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
