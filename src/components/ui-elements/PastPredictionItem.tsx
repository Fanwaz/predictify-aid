
import React from 'react';
import { Prediction } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PastPredictionItemProps {
  prediction: Prediction;
  onView: (prediction: Prediction) => void;
  onDelete: (id: string) => void;
}

const PastPredictionItem: React.FC<PastPredictionItemProps> = ({
  prediction,
  onView,
  onDelete
}) => {
  const formattedDate = formatDistanceToNow(new Date(prediction.date), { addSuffix: true });
  
  return (
    <Card className="hover-lift">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="font-medium truncate max-w-[200px] sm:max-w-xs">
              {prediction.title}
            </h3>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>{formattedDate}</span>
              <span>•</span>
              <span>{prediction.questions.length} questions</span>
              <span>•</span>
              <span className="capitalize">{prediction.settings.questionType}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onView(prediction)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(prediction.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PastPredictionItem;
