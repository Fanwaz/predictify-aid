
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
    
    console.log(`Received request to generate ${numberOfQuestions} ${questionType} questions, content length: ${content.length}`);
    
    if (!content || content.trim() === '') {
      throw new Error('No content provided to generate questions from');
    }

    // Send content directly to Gemini via OpenRouter
    const prompt = `
      Generate ${numberOfQuestions} ${questionType} questions based on the following content. 
      For each question, assign a probability percentage (how likely this question would appear in an exam) and mention its source.
      ${questionType === 'theory' ? 'For each theory question, provide a sample answer.' : 'For each objective question, provide 4 options and mark the correct one.'}
      
      Format the response as a JSON array with these fields:
      [
        {
          "id": "unique string",
          "text": "question text",
          "probability": number between 1-100,
          "source": "string describing where in the content this is from",
          "type": "${questionType}",
          ${questionType === 'theory' 
            ? '"answer": "sample answer for the question"' 
            : '"options": [{"id": "string", "text": "string", "isCorrect": boolean}]'}
        }
      ]
      
      IMPORTANT: Return valid JSON only. Don't include any explanations or text outside the JSON array.
      
      Here's the content:
      ${content.substring(0, 8000)} ${content.length > 8000 ? '...(content truncated)' : ''}
    `;
    
    console.log("Sending request to OpenRouter API for Gemini access");
    
    // Call the OpenRouter API to access Gemini
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
        ]
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('OpenRouter API response received:', JSON.stringify(data).substring(0, 200) + '...');
    
    // Extract the text response from the OpenRouter format
    const textResponse = data.choices?.[0]?.message?.content;
    
    if (!textResponse) {
      console.error('No text response received from API:', data);
      throw new Error('No text response from API');
    }
    
    // Try to parse JSON from the model's response
    let questions = parseQuestionsFromResponse(textResponse, questionType);
    
    // Validate and ensure we have questions
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      console.error('Failed to parse questions from response:', textResponse);
      throw new Error('Failed to extract valid questions from the AI response');
    }
    
    console.log(`Successfully parsed ${questions.length} questions`);
    
    return new Response(
      JSON.stringify({ questions }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in generate-questions function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function parseQuestionsFromResponse(textResponse: string, questionType: string) {
  try {
    // Try to find the JSON array in the response
    let jsonText = textResponse.trim();
    
    // Look for the first [ and last ] to extract JSON
    const startIdx = jsonText.indexOf('[');
    const endIdx = jsonText.lastIndexOf(']') + 1;
    
    if (startIdx >= 0 && endIdx > startIdx) {
      jsonText = jsonText.substring(startIdx, endIdx);
    }
    
    const questions = JSON.parse(jsonText);
    
    // Validate and process each question
    return questions.map((q: any, index: number) => {
      return {
        id: q.id || `q-${Date.now()}-${index}`,
        text: q.text || `Question ${index + 1}`,
        probability: Number(q.probability) || 50,
        source: q.source || 'Generated from content',
        type: questionType,
        ...(questionType === 'theory' 
          ? { answer: q.answer || 'No sample answer provided' }
          : { options: processOptions(q.options, index) })
      };
    });
  } catch (error) {
    console.error('Failed to parse JSON from response:', error);
    
    // Return null to trigger fallback handling
    return null;
  }
}

function processOptions(options: any[] | undefined, questionIndex: number) {
  if (!options || !Array.isArray(options) || options.length === 0) {
    // Create default options if none provided
    return ['A', 'B', 'C', 'D'].map((letter, i) => ({
      id: `o-${Date.now()}-${questionIndex}-${i}`,
      text: `Option ${letter}`,
      isCorrect: i === 0 // Default to A as correct
    }));
  }
  
  // Process provided options
  return options.map((opt, i) => ({
    id: opt.id || `o-${Date.now()}-${questionIndex}-${i}`,
    text: opt.text || `Option ${i + 1}`,
    isCorrect: Boolean(opt.isCorrect)
  }));
}
