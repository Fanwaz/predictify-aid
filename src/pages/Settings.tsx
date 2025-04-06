
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-medium">Settings</h1>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-background rounded-xl p-6 border subtle-border shadow-sm">
          <div className="flex items-center space-x-4 mb-6">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-medium">API Integration</h2>
              <p className="text-muted-foreground">The Gemini API is configured and ready to use</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <div className="flex items-start">
                <div className="flex-1">
                  <h3 className="font-medium text-green-800">API Configured</h3>
                  <p className="text-sm text-green-600 mt-1">
                    The application is configured with a Gemini API key at the project level. You can start using the prediction features right away.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="pt-4">
              <h3 className="text-lg font-medium mb-2">About the Gemini API</h3>
              <p className="text-muted-foreground mb-2">
                This application uses Google's Gemini AI to generate exam question predictions. The API is already set up and ready to use.
              </p>
              <p className="text-muted-foreground">
                You can learn more about Gemini AI at <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google AI Studio</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
