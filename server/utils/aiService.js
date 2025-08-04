const OpenAI = require('openai');

// Initialize OpenAI client only if API key is provided
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

/**
 * Generate an AI comment for a confession
 * @param {string} confessionContent - The confession text
 * @param {string} mood - The mood of the confession (optional)
 * @param {string} location - The location (optional)
 * @returns {Promise<string>} The generated comment
 */
async function generateAIComment(confessionContent, mood = '', location = '') {
  try {
    console.log('AI Service: generateAIComment called with:', { confessionContent, mood, location });
    
    // Check if OpenAI is available
    if (!openai) {
      console.log('OpenAI API key not provided, using mock AI responses');
      return generateMockAIComment(confessionContent, mood, location);
    }

    console.log('OpenAI client is available, proceeding with comment generation');

    // AI will respond to every confession
    // (removed the random chance check)

    // Determine the tone (fun or serious)
    const isSerious = Math.random() > 0.5;
    const tone = isSerious ? 'serious and supportive' : 'lighthearted and fun';

    // Build context for the AI
    let context = `This is a confession from a social media platform called Confessly where people share anonymous confessions.`;
    
    if (mood) {
      context += ` The confession has a mood of: ${mood}.`;
    }
    
    if (location) {
      context += ` It's from: ${location}.`;
    }

    const prompt = `You are a friendly AI assistant on Confessly, a platform for anonymous confessions. 

${context}

Confession: "${confessionContent}"

Generate a ${tone} response to this confession. The response should be:
- 1-3 sentences long
- Empathetic and understanding
- ${isSerious ? 'Offer genuine advice or perspective' : 'Be playful and entertaining'}
- Anonymous (don't reveal you're an AI)
- Appropriate for a social media platform

Response:`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant that responds to anonymous confessions with empathy and appropriate advice."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    const comment = completion.choices[0].message.content.trim();
    
    // Add a subtle indicator that this is an AI comment
    const aiIndicator = isSerious ? ' 🤖' : ' ✨';
    
    return comment + aiIndicator;

  } catch (error) {
    console.error('Error generating AI comment:', error);
    console.log('Falling back to mock AI responses due to OpenAI error');
    return generateMockAIComment(confessionContent, mood, location);
  }
}

// Mock AI comment generator for testing when OpenAI is unavailable
function generateMockAIComment(confessionContent, mood = '', location = '') {
  const isSerious = Math.random() > 0.5;
  
  // Mock responses based on content keywords
  const mockResponses = {
    serious: [
      "I understand how challenging this must be for you. Remember that it's okay to feel this way, and you're not alone in your struggles.",
      "This sounds like a difficult situation. Sometimes the best thing we can do is take a step back and give ourselves permission to process our feelings.",
      "Your feelings are valid, and it's important to acknowledge them. Consider talking to someone you trust about this - you might be surprised by their support.",
      "This is a heavy burden to carry alone. Remember that seeking help or talking things through is a sign of strength, not weakness.",
      "I can sense the weight of this confession. Sometimes the hardest part is being honest with ourselves about how we're feeling."
    ],
    fun: [
      "Oh wow, that's quite the situation! Life really does have a way of throwing curveballs at us, doesn't it? 😅",
      "Haha, I totally get it! Sometimes you just need to laugh at the absurdity of it all. You're definitely not the only one!",
      "This is giving me major 'same energy' vibes! We've all been there, and honestly, it makes for great stories later.",
      "Oh my, the plot thickens! 🍿 This is the kind of confession that makes me want to grab popcorn and hear more!",
      "You know what? This is actually pretty relatable! We've all had those moments where we're like 'how did I end up here?' 😂"
    ]
  };

  // Choose a random response based on tone
  const responses = isSerious ? mockResponses.serious : mockResponses.fun;
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  
  // Add mood/location context if available
  let finalResponse = randomResponse;
  if (mood) {
    finalResponse = `Given your ${mood} mood, ${randomResponse.toLowerCase()}`;
  }
  if (location) {
    finalResponse += ` Hope things are better at ${location}!`;
  }
  
  // Add AI indicator
  const aiIndicator = isSerious ? ' 🤖' : ' ✨';
  
  return finalResponse + aiIndicator;
}

/**
 * Check if AI commenting is enabled
 * @returns {boolean}
 */
function isAIEnabled() {
  return !!process.env.OPENAI_API_KEY;
}

module.exports = {
  generateAIComment,
  isAIEnabled
}; 