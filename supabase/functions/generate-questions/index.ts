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
    
    console.log("Received request to generate questions:", { questionType, numberOfQuestions });
    
    // Prepare the prompt for the Gemini API via OpenRouter
    const prompt = `
      Generate ${numberOfQuestions} ${questionType} questions based on the following content. 
      For each question, assign a probability percentage (how likely this question would appear in an exam) and mention its source (e.g., "Found on page X" or specific paragraph).
      
      ${questionType === 'theory' ? 'For each theory question, provide a sample answer.' : 'For each objective question, provide 4 options and mark the correct one.'}
      
      Format the response as a JSON array with these fields:
      - id: unique string
      - text: question text
      - probability: number between 1-100
      - source: string describing where in the content this is from
      - type: "${questionType}"
      ${questionType === 'theory' 
        ? '- answer: sample answer for the question' 
        : '- options: array of {id: string, text: string, isCorrect: boolean}'}
      
      Here's the content:
      ${content.substring(0, 10000)} ${content.length > 10000 ? '...(content truncated for length)' : ''}
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
      const errorData = await response.json();
      console.error('OpenRouter API error:', errorData);
      throw new Error(`API error: ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    console.log('OpenRouter API response received');
    
    // Extract the text response from the OpenRouter format
    const textResponse = data.choices?.[0]?.message?.content;
    
    if (!textResponse) {
      throw new Error('No text response from API');
    }
    
    // Process the response to extract the questions
    const questions = extractQuestions(textResponse, questionType);
    
    return new Response(
      JSON.stringify({ questions }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in generate-questions function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function extractQuestions(textResponse, questionType) {
  // Try to parse JSON from the response
  try {
    const jsonStart = textResponse.indexOf('[');
    const jsonEnd = textResponse.lastIndexOf(']') + 1;
    
    if (jsonStart === -1 || jsonEnd === -1) {
      console.log('Invalid JSON format in response, trying manual parsing');
      return parseQuestionsManually(textResponse, questionType);
    }
    
    const jsonStr = textResponse.substring(jsonStart, jsonEnd);
    let questions = JSON.parse(jsonStr);
    
    // Validate and clean up each question
    return questions.map((q) => {
      // Ensure probability is a number between 1-100
      q.probability = Math.min(Math.max(Number(q.probability) || 50, 1), 100);
      
      // Ensure type is correct
      q.type = questionType;
      
      // If objective, ensure options have required properties
      if (questionType === 'objective' && q.options) {
        q.options = q.options.map((option, index) => ({
          id: option.id || `o-${Date.now()}-${index}`,
          text: option.text || 'No option text provided',
          isCorrect: Boolean(option.isCorrect)
        }));
      }
      
      return q;
    });
  } catch (error) {
    console.error('Failed to parse JSON from API response:', error);
    return parseQuestionsManually(textResponse, questionType);
  }
}

function parseQuestionsManually(text, questionType) {
  console.log('Attempting to parse questions manually from response');
  const questions = [];
  
  // Simple pattern matching to extract questions
  const questionRegex = /(\d+)\.\s+(.*?)(?=\[\d+%\]|\n\d+\.|\n$)/gs;
  const probRegex = /\[(\d+)%\]/;
  
  let match;
  let index = 0;
  
  while ((match = questionRegex.exec(text)) !== null) {
    const questionText = match[2].trim();
    
    // Look for probability
    const probMatch = questionText.match(probRegex);
    const probability = probMatch ? Number(probMatch[1]) : 50 + Math.floor(Math.random() * 30);
    
    // Clean up question text
    const cleanedQuestion = questionText.replace(probRegex, '').trim();
    
    const question = {
      id: `q-${Date.now()}-${index}`,
      text: cleanedQuestion,
      probability,
      source: 'Extracted from document',
      type: questionType
    };
    
    if (questionType === 'theory') {
      // Try to find an answer after the question
      const answerStart = text.indexOf(cleanedQuestion) + cleanedQuestion.length;
      const nextQuestionStart = text.indexOf('\n', answerStart + 10);
      
      const potentialAnswer = text.substring(answerStart, nextQuestionStart !== -1 ? nextQuestionStart : undefined).trim();
      if (potentialAnswer.toLowerCase().includes('answer') || potentialAnswer.includes(':')) {
        question.answer = potentialAnswer.replace(/^answer:?\s*/i, '').trim();
      } else {
        question.answer = 'No sample answer provided';
      }
    } else {
      // For objective questions, try to extract options
      const optionsText = text.substring(match.index + match[0].length, text.indexOf('\n', match.index + match[0].length + 50));
      
      const options = [];
      const optionRegex = /([A-D])\)\s+(.*?)(?=\s*[A-D]\)|\s*$)/g;
      
      let optionMatch;
      let optionIndex = 0;
      
      // Check for correct option marker (e.g., "*A)" or "A) [correct]")
      const correctMarker = optionsText.match(/[A-D]\)\s*\*|\[correct\]|\[✓\]/i);
      const correctOption = correctMarker ? correctMarker[0].charAt(0) : String.fromCharCode(65 + Math.floor(Math.random() * 4));
      
      while ((optionMatch = optionRegex.exec(optionsText)) !== null) {
        options.push({
          id: `o-${Date.now()}-${index}-${optionIndex}`,
          text: optionMatch[2].trim(),
          isCorrect: optionMatch[1] === correctOption
        });
        optionIndex++;
      }
      
      if (options.length > 0) {
        question.options = options;
      } else {
        // Generate dummy options if none found
        question.options = ['A', 'B', 'C', 'D'].map((letter, i) => ({
          id: `o-${Date.now()}-${index}-${i}`,
          text: `Option ${letter}`,
          isCorrect: letter === 'A' // Default to A as correct
        }));
      }
    }
    
    questions.push(question);
    index++;
  }
  
  // If no questions were extracted, create a fallback question
  if (questions.length === 0) {
    const fallbackQuestion = {
      id: `q-${Date.now()}-fallback`,
      text: 'Based on the material, what is the most important concept?',
      probability: 75,
      source: 'Generated from material themes',
      type: questionType
    };
    
    if (questionType === 'theory') {
      fallbackQuestion.answer = 'The material discusses several important concepts that are likely to appear in an exam.';
    } else {
      fallbackQuestion.options = [
        { id: `o-${Date.now()}-fallback-0`, text: 'First key concept from the material', isCorrect: true },
        { id: `o-${Date.now()}-fallback-1`, text: 'Second key concept from the material', isCorrect: false },
        { id: `o-${Date.now()}-fallback-2`, text: 'Third key concept from the material', isCorrect: false },
        { id: `o-${Date.now()}-fallback-3`, text: 'Fourth key concept from the material', isCorrect: false }
      ];
    }
    
    questions.push(fallbackQuestion);
  }
  
  // Ensure we have the requested number of questions
  return questions.slice(0, 5);
}
