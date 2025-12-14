let BLOCKED_WORDS = [];
let profanityLoaded = false;

async function loadProfanityList() {
  if (profanityLoaded) return;
  
  try {
    const response = await fetch('https://raw.githubusercontent.com/dsojevic/profanity-list/refs/heads/main/en.json');
    const data = await response.json();
    BLOCKED_WORDS = Array.isArray(data) ? data : Object.keys(data);
    profanityLoaded = true;
    console.log(`Loaded ${BLOCKED_WORDS.length} profanity words`);
  } catch (error) {
    console.error('Failed to load profanity list:', error);
    BLOCKED_WORDS = [];
    profanityLoaded = true;
  }
}

export async function checkAutomod(text) {
  if (!profanityLoaded) {
    await loadProfanityList();
  }

  const lowerText = text.toLowerCase();
  
  for (const word of BLOCKED_WORDS) {
    if (!word) continue;
    try {
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedWord}\\b`, 'gi');
      if (regex.test(lowerText)) {
        return {
          approved: false,
          reason: 'Message contains inappropriate content'
        };
      }
    } catch (e) {
      continue;
    }
  }

  return {
    approved: true,
    reason: null
  };
}

export function sanitizeMessage(text) {
  
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&[a-z]+;/g, '') 
    .trim();
}
