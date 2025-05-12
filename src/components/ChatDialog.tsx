
import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { MessageSquare, Send } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { GolferProfile, ChatMessage } from "../types/golfer";
import { getChatMessages, sendChatMessage } from "../lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";

interface ChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  matchedProfile: GolferProfile;
}

const ChatDialog = ({ isOpen, onClose, matchId, matchedProfile }: ChatDialogProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && matchId) {
      loadMessages();
    }
  }, [isOpen, matchId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    if (!matchId) return;
    setIsLoading(true);
    
    try {
      const chatMessages = await getChatMessages(matchId);
      setMessages(chatMessages);
    } catch (error) {
      console.error("Error loading messages:", error);
      toast({
        title: "Kunde inte ladda meddelanden",
        description: "Ett fel uppstod vid laddning av meddelanden.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user || !matchId) return;
    
    // Set sending state to show feedback
    setIsSending(true);
    
    try {
      const messageData = {
        match_id: matchId,
        sender_id: user.id,
        content: newMessage
      };
      
      console.log("Sending message:", messageData);
      
      const sentMessage = await sendChatMessage(messageData);
      
      if (sentMessage) {
        console.log("Message sent successfully:", sentMessage);
        setMessages(prevMessages => [...prevMessages, sentMessage]);
        setNewMessage("");
      } else {
        throw new Error("Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Kunde inte skicka meddelande",
        description: "Ett fel uppstod vid sändning av meddelande.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const renderMessages = () => {
    if (messages.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <MessageSquare size={40} strokeWidth={1} />
          <p className="mt-2">Inga meddelanden än. Börja chatta!</p>
        </div>
      );
    }

    return messages.map((message) => {
      const isCurrentUser = message.sender_id === user?.id;
      
      return (
        <div 
          key={message.id}
          className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}
        >
          {!isCurrentUser && (
            <Avatar className="h-8 w-8 mr-2">
              <AvatarImage src={matchedProfile.profileImage} alt={matchedProfile.name} />
              <AvatarFallback>
                {matchedProfile.name[0]}
              </AvatarFallback>
            </Avatar>
          )}
          
          <div>
            <div 
              className={`px-4 py-2 rounded-lg max-w-xs ${
                isCurrentUser 
                  ? 'bg-golf-green-dark text-white rounded-br-none' 
                  : 'bg-gray-100 text-gray-800 rounded-bl-none'
              }`}
            >
              {message.content}
            </div>
            <div className={`text-xs text-gray-500 mt-1 ${isCurrentUser ? 'text-right' : ''}`}>
              {formatDistanceToNow(message.timestamp, { addSuffix: true, locale: sv })}
            </div>
          </div>
          
          {isCurrentUser && (
            <Avatar className="h-8 w-8 ml-2">
              <AvatarFallback className="bg-golf-green-light text-white">
                {user?.email?.[0].toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      );
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md h-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={matchedProfile.profileImage} alt={matchedProfile.name} />
              <AvatarFallback>
                {matchedProfile.name[0]}
              </AvatarFallback>
            </Avatar>
            <span>{matchedProfile.name}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <p>Laddar meddelanden...</p>
            </div>
          ) : (
            renderMessages()
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={handleSendMessage} className="border-t p-4 flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Skriv ett meddelande..."
            className="flex-1"
            autoComplete="off"
            disabled={isSending}
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!newMessage.trim() || isSending}
            className={isSending ? "opacity-70 cursor-not-allowed" : ""}
          >
            <Send size={18} />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChatDialog;
