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
      
      // For text files, use readAsText
      reader.readAsText(file);
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
      
      // Call the Supabase edge function to generate questions
      const { data, error } = await supabase.functions.invoke('generate-questions', {
        body: {
          content: fileContent,
          settings: settings
        }
      });
      
      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to generate predictions');
      }
      
      if (!data || !data.questions) {
        console.error('Invalid response format:', data);
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
    } catch (error) {
      console.error('Failed to predict questions:', error);
      toast({
        title: 'Prediction Failed',
        description: error instanceof Error ? error.message : 'There was an error generating predictions. Please try again.',
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
