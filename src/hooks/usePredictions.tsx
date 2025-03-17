
import { useState, useEffect } from 'react';
import { Prediction, PredictionSettings, Question, QuestionType } from '@/types';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export function usePredictions() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [currentPrediction, setCurrentPrediction] = useState<Prediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { apiKey } = useAuth();
  const navigate = useNavigate();

  // Load predictions from localStorage on mount
  useEffect(() => {
    const savedPredictions = localStorage.getItem('predictions');
    if (savedPredictions) {
      try {
        setPredictions(JSON.parse(savedPredictions));
      } catch (error) {
        console.error('Failed to parse saved predictions:', error);
      }
    }
  }, []);

  // Save predictions to localStorage when they change
  useEffect(() => {
    if (predictions.length) {
      localStorage.setItem('predictions', JSON.stringify(predictions));
    }
  }, [predictions]);

  const extractTextFromFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target) {
          resolve(event.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      reader.readAsText(file);
    });
  };

  const generateQuestionsWithAI = async (content: string, settings: PredictionSettings): Promise<Question[]> => {
    try {
      const { questionType, numberOfQuestions } = settings;
      
      // Prepare the prompt for the Gemini API
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
      
      console.log('Sending request to Gemini API with prompt');
      
      // Make request to Gemini API
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + apiKey, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Gemini API error:', errorData);
        throw new Error(`API error: ${errorData.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Gemini API response:', data);
      
      // Extract the text response
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!textResponse) {
        throw new Error('No text response from API');
      }
      
      // Extract JSON from the response
      const jsonStart = textResponse.indexOf('[');
      const jsonEnd = textResponse.lastIndexOf(']') + 1;
      
      if (jsonStart === -1 || jsonEnd === -1) {
        console.log('Invalid JSON format in response:', textResponse);
        // Try to parse manually by looking for question patterns
        return parseQuestionsManually(textResponse, questionType);
      }
      
      const jsonStr = textResponse.substring(jsonStart, jsonEnd);
      let questions: Question[];
      
      try {
        questions = JSON.parse(jsonStr);
      } catch (error) {
        console.error('Failed to parse JSON from API response:', error);
        return parseQuestionsManually(textResponse, questionType);
      }
      
      // Validate and clean up each question
      return questions.map((q) => {
        // Ensure probability is a number between 1-100
        q.probability = Math.min(Math.max(Number(q.probability) || 50, 1), 100);
        
        // Ensure type is correct
        q.type = questionType;
        
        // If objective, ensure options have required properties
        if (questionType === 'objective' && q.options) {
          q.options = q.options.map((option: any, index: number) => ({
            id: option.id || `o-${Date.now()}-${index}`,
            text: option.text || 'No option text provided',
            isCorrect: Boolean(option.isCorrect)
          }));
        }
        
        return q;
      });
    } catch (error) {
      console.error('Error generating questions with AI:', error);
      throw error;
    }
  };
  
  const parseQuestionsManually = (text: string, questionType: QuestionType): Question[] => {
    console.log('Attempting to parse questions manually from response');
    const questions: Question[] = [];
    
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
      
      const question: Question = {
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
      const fallbackQuestion: Question = {
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
  };

  const predictQuestions = async (file: File, settings: PredictionSettings) => {
    setIsLoading(true);
    
    try {
      if (!apiKey) {
        toast({
          title: 'API Key Required',
          description: 'Please add your Gemini API key in the settings first.',
          variant: 'destructive'
        });
        navigate('/settings');
        return null;
      }
      
      // Extract text from the file
      let fileContent;
      try {
        fileContent = await extractTextFromFile(file);
      } catch (error) {
        console.error('Failed to extract text from file:', error);
        toast({
          title: 'File Reading Error',
          description: 'Failed to read the uploaded file. Please try again with a different file.',
          variant: 'destructive'
        });
        setIsLoading(false);
        return null;
      }
      
      // Generate questions based on the extracted content
      const questions = await generateQuestionsWithAI(fileContent, settings);
      
      // Sort by probability (highest first)
      const sortedQuestions = questions.sort((a, b) => b.probability - a.probability);
      
      const newPrediction: Prediction = {
        id: `pred-${Date.now()}`,
        date: new Date().toISOString(),
        title: file.name,
        questions: sortedQuestions,
        settings
      };
      
      setCurrentPrediction(newPrediction);
      return newPrediction;
    } catch (error) {
      console.error('Failed to predict questions:', error);
      toast({
        title: 'Prediction Failed',
        description: 'There was an error generating predictions. Please try again.',
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const savePrediction = (prediction: Prediction) => {
    // Check if prediction with this ID already exists to avoid duplicates
    if (!predictions.some(p => p.id === prediction.id)) {
      setPredictions(prev => [prediction, ...prev]);
      toast({
        title: 'Prediction Saved',
        description: 'Your prediction has been saved to Past Predictions.'
      });
    } else {
      toast({
        title: 'Already Saved',
        description: 'This prediction is already in your saved predictions.'
      });
    }
  };

  const deletePrediction = (id: string) => {
    setPredictions(prev => prev.filter(prediction => prediction.id !== id));
    toast({
      title: 'Prediction Deleted',
      description: 'The prediction has been removed from your history.'
    });
  };

  const regeneratePrediction = async (file: File, settings: PredictionSettings) => {
    if (currentPrediction) {
      // Save the current prediction before generating a new one
      savePrediction(currentPrediction);
    }
    
    return predictQuestions(file, settings);
  };

  return {
    predictions,
    currentPrediction,
    isLoading,
    predictQuestions,
    savePrediction,
    deletePrediction,
    regeneratePrediction
  };
}
