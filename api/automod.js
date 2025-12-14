const BLOCKED_WORDS = [
  'badword1',
  'badword2',
  'slur',

];

export function checkAutomod(text) {
  const lowerText = text.toLowerCase();
  
  
  for (const word of BLOCKED_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    if (regex.test(lowerText)) {
      return {
        approved: false,
        reason: 'Message contains inappropriate content'
      };
    }
  }

  
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (capsRatio > 0.7 && text.length > 10) {
    return {
      approved: false,
      reason: 'Message appears to be spam'
    };
  }

  
  if (/(.)\1{9,}/.test(text)) {
    return {
      approved: false,
      reason: 'Message appears to be spam'
    };
  }

  
  if (text.length < 3 || text.length > 500) {
    return {
      approved: false,
      reason: 'Message must be between 3 and 500 characters'
    };
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
