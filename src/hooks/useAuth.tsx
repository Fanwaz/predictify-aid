
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
  
  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = () => {
      console.log('Checking authentication state...');
      const storedAuth = localStorage.getItem('isAuthenticated');
      const storedUser = localStorage.getItem('user');
      const storedApiKey = localStorage.getItem('gemini_api_key');
      
      console.log('Stored auth state:', { storedAuth, hasStoredUser: !!storedUser });
      
      if (storedAuth === 'true' && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
          console.log('User authenticated:', parsedUser);
          
          if (storedApiKey) {
            setApiKey(storedApiKey);
          }
        } catch (error) {
          console.error('Failed to parse stored user:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('isAuthenticated');
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
        console.log('User not authenticated');
      }
      
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('Logging in with:', { email });
      
      // This would be an actual API call in a real implementation
      // Simulating successful login
      const user = { email };
      
      // Update state
      setUser(user);
      setIsAuthenticated(true);
      
      // Update localStorage
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify(user));
      
      console.log('Login successful:', { user, isAuthenticated: true });
      
      toast({
        title: 'Welcome back!',
        description: 'You have successfully signed in.',
      });
      
      return Promise.resolve();
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: 'Invalid email or password.',
      });
      return Promise.reject(error);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('Signing up with:', { name, email });
      
      // This would be an actual API call in a real implementation
      // Simulating successful registration
      const user = { name, email };
      
      // Update state
      setUser(user);
      setIsAuthenticated(true);
      
      // Update localStorage
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify(user));
      
      console.log('Signup successful:', { user, isAuthenticated: true });
      
      toast({
        title: 'Account created',
        description: 'Your account has been successfully created.',
      });
      
      return Promise.resolve();
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        variant: 'destructive',
        title: 'Registration failed',
        description: 'Could not create your account. Please try again.',
      });
      return Promise.reject(error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    console.log('Logging out');
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
