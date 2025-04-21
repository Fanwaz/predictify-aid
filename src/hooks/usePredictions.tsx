
import { useState, useEffect } from 'react';
import { Prediction, PredictionSettings, Question, QuestionType } from '@/types';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export function usePredictions() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [currentPrediction, setCurrentPrediction] = useState<Prediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
          const content = event.target.result as string;
          console.log(`Successfully read file, content length: ${content.length}`);
          resolve(content);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        reject(new Error('Error reading file'));
      };
      
      // Read as binary string to support more file types
      reader.readAsBinaryString(file);
    });
  };

  const predictQuestions = async (file: File, settings: PredictionSettings) => {
    setIsLoading(true);
    
    try {
      // Extract text from the file
      console.log(`Starting extraction for file: ${file.name} (${file.size} bytes)`);
      const fileContent = await extractTextFromFile(file);
      
      if (!fileContent || fileContent.trim() === '') {
        throw new Error('Extracted file content is empty');
      }
      
      console.log(`Sending file content to prediction service (${fileContent.length} characters)`);
      
      // Call the Supabase edge function to generate questions with retries
      const maxRetries = 2;
      let retryCount = 0;
      let error = null;
      
      while (retryCount <= maxRetries) {
        try {
          const { data, error: functionError } = await supabase.functions.invoke('generate-questions', {
            body: {
              content: fileContent,
              settings: settings
            }
          });
          
          if (functionError) {
            throw new Error(functionError.message || 'Failed to generate predictions');
          }
          
          if (!data || !data.questions) {
            throw new Error('No questions received from the prediction service');
          }
          
          console.log('Received prediction response with questions:', data.questions.length);
          
          // Sort questions by probability (highest first)
          const sortedQuestions = data.questions.sort((a: Question, b: Question) => b.probability - a.probability);
          
          const newPrediction: Prediction = {
            id: `pred-${Date.now()}`,
            date: new Date().toISOString(),
            title: file.name,
            questions: sortedQuestions,
            settings
          };
          
          setCurrentPrediction(newPrediction);
          return newPrediction;
        } catch (e) {
          console.error(`Attempt ${retryCount + 1}/${maxRetries + 1} failed:`, e);
          error = e;
          retryCount++;
          
          if (retryCount <= maxRetries) {
            // Wait before retrying (exponential backoff)
            const waitTime = 1000 * Math.pow(2, retryCount);
            console.log(`Retrying in ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }
      
      // If we get here, all retries failed
      throw error || new Error('Failed to generate predictions after multiple attempts');
    } catch (error) {
      console.error('Failed to predict questions:', error);
      
      // More specific error messages
      let errorMessage = 'There was an error generating predictions. Please try again with a smaller file or fewer questions.';
      
      if (error instanceof Error) {
        if (error.message.includes('API key') || error.message.includes('Authentication failed')) {
          errorMessage = 'There was an issue with the OpenRouter API authentication. Please contact support.';
        } else if (error.message.includes('rate limit') || error.message.includes('credits')) {
          errorMessage = 'The API rate limit has been reached or ran out of credits. Please try again later.';
        } else if (error.message.includes('token limit') || error.message.includes('size')) {
          errorMessage = 'Your document is too large. Please try a smaller file or request fewer questions.';
        }
      }
      
      toast({
        title: 'Prediction Failed',
        description: errorMessage,
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
