const { Groq } = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const aiController = {
  askAI: async (req, res) => {
    try {
      const { query } = req.body;
      const imageFile = req.file;
      
      if (!query && !imageFile) {
        return res.status(400).json({ message: 'No query or image provided.' });
      }

      // Read knowledge base
      const kbPath = path.join(__dirname, '../data/knowledgebase.json');
      const kbData = JSON.parse(fs.readFileSync(kbPath, 'utf8'));

      if (imageFile) {
        // Use Gemini for vision + knowledge base
        if (!process.env.GEMINI_API_KEY) {
          return res.status(500).json({ message: 'GEMINI_API_KEY is not configured in .env file.' });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        const imageData = {
          inlineData: {
            data: imageFile.buffer.toString('base64'),
            mimeType: imageFile.mimetype
          }
        };

        const prompt = `
          You are an expert insurance advisor for PolicyBazaar.
          A user has uploaded an image (it could be a medical report or a damaged vehicle) and asked: "${query || "What can you tell me about this?"}"
          
          Use the following knowledge base to determine if the user might be eligible for a claim under any category (Health, Motor, etc.).
          Knowledge Base: ${JSON.stringify(kbData)}
          
          Analysis Steps:
          1. Carefully analyze the uploaded image. If it's a medical report, extract key diagnoses or treatments. If it's a vehicle, identify the damage.
          2. Compare the findings from the image and the user's query against the "benefits", "waiting_period", and "exclusions" in the Knowledge Base.
          3. Provide a clear, professional answer on whether a claim might be possible.
          4. If it's likely a claim, list the "documents_required" from the knowledge base.
          5. If it's an exclusion or in a waiting period, explain why.
          6. Always add a disclaimer that the final decision rests with the insurance provider's surveyors.
          
          Keep the response concise and professional.
        `;

        const result = await model.generateContent([prompt, imageData]);
        const response = result.response.text();

        return res.json({ query, response });
      }

      // Fallback to Groq for text-only if no image
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are an expert insurance advisor for PolicyBazaar. 
            Use the following knowledge base to answer the user's questions. 
            Knowledge Base: ${JSON.stringify(kbData)}
            
            Guidelines:
            1. If the user asks about eligibility, benefits, waiting periods, exclusions, claim process, required documents, riders, or tax benefits for a specific category, refer to the knowledge base.
            2. If the information is not in the knowledge base, state that you don't have that specific information and suggest they talk to a human agent.
            3. Respond in the same language as the user's query.
            4. Keep the response concise, professional, and helpful.
            5. Use bullet points for lists to make it readable.
            6. For claim processes or documents required, ensure the response is step-by-step and clear.`
          },
          {
            role: "user",
            content: query
          }
        ],
        model: "llama-3.3-70b-versatile",
      });

      const response = chatCompletion.choices[0].message.content;

      res.json({
        query,
        response
      });
    } catch (error) {
      console.error('AI Advisor error:', error);
      res.status(500).json({ message: 'Failed to generate response. ' + error.message });
    }
  }
};

module.exports = aiController;
