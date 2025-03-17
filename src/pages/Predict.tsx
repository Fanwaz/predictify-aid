
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FileUpload from '@/components/ui-elements/FileUpload';
import PredictionSettings from '@/components/ui-elements/PredictionSettings';
import { usePredictions } from '@/hooks/usePredictions';
import { PredictionSettings as PredictionSettingsType } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, History } from 'lucide-react';
import PastPredictionItem from '@/components/ui-elements/PastPredictionItem';
import PredictionResults from '@/components/ui-elements/PredictionResults';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

const Predict = () => {
  const navigate = useNavigate();
  const { 
    predictions, 
    currentPrediction, 
    isLoading, 
    predictQuestions, 
    savePrediction, 
    deletePrediction,
    regeneratePrediction
  } = usePredictions();
  
  const [activeTab, setActiveTab] = useState('predict');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    toast({
      title: 'File Ready',
      description: 'Your file has been uploaded successfully. Now you can generate predictions.'
    });
  };
  
  const handlePredict = async (settings: PredictionSettingsType) => {
    if (!selectedFile) {
      toast({
        title: 'No File Selected',
        description: 'Please upload a file first.',
        variant: 'destructive'
      });
      return;
    }
    
    const result = await predictQuestions(selectedFile, settings);
    if (result) {
      setActiveTab('results');
    }
  };
  
  const handleSavePrediction = () => {
    if (currentPrediction) {
      savePrediction(currentPrediction);
    }
  };
  
  const handleRegenerate = async () => {
    if (!selectedFile) return;
    
    if (currentPrediction) {
      const settings = currentPrediction.settings;
      await regeneratePrediction(selectedFile, settings);
    }
  };
  
  const handleViewPastPrediction = (prediction: any) => {
    navigate(`/results/${prediction.id}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/')}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-medium">Exam Question Predictor</h1>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 max-w-md">
          <TabsTrigger value="predict">Predict</TabsTrigger>
          <TabsTrigger value="results" disabled={!currentPrediction}>Results</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="predict" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FileUpload onFileSelected={handleFileSelected} />
            <PredictionSettings onPredict={handlePredict} isDisabled={!selectedFile || isLoading} />
          </div>
          
          {isLoading && (
            <div className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Generating predictions...</h3>
                <div className="text-sm text-muted-foreground">This may take a moment</div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="results">
          {currentPrediction && (
            <PredictionResults 
              questions={currentPrediction.questions}
              onSave={handleSavePrediction}
              onRegenerate={handleRegenerate}
            />
          )}
        </TabsContent>
        
        <TabsContent value="history">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-medium">Past Predictions</h2>
              {predictions.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {predictions.length} saved prediction{predictions.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
            
            {predictions.length > 0 ? (
              <div className="space-y-4">
                {predictions.map(prediction => (
                  <PastPredictionItem
                    key={prediction.id}
                    prediction={prediction}
                    onView={handleViewPastPrediction}
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
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Predict;
