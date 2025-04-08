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

  const predictQuestions = async (file: File, settings: PredictionSettings) => {
    setIsLoading(true);
    
    try {
      // Extract text from the file
      let fileContent;
      try {
        fileContent = await extractTextFromFile(file);
        console.log("Successfully extracted file content, length:", fileContent.length);
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
      
      // Call the Supabase edge function to generate questions
      console.log('Calling Supabase edge function to generate predictions');
      
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
      
      console.log('Received response from prediction service:', data);
      
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
