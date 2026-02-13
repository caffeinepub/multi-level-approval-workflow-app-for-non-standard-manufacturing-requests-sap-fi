import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Inbox } from 'lucide-react';

export function LoadingPanel({ message = 'Loading...' }: { message?: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}

export function EmptyPanel({ 
  title = 'No items found', 
  description 
}: { 
  title?: string; 
  description?: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Inbox className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground text-center max-w-md">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function ErrorPanel({ error }: { error: Error | unknown }) {
  const message = error instanceof Error ? error.message : 'An unexpected error occurred';
  
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
