
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePredictions } from '@/hooks/usePredictions';
import PredictionResults from '@/components/ui-elements/PredictionResults';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const Results = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { predictions } = usePredictions();
  
  const prediction = predictions.find(p => p.id === id);
  
  useEffect(() => {
    if (!prediction) {
      navigate('/predict');
    }
  }, [prediction, navigate]);
  
  if (!prediction) {
    return null;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate('/predict')}
          className="rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-medium">Prediction Results</h1>
      </div>
      
      <div className="space-y-2">
        <h2 className="text-xl font-medium">{prediction.title}</h2>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <span>{new Date(prediction.date).toLocaleDateString()}</span>
          <span>•</span>
          <span>{prediction.questions.length} questions</span>
          <span>•</span>
          <span className="capitalize">{prediction.settings.questionType}</span>
        </div>
      </div>
      
      <PredictionResults 
        questions={prediction.questions}
        onSave={() => {}}
        onRegenerate={() => navigate('/predict')}
      />
    </div>
  );
};

export default Results;
