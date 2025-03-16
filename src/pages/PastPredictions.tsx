
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePredictions } from '@/hooks/usePredictions';
import PastPredictionItem from '@/components/ui-elements/PastPredictionItem';
import { Button } from '@/components/ui/button';
import { ArrowLeft, History } from 'lucide-react';

const PastPredictions = () => {
  const navigate = useNavigate();
  const { predictions, deletePrediction } = usePredictions();
  
  const handleViewPrediction = (prediction: any) => {
    navigate(`/results/${prediction.id}`);
  };

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
        <h1 className="text-2xl font-medium">Past Predictions</h1>
      </div>
      
      {predictions.length > 0 ? (
        <div className="space-y-4">
          {predictions.map(prediction => (
            <PastPredictionItem
              key={prediction.id}
              prediction={prediction}
              onView={handleViewPrediction}
              onDelete={deletePrediction}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-4">
            <History className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No Past Predictions</h3>
          <p className="text-muted-foreground max-w-md">
            When you save your predictions, they will appear here for future reference.
          </p>
          <Button 
            onClick={() => navigate('/predict')}
            variant="outline"
            className="mt-6"
          >
            Create a Prediction
          </Button>
        </div>
      )}
    </div>
  );
};

export default PastPredictions;
