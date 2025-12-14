let BLOCKED_PATTERNS = [];
let profanityLoaded = false;

async function loadProfanityList() {
  if (profanityLoaded) return;
  
  try {
    const response = await fetch('https://raw.githubusercontent.com/dsojevic/profanity-list/refs/heads/main/en.json');
    const data = await response.json();
    

    if (Array.isArray(data)) {
      BLOCKED_PATTERNS = data
        .filter(item => item.match)
        .map(item => {
        
          const patterns = item.match.split('|').map(p => p.trim()).filter(p => p);
          return patterns;
        })
        .flat();
    }
    
    profanityLoaded = true;
    console.log(`Loaded ${BLOCKED_PATTERNS.length} profanity patterns`);
  } catch (error) {
    console.error('Failed to load profanity list:', error);
    BLOCKED_PATTERNS = [];
    profanityLoaded = true;
  }
}

export async function checkAutomod(text) {
  if (!profanityLoaded) {
    await loadProfanityList();
  }

  const lowerText = text.toLowerCase();
  
  for (const pattern of BLOCKED_PATTERNS) {
    if (!pattern) continue;
    

    const normalizedPattern = pattern.toLowerCase();
    const normalizedText = lowerText;
    

    if (normalizedText.includes(normalizedPattern)) {
      return {
        approved: false,
        reason: 'Message contains inappropriate content'
      };
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
