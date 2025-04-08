
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENROUTER_API_KEY = Deno.env.get("GEMINI_API_KEY");

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

    // Limit content to prevent token overflow (8K chars is ~2K tokens)
    const truncatedContent = content.length > 8000 ? content.substring(0, 8000) + '...(content truncated)' : content;
    
    // Direct prompt to Gemini via OpenRouter
    const prompt = `
      Based on this content, generate ${numberOfQuestions} ${questionType} exam questions.
      For each question, assign a probability percentage (how likely this question would appear in a real exam).
      ${questionType === 'theory' ? 'For each theory question, provide a sample answer.' : 'For each objective question, provide 4 options and mark the correct one.'}
      
      Format your response as a JSON array with these fields:
      [
        {
          "id": "q1",
          "text": "question text",
          "probability": number between 1-100,
          "source": "section from content this is based on",
          "type": "${questionType}",
          ${questionType === 'theory' 
            ? '"answer": "sample answer for the question"' 
            : '"options": [{"id": "a", "text": "option text", "isCorrect": boolean}]'}
        }
      ]
      
      Return ONLY valid JSON without any explanation text. The JSON must be properly formatted.
      
      Here's the content:
      ${truncatedContent}
    `;
    
    console.log("Sending request to OpenRouter API");
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://exam-predictor.app',
        'X-Title': 'Exam Question Predictor',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro-preview-03-25",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 4000 // Limit token usage to prevent hitting limits
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenRouter API error:', response.status, JSON.stringify(errorData));
      throw new Error(`API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    console.log('Received response from OpenRouter');
    
    const textResponse = data.choices?.[0]?.message?.content;
    
    if (!textResponse) {
      console.error('No valid response content from API');
      throw new Error('No valid content in the API response');
    }
    
    // Parse the JSON response
    let questions;
    try {
      // Extract JSON from text response (look for JSON array)
      const jsonStart = textResponse.indexOf('[');
      const jsonEnd = textResponse.lastIndexOf(']') + 1;
      
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        const jsonText = textResponse.substring(jsonStart, jsonEnd);
        questions = JSON.parse(jsonText);
      } else {
        // Try parsing the whole response as JSON
        questions = JSON.parse(textResponse);
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
