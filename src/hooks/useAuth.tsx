
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

type User = {
  name?: string;
  email: string;
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  apiKey: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setApiKey: (key: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = () => {
      const storedAuth = localStorage.getItem('isAuthenticated');
      const storedUser = localStorage.getItem('user');
      const storedApiKey = localStorage.getItem('gemini_api_key');
      
      if (storedAuth === 'true' && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
          if (storedApiKey) {
            setApiKey(storedApiKey);
          }
        } catch (error) {
          console.error('Failed to parse stored user:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('isAuthenticated');
        }
      }
      
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      // This would be an actual API call in a real implementation
      // Simulating successful login
      const user = { email };
      setUser(user);
      setIsAuthenticated(true);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify(user));
      
      toast({
        title: 'Welcome back!',
        description: 'You have successfully signed in.',
      });
      
      navigate('/predict');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: 'Invalid email or password.',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      // This would be an actual API call in a real implementation
      // Simulating successful registration
      const user = { name, email };
      setUser(user);
      setIsAuthenticated(true);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify(user));
      
      toast({
        title: 'Account created',
        description: 'Your account has been successfully created.',
      });
      
      navigate('/predict');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Registration failed',
        description: 'Could not create your account. Please try again.',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    localStorage.removeItem('gemini_api_key');
    setApiKey(null);
    
    toast({
      title: 'Signed out',
      description: 'You have been successfully signed out.',
    });
    
    navigate('/');
  };

  const setUserApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    
    toast({
      title: 'API Key Saved',
      description: 'Your Gemini API key has been saved successfully.',
    });
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    apiKey,
    login,
    signup,
    logout,
    setApiKey: setUserApiKey,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
