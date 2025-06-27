import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";

function Router({ user, onLogout }: { user: any; onLogout: () => void }) {
  return (
    <Switch>
      <Route path="/" component={() => <Home user={user} onLogout={onLogout} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        if (res.ok) {
          return res.json();
        } else {
          localStorage.removeItem('token');
          throw new Error('Invalid token');
        }
      })
      .then(data => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {
        localStorage.removeItem('token');
        setUser(null);
      })
      .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (token: string, userData: any) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="h-full">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          {user ? (
            <Router user={user} onLogout={handleLogout} />
          ) : (
            <Login onLogin={handleLogin} />
          )}
        </TooltipProvider>
      </QueryClientProvider>
    </div>
  );
}

export default App;
