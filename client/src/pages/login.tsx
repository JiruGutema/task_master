import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListTodo, Mail, User, Lock, UserPlus, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LoginProps {
  onLogin: (token: string, user: any) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [fullname, setFullname] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const authMutation = useMutation({
    mutationFn: async ({ email, username, fullname, password, isLogin }: { email: string; username: string; fullname: string; password: string; isLogin: boolean }) => {
      const body = isLogin 
        ? { email, password }
        : { email, username, fullname, password };
        
      const response = await fetch(`/api/auth/${isLogin ? 'login' : 'register'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      onLogin(data.token, data.user);
      toast({
        title: "Success",
        description: isLogin ? "Logged in successfully" : "Account created successfully"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (!isLogin && (!username || !fullname)) return;
    authMutation.mutate({ email, username, fullname, password, isLogin });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <Card className="w-full max-w-md relative z-10 backdrop-blur-sm bg-white/80 border-0 shadow-2xl">
        <CardHeader className="text-center pb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg">
              <ListTodo className="text-white" size={32} />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            TaskFlow
          </CardTitle>
          <p className="text-gray-600 mt-2 font-medium">
            {isLogin ? "Welcome back! Sign in to continue" : "Join us today and get organized"}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-11 h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl transition-all duration-200 bg-white/50"
                required
              />
            </div>
            
            {!isLogin && (
              <>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <Input
                    type="text"
                    placeholder="Full name"
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                    className="pl-11 h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl transition-all duration-200 bg-white/50"
                    required
                  />
                </div>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <Input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-11 h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl transition-all duration-200 bg-white/50"
                    required
                  />
                </div>
              </>
            )}
            
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-11 h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl transition-all duration-200 bg-white/50"
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center space-x-2"
              disabled={authMutation.isPending}
            >
              {authMutation.isPending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
                  <span>{isLogin ? "Sign In" : "Create Account"}</span>
                </>
              )}
            </Button>
          </form>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">or</span>
            </div>
          </div>
          
          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-600 hover:text-purple-600 font-semibold transition-colors duration-200 hover:underline"
            >
              {isLogin ? "Don't have an account? Create one" : "Already have an account? Sign in"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}