import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Send, Mic, Upload, Volume2, VolumeX } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import DOMPurify from "isomorphic-dompurify";

interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  content: string | null;
  audioUrl: string | null;
  audioDurationSec: number | null;
  mimeType: string | null;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl: string | null;
  };
}

interface TypingUser {
  userId: string;
  userName: string;
  isTyping: boolean;
}

export default function ChatPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [message, setMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const roomId = "public"; // For now, we'll use a single public room

  // Fetch chat history
  const { data: messages = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/history", roomId, { limit: 50 }]
  });

  // Send text message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/chat/message", { roomId, content });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/history", roomId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive"
      });
    }
  });

  // Upload audio mutation
  const uploadAudioMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("audio", file);
      formData.append("roomId", roomId);

      const response = await fetch("/api/chat/upload-audio", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to upload audio");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/history", roomId] });
      toast({
        title: "Success",
        description: "Audio message sent!"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload audio",
        variant: "destructive"
      });
    }
  });

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!user || !(user as any)?.id) return;

    const newSocket = io({
      withCredentials: true // Use session authentication only
    });

    newSocket.on("connect", () => {
      console.log("Connected to chat");
      setIsConnected(true);
      newSocket.emit("chat:join", roomId);
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from chat");
      setIsConnected(false);
    });

    newSocket.on("chat:message", (newMessage: ChatMessage) => {
      queryClient.setQueryData(["/api/chat/history", roomId, { limit: 50 }], (oldData: ChatMessage[] = []) => {
        // Avoid duplicates by checking if message already exists
        if (oldData.some(msg => msg.id === newMessage.id)) {
          return oldData;
        }
        return [newMessage, ...oldData];
      });
    });

    newSocket.on("chat:typing", (data: TypingUser) => {
      setTypingUsers(prev => {
        const filtered = prev.filter(u => u.userId !== data.userId);
        return data.isTyping ? [...filtered, data] : filtered;
      });
    });

    newSocket.on("chat:error", (error: { message: string }) => {
      toast({
        title: "Chat Error",
        description: error.message,
        variant: "destructive"
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [(user as any)?.id, roomId, queryClient, toast]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle typing indicators
  const handleTyping = () => {
    if (!socket || !isConnected) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit("chat:typing", { roomId, isTyping: true });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket?.emit("chat:typing", { roomId, isTyping: false });
    }, 2000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sendMessageMutation.isPending) return;

    const messageText = message.trim();
    setMessage("");
    
    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      socket?.emit("chat:typing", { roomId, isTyping: false });
    }

    try {
      await sendMessageMutation.mutateAsync(messageText);
    } catch (error) {
      // Error handled by mutation onError
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("audio/")) {
      toast({
        title: "Invalid File",
        description: "Please select an audio file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Audio file must be under 5MB",
        variant: "destructive"
      });
      return;
    }

    uploadAudioMutation.mutate(file);
    
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p>Please log in to access the chat.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Music Chat
              {isConnected ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Connected
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  Connecting...
                </Badge>
              )}
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <p className="text-muted-foreground">Loading messages...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(messages as ChatMessage[]).slice().reverse().map((msg: ChatMessage) => (
                  <div key={msg.id} className="flex gap-3" data-testid={`message-${msg.id}`}>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={msg.user.profileImageUrl || undefined} />
                      <AvatarFallback className="text-xs">
                        {getUserInitials(msg.user.firstName, msg.user.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm" data-testid={`user-name-${msg.id}`}>
                          {msg.user.firstName} {msg.user.lastName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                      {msg.content ? (
                        <p 
                          className="text-sm" 
                          data-testid={`message-content-${msg.id}`}
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(msg.content, {
                              ALLOWED_TAGS: ['br'], // Allow line breaks only
                              ALLOWED_ATTR: []
                            })
                          }}
                        />
                      ) : msg.audioUrl ? (
                        <div className="bg-muted rounded-lg p-3 max-w-xs" data-testid={`audio-message-${msg.id}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <Volume2 className="h-4 w-4" />
                            <span className="text-xs font-medium">
                              Audio Message ({formatDuration(msg.audioDurationSec || 0)})
                            </span>
                          </div>
                          <audio 
                            controls 
                            preload="metadata" 
                            className="w-full h-8"
                            data-testid={`audio-player-${msg.id}`}
                          >
                            <source src={msg.audioUrl} type={msg.mimeType || "audio/mpeg"} />
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
                
                {/* Typing indicators */}
                {typingUsers.length > 0 && (
                  <div className="flex gap-3" data-testid="typing-indicator">
                    <div className="h-8 w-8" /> {/* Spacer for avatar */}
                    <div className="text-sm text-muted-foreground italic">
                      {typingUsers.map(u => u.userName).join(", ")} 
                      {typingUsers.length === 1 ? " is" : " are"} typing...
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Message Input */}
          <div className="border-t p-4">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  handleTyping();
                }}
                placeholder="Type a message..."
                className="flex-1"
                disabled={!isConnected || sendMessageMutation.isPending}
                data-testid="message-input"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
                data-testid="audio-file-input"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={!isConnected || uploadAudioMutation.isPending}
                data-testid="upload-audio-button"
              >
                {uploadAudioMutation.isPending ? (
                  <div className="h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
              </Button>
              <Button
                type="submit"
                disabled={!message.trim() || !isConnected || sendMessageMutation.isPending}
                data-testid="send-message-button"
              >
                {sendMessageMutation.isPending ? (
                  <div className="h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}