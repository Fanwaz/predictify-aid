
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles } from 'lucide-react';
import { PredictionSettings as PredictionSettingsType } from '@/types';

interface PredictionSettingsProps {
  onPredict: (settings: PredictionSettingsType) => void;
  isDisabled: boolean;
}

const PredictionSettings: React.FC<PredictionSettingsProps> = ({ 
  onPredict, 
  isDisabled 
}) => {
  const [questionType, setQuestionType] = useState<'theory' | 'objective'>('theory');
  const [numberOfQuestions, setNumberOfQuestions] = useState(5);
  
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setNumberOfQuestions(Math.min(Math.max(value, 1), 20));
    }
  };
  
  const handlePredict = () => {
    onPredict({
      questionType,
      numberOfQuestions
    });
  };

  return (
    <div className="border rounded-xl p-6 space-y-6 transition-all duration-300 animate-fade-in">
      <h3 className="font-medium text-lg">Prediction Settings</h3>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="questionType">Question Type</Label>
          <Select
            value={questionType}
            onValueChange={(value: 'theory' | 'objective') => setQuestionType(value)}
            disabled={isDisabled}
          >
            <SelectTrigger id="questionType" className="w-full">
              <SelectValue placeholder="Select question type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="theory">Theory (Long-form answers)</SelectItem>
              <SelectItem value="objective">Objective (Multiple choice)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="numberOfQuestions">Number of Questions (1-20)</Label>
          <Input
            id="numberOfQuestions"
            type="number"
            min={1}
            max={20}
            value={numberOfQuestions}
            onChange={handleNumberChange}
            disabled={isDisabled}
          />
        </div>
      </div>
      
      <Button 
        onClick={handlePredict} 
        disabled={isDisabled}
        className="w-full flex items-center justify-center space-x-2"
      >
        <Sparkles className="h-4 w-4" />
        <span>Generate Predictions</span>
      </Button>
    </div>
  );
};

export default PredictionSettings;
