
import { useState, useEffect } from 'react';
import { Prediction, PredictionSettings, Question, QuestionType } from '@/types';
import { toast } from '@/hooks/use-toast';

export function usePredictions() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [currentPrediction, setCurrentPrediction] = useState<Prediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const generateMockQuestions = (settings: PredictionSettings): Question[] => {
    const { questionType, numberOfQuestions } = settings;
    const questions: Question[] = [];

    for (let i = 0; i < numberOfQuestions; i++) {
      const probability = Math.floor(Math.random() * 100);
      const probabilityClass = probability > 70 ? 'high' : probability > 40 ? 'medium' : 'low';
      
      if (questionType === 'theory') {
        questions.push({
          id: `q-${Date.now()}-${i}`,
          text: `What is the significance of ${['osmosis', 'photosynthesis', 'mitosis', 'cellular respiration', 'DNA replication'][i % 5]} in biological systems?`,
          probability,
          source: `Found on page ${Math.floor(Math.random() * 50) + 1}`,
          type: 'theory',
          answer: `${['Osmosis', 'Photosynthesis', 'Mitosis', 'Cellular respiration', 'DNA replication'][i % 5]} is a critical process that allows cells to maintain balance and function properly in their environment.`
        });
      } else {
        questions.push({
          id: `q-${Date.now()}-${i}`,
          text: `Which of the following best describes ${['osmosis', 'photosynthesis', 'mitosis', 'cellular respiration', 'DNA replication'][i % 5]}?`,
          probability,
          source: `Found on page ${Math.floor(Math.random() * 50) + 1}`,
          type: 'objective',
          options: [
            {
              id: `o-${Date.now()}-${i}-1`,
              text: 'A process where water molecules move from an area of higher concentration to lower concentration',
              isCorrect: i % 5 === 0
            },
            {
              id: `o-${Date.now()}-${i}-2`,
              text: 'A process where plants convert light energy into chemical energy',
              isCorrect: i % 5 === 1
            },
            {
              id: `o-${Date.now()}-${i}-3`,
              text: 'A process of cell division resulting in two identical daughter cells',
              isCorrect: i % 5 === 2
            },
            {
              id: `o-${Date.now()}-${i}-4`,
              text: 'A process where cells convert glucose into energy',
              isCorrect: i % 5 === 3
            }
          ]
        });
      }
    }

    // Sort by probability (highest first)
    return questions.sort((a, b) => b.probability - a.probability);
  };

  const predictQuestions = async (file: File, settings: PredictionSettings) => {
    setIsLoading(true);
    
    try {
      // In a real implementation, this would call an API with the file and settings
      // For now, we'll simulate a delay and return mock data
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const questions = generateMockQuestions(settings);
      
      const newPrediction: Prediction = {
        id: `pred-${Date.now()}`,
        date: new Date().toISOString(),
        title: file.name,
        questions,
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
    setPredictions(prev => [prediction, ...prev]);
    toast({
      title: 'Prediction Saved',
      description: 'Your prediction has been saved to Past Predictions.'
    });
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
