import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { type RegisterUser } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Music2 } from "lucide-react";
import { motion } from "framer-motion";

export default function SignupPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Signup form schema with validation
  const signupSchema = z.object({
    username: z.string().min(1, "Username is required"),
    email: z.string().email("Valid email is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  });

  const form = useForm<RegisterUser>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: RegisterUser) => {
    try {
      setIsSubmitting(true);
      
      const response = await apiRequest("POST", "/api/auth/register", data);
      const result = await response.json();
      
      toast({
        title: "Account created successfully!",
        description: "Please check your email to verify your account before logging in.",
      });
      
      // Trigger transition animation
      setIsTransitioning(true);
      
      // Navigate after animation
      setTimeout(() => {
        setLocation("/login");
      }, 600);
    } catch (error: any) {
      console.error("Signup error:", error);
      
      // Parse error message from the thrown error
      let errorMessage = "An error occurred during signup";
      
      if (error.message) {
        // Extract JSON from error message format "400: {json}"
        const match = error.message.match(/^\d+:\s*(.+)$/);
        if (match) {
          try {
            const errorData = JSON.parse(match[1]);
            errorMessage = errorData.message || errorMessage;
          } catch {
            // If JSON parsing fails, use the raw message
            errorMessage = match[1] || errorMessage;
          }
        }
      }
      
      toast({
        title: "Signup failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      className="min-h-[100svh] flex items-start justify-center bg-gradient-to-br from-purple-500 via-violet-600 to-indigo-700 px-3 py-3 sm:py-8 relative overflow-hidden"
      animate={isTransitioning ? { 
        opacity: 0, 
        scale: 0.95,
        filter: "blur(10px)"
      } : { 
        opacity: 1, 
        scale: 1,
        filter: "blur(0px)"
      }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      {/* Musical background decoration */}
      <div className="absolute inset-0 opacity-10 text-white pointer-events-none">
        <div className="absolute top-10 left-10 text-6xl font-bold">♪</div>
        <div className="absolute top-20 right-20 text-5xl font-bold">♫</div>
        <div className="absolute bottom-32 left-1/4 text-4xl font-bold">C</div>
        <div className="absolute top-1/3 right-1/4 text-4xl font-bold">G</div>
        <div className="absolute bottom-20 right-16 text-6xl font-bold">♩</div>
        <div className="absolute top-1/2 left-12 text-5xl font-bold">Am</div>
        <div className="absolute bottom-1/4 left-1/3 text-4xl font-bold">♬</div>
      </div>
      
      <motion.div
        animate={isTransitioning ? { 
          y: -20,
          opacity: 0 
        } : { 
          y: 0,
          opacity: 1 
        }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <Card className="w-full max-w-sm border-0 shadow-2xl bg-white/95 backdrop-blur-sm relative z-10">
        <CardHeader className="space-y-2 pb-3 sm:pb-6 pt-4 sm:pt-6">
          <div className="flex justify-center mb-2">
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Music2 className="h-7 w-7 text-white" />
            </div>
          </div>
          <CardTitle className="text-lg sm:text-2xl text-center font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Create account</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Username</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Username" 
                        className="h-10"
                        data-testid="input-username"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="Email" 
                        className="h-10"
                        data-testid="input-email"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type={showPassword ? "text" : "password"}
                          placeholder="Min. 6 characters" 
                          className="pr-10 h-10"
                          data-testid="input-password"
                          {...field}
                          value={field.value || ""}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-10 px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          data-testid="button-toggle-password"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full h-10 mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold shadow-lg" 
                disabled={isSubmitting}
                data-testid="button-signup"
              >
                {isSubmitting ? "Creating..." : "Create account"}
              </Button>
            </form>
          </Form>
          
          <div className="mt-4 text-center text-sm">
            <span className="text-gray-600">Have an account? </span>
            <Link href="/login">
              <Button variant="link" className="p-0 h-auto font-semibold text-purple-600 hover:text-purple-700" data-testid="link-login">
                Sign in
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
      </motion.div>
    </motion.div>
  );
}