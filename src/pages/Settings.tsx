
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const navigate = useNavigate();
  const { apiKey, setApiKey } = useAuth();
  const { toast } = useToast();
  const [key, setKey] = useState(apiKey || '');
  const [isVisible, setIsVisible] = useState(false);

  const handleSave = () => {
    if (key.trim()) {
      setApiKey(key.trim());
      toast({
        title: 'API Key Saved',
        description: 'Your Gemini API key has been saved successfully.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Empty API Key',
        description: 'Please enter a valid API key.',
      });
    }
  };

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
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Key className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-medium">API Integration</h2>
              <p className="text-muted-foreground">Configure your Gemini API key for predictions</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="api-key" className="block text-sm font-medium mb-2">
                Gemini API Key
              </label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Input
                    id="api-key"
                    type={isVisible ? "text" : "password"}
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="Enter your Gemini API key"
                    className="pr-20"
                  />
                  <button
                    type="button"
                    onClick={() => setIsVisible(!isVisible)}
                    className="absolute inset-y-0 right-0 px-3 text-sm text-muted-foreground hover:text-foreground"
                  >
                    {isVisible ? "Hide" : "Show"}
                  </button>
                </div>
                <Button onClick={handleSave}>Save</Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Your API key is securely stored in your browser and is never sent to our servers.
              </p>
            </div>

            <div className="pt-4">
              <h3 className="text-lg font-medium mb-2">How to get a Gemini API key</h3>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>Visit <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google AI Studio</a></li>
                <li>Sign in with your Google account</li>
                <li>Create a new API key</li>
                <li>Copy and paste it here</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
