import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface ErrorFallbackProps {
  error: Error | null;
  reset: () => void;
}

export function ErrorFallback({ error, reset }: ErrorFallbackProps) {
  return (
    <div className="flex items-center justify-center min-h-[200px] p-6">
      <Card className="w-full max-w-md border-destructive/40">
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
          <p className="font-semibold text-destructive">Something went wrong</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {error && (
            <p className="text-sm text-muted-foreground font-mono break-words">
              {error.message}
            </p>
          )}
          <Button variant="outline" size="sm" onClick={reset} className="gap-2">
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
