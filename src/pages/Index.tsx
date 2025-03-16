
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileText, CheckCircle, Upload } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const isMobile = useIsMobile();
  const [showModal, setShowModal] = useState(true);
  
  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/predict');
    } else {
      navigate('/sign-up');
    }
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-4 md:space-y-6 max-w-3xl mx-auto animate-fade-in">
        <div className="inline-block">
          <div className="text-xs font-medium bg-primary/10 text-primary px-3 py-1 rounded-full mb-4">
            AI-Powered Learning
          </div>
        </div>
        
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight">
          Predict Your Exam Questions with AI
        </h1>
        
        <p className="text-base md:text-xl text-muted-foreground">
          Upload your study materials and let our AI predict the most likely exam questions, helping you focus your study time more effectively.
        </p>
        
        <div className="pt-4">
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Button onClick={handleGetStarted} className="px-4 py-2 md:px-6 md:py-6 text-base md:text-lg rounded-full">
              {isAuthenticated ? 'Start Predicting' : 'Create Account'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            {!isAuthenticated && (
              <Button 
                variant="outline" 
                onClick={() => navigate('/sign-in')} 
                className="px-4 py-2 md:px-6 md:py-6 text-base md:text-lg rounded-full"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mt-12 md:mt-20 w-full max-w-4xl animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <div className="bg-background rounded-xl p-4 md:p-6 border subtle-border shadow-sm hover-lift">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-medium mb-2">Upload Materials</h3>
          <p className="text-sm md:text-base text-muted-foreground">
            Simply upload your study materials in PDF, DOCX, or TXT format.
          </p>
        </div>
        
        <div className="bg-background rounded-xl p-4 md:p-6 border subtle-border shadow-sm hover-lift">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-medium mb-2">Choose Settings</h3>
          <p className="text-sm md:text-base text-muted-foreground">
            Select the type and number of questions you want to predict.
          </p>
        </div>
        
        <div className="bg-background rounded-xl p-4 md:p-6 border subtle-border shadow-sm hover-lift sm:col-span-2 md:col-span-1">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <CheckCircle className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-medium mb-2">Review Results</h3>
          <p className="text-sm md:text-base text-muted-foreground">
            Get AI-generated questions ranked by probability of appearing in your exam.
          </p>
        </div>
      </div>
      
      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-background rounded-xl border subtle-border shadow-lg max-w-lg w-full p-4 md:p-6 animate-scale-in">
            <h2 className="text-xl md:text-2xl font-medium mb-4">Welcome to Exam Question Predictor AI</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-start">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="font-medium text-primary">1</span>
                </div>
                <div className="ml-4">
                  <h3 className="font-medium">Add Your API Key</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Enter your Gemini API key in the settings.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="font-medium text-primary">2</span>
                </div>
                <div className="ml-4">
                  <h3 className="font-medium">Upload Your Material</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Upload your PDF, DOCX, or TXT study materials.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="font-medium text-primary">3</span>
                </div>
                <div className="ml-4">
                  <h3 className="font-medium">Configure Predictions</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Choose between theory or objective questions and set the quantity.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="font-medium text-primary">4</span>
                </div>
                <div className="ml-4">
                  <h3 className="font-medium">Review Predicted Questions</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    See AI-predicted exam questions ranked by probability.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
              <Button variant="outline" onClick={handleCloseModal} className="sm:order-1 order-2">
                Close
              </Button>
              <Button onClick={() => {
                handleCloseModal();
                handleGetStarted();
              }} className="sm:order-2 order-1">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
