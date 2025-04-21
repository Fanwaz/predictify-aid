
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Use the environment variable from Supabase secrets
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const { content, settings } = await req.json();
    const { questionType, numberOfQuestions } = settings;
    
    console.log(`Request received to generate ${numberOfQuestions} ${questionType} questions, content length: ${content.length} characters`);
    
    if (!content || content.trim() === '') {
      throw new Error('No content provided to generate questions from');
    }

    // Check if API key is available
    if (!OPENROUTER_API_KEY) {
      console.error('OPENROUTER_API_KEY is not set in environment variables');
      throw new Error('OpenRouter API key is not configured');
    }

    // Extract a reasonable amount of text content from the file to avoid token limits
    let textContent = content;
    const maxContentLength = 3000; // Reducing from 4000 to 3000 to stay within limits
    
    if (content.startsWith('PK') || content.indexOf('%PDF') >= 0) {
      console.log("Detected binary file, taking a sample for processing");
      // For binary files, we'll extract a smaller sample to avoid overwhelming the model
      textContent = `This appears to be a binary document file. Please extract key concepts and generate ${numberOfQuestions} ${questionType} questions from this sample: ${content.substring(0, maxContentLength / 2)}`;
    } else if (content.length > maxContentLength) {
      // For text content, truncate to a reasonable size
      textContent = content.substring(0, maxContentLength) + '...(content truncated for token limit)';
      console.log(`Content truncated from ${content.length} to ${textContent.length} characters`);
    }
    
    // Updated prompt with fewer details to save tokens
    const prompt = `
      Generate ${numberOfQuestions} ${questionType} exam questions based on this content.
      
      For each question:
      - Include a probability percentage
      - ${questionType === 'theory' ? 'Provide a sample answer.' : 'Provide 4 options with one correct answer.'}
      - Include a source section
      
      Return as JSON array:
      [
        {
          "id": "q1",
          "text": "Question text",
          "probability": 85,
          "source": "Source from content",
          "type": "${questionType}",
          ${questionType === 'theory' 
            ? '"answer": "Sample answer"' 
            : '"options": [{"id": "a", "text": "Option", "isCorrect": true}, {"id": "b", "text": "Option", "isCorrect": false}]'}
        }
      ]
      
      Return ONLY valid JSON. Content:
      ${textContent}
    `;
    
    console.log("Sending request to OpenRouter API");
    
    // Request with reduced token limit
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://exam-predictor.app',
        'X-Title': 'Exam Question Predictor',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro-exp-03-25:free",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1500, // Further reduced token limit
        temperature: 0.5 // Lower temperature for more focused results
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenRouter API error (${response.status}):`, errorText);
      
      // More detailed error handling
      if (response.status === 401 || response.status === 403) {
        throw new Error('Authentication failed with OpenRouter API. Please check your API key.');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded on OpenRouter API. Please try again later.');
      } else {
        throw new Error(`OpenRouter API error (${response.status}): ${errorText || 'Unknown error'}`);
      }
    }
    
    const data = await response.json();
    console.log('Received response from OpenRouter');
    
    const textResponse = data.choices?.[0]?.message?.content;
    
    if (!textResponse) {
      console.error('No valid response content from API:', JSON.stringify(data));
      throw new Error('No valid content in the API response');
    }
    
    // Parse the JSON response with improved error handling
    let questions;
    try {
      // Try different methods to extract JSON
      if (textResponse.trim().startsWith('[') && textResponse.trim().endsWith(']')) {
        // It's already a JSON array
        questions = JSON.parse(textResponse);
      } else {
        // Try to find JSON array in the response
        const jsonRegex = /\[\s*\{[\s\S]*\}\s*\]/g;
        const match = textResponse.match(jsonRegex);
        
        if (match && match[0]) {
          questions = JSON.parse(match[0]);
        } else {
          console.error('Could not extract JSON from response:', textResponse);
          throw new Error('Could not extract a valid JSON array from the model response');
        }
      }
      
      console.log(`Successfully parsed ${questions.length} questions`);
    } catch (error) {
      console.error('Failed to parse response as JSON:', error, '\nResponse text:', textResponse);
      throw new Error('Failed to parse the AI response as valid JSON');
    }
    
    // Validate questions format
    if (!Array.isArray(questions) || questions.length === 0) {
      console.error('Response is not a valid array of questions:', questions);
      throw new Error('The AI did not return a valid array of questions');
    }
    
    // Process and standardize each question
    const processedQuestions = questions.map((q, index) => {
      const questionId = q.id || `q-${Date.now()}-${index}`;
      
      // Common properties
      const question = {
        id: questionId,
        text: q.text || `Question ${index + 1}`,
        probability: Number(q.probability) || 50,
        source: q.source || 'Generated from provided content',
        type: questionType
      };
      
      // Type-specific properties
      if (questionType === 'theory') {
        return {
          ...question,
          answer: q.answer || 'No sample answer provided'
        };
      } else {
        // Process objective question options
        const options = Array.isArray(q.options) ? q.options.map((opt, i) => ({
          id: opt.id || `${questionId}-opt-${i}`,
          text: opt.text || `Option ${i + 1}`,
          isCorrect: Boolean(opt.isCorrect)
        })) : [
          // Default options if none provided
          { id: `${questionId}-opt-0`, text: 'Option A', isCorrect: true },
          { id: `${questionId}-opt-1`, text: 'Option B', isCorrect: false },
          { id: `${questionId}-opt-2`, text: 'Option C', isCorrect: false },
          { id: `${questionId}-opt-3`, text: 'Option D', isCorrect: false }
        ];
        
        return {
          ...question,
          options
        };
      }
    });
    
    console.log(`Returning ${processedQuestions.length} processed questions`);
    
    return new Response(
      JSON.stringify({ questions: processedQuestions }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in generate-questions function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error occurred',
        errorDetails: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
