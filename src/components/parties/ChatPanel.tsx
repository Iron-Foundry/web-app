import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePartyChat, useSendPartyMessage } from "@/hooks/useParties";

/** A party's chat: its messages and, for a signed-in member of an open party, a send box. */
export function ChatPanel({ partyId, closed }: { partyId: string; closed: boolean }): React.ReactElement {
  const { user } = useAuth();
  const { data: messages = [] } = usePartyChat(partyId, !closed);
  const sendMessage = useSendPartyMessage(partyId);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend(): void {
    if (!text.trim() || !user || sendMessage.isPending) return;
    sendMessage.mutate(text.trim(), { onSuccess: () => setText("") });
  }

  return (
    <div className="space-y-2 rounded-lg bg-muted p-3">
      <div className="max-h-48 space-y-1 overflow-y-auto pr-1">
        {messages.length === 0 && <p className="text-sm italic text-muted-foreground">No messages yet. Be the first!</p>}
        {messages.map((m) => (
          <p key={m.id} className="text-sm">
            <span className="font-semibold">{m.rsn || m.username}</span>
            <span className="ml-1.5 text-mk-body">{m.text}</span>
          </p>
        ))}
        <div ref={bottomRef} />
      </div>
      {user && !closed && (
        <div className="flex gap-1.5">
          <Input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()} placeholder="Say something…" className="h-8 flex-1 text-sm" maxLength={300} />
          <Button size="icon-sm" variant="ghost" onClick={handleSend} disabled={!text.trim() || sendMessage.isPending} aria-label="Send">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}
      {!user && <p className="text-sm text-muted-foreground">Log in to chat.</p>}
    </div>
  );
}
