
import React from 'react';
import { Question } from '@/types';
import { Check, Copy, Download, Save, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

interface PredictionResultsProps {
  questions: Question[];
  onSave: () => void;
  onRegenerate: () => void;
}

const PredictionResults: React.FC<PredictionResultsProps> = ({
  questions,
  onSave,
  onRegenerate
}) => {
  const copyToClipboard = () => {
    const text = questions.map((q, index) => {
      let questionText = `${index + 1}. ${q.text} [${q.probability}%]\n`;
      
      if (q.type === 'objective' && q.options) {
        questionText += q.options.map(option => 
          `${option.isCorrect ? '✓ ' : '  '}${option.text}`
        ).join('\n');
      } else if (q.type === 'theory' && q.answer) {
        questionText += `Answer: ${q.answer}`;
      }
      
      return questionText + `\nSource: ${q.source}\n`;
    }).join('\n');
    
    navigator.clipboard.writeText(text);
    
    toast({
      title: 'Copied to Clipboard',
      description: 'Prediction results have been copied to your clipboard.'
    });
  };
  
  const downloadResults = () => {
    const text = questions.map((q, index) => {
      let questionText = `${index + 1}. ${q.text} [${q.probability}%]\n`;
      
      if (q.type === 'objective' && q.options) {
        questionText += q.options.map(option => 
          `${option.isCorrect ? '✓ ' : '  '}${option.text}`
        ).join('\n');
      } else if (q.type === 'theory' && q.answer) {
        questionText += `Answer: ${q.answer}`;
      }
      
      return questionText + `\nSource: ${q.source}\n`;
    }).join('\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `predicted-questions-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Download Started',
      description: 'Your prediction results are being downloaded as a text file.'
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium">Predicted Questions</h2>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={copyToClipboard}>
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <Button variant="outline" size="sm" onClick={downloadResults}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" size="sm" onClick={onSave}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button variant="outline" size="sm" onClick={onRegenerate}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate
          </Button>
        </div>
      </div>
      
      <div className="space-y-4">
        {questions.map((question, index) => (
          <Card key={question.id} className="overflow-hidden hover-lift">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-medium text-sm">{index + 1}</span>
                    </div>
                    <h3 className="font-medium">{question.text}</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs font-medium ${
                      question.probability > 70 
                        ? 'text-success' 
                        : question.probability > 40 
                          ? 'text-warning' 
                          : 'text-danger'
                    }`}>
                      {question.probability}%
                    </span>
                  </div>
                </div>
                
                <div className="probability-bar">
                  <div 
                    className={`probability-bar-fill ${
                      question.probability > 70 
                        ? 'probability-high' 
                        : question.probability > 40 
                          ? 'probability-medium' 
                          : 'probability-low'
                    }`}
                    style={{ width: `${question.probability}%` }}
                  />
                </div>
                
                {question.type === 'objective' && question.options && (
                  <div className="mt-4 space-y-2">
                    {question.options.map(option => (
                      <div 
                        key={option.id} 
                        className={`flex items-start p-3 rounded-md border ${
                          option.isCorrect ? 'border-success bg-success/5' : 'border-border'
                        }`}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {option.isCorrect && (
                            <Check className="h-4 w-4 text-success" />
                          )}
                        </div>
                        <div className="ml-3">
                          <p className={option.isCorrect ? 'font-medium' : ''}>
                            {option.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {question.type === 'theory' && question.answer && (
                  <div className="mt-4 p-4 bg-primary/5 rounded-md border border-border">
                    <p className="text-sm font-medium mb-1">Answer:</p>
                    <p className="text-sm">{question.answer}</p>
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground mt-2">
                  {question.source}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PredictionResults;
