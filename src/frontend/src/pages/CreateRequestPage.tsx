import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useSubmitRequest } from '../hooks/useRequests';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

export default function CreateRequestPage() {
  const navigate = useNavigate();
  const [headerFields, setHeaderFields] = useState('');
  const submitRequest = useSubmitRequest();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!headerFields.trim()) {
      toast.error('Please enter request details');
      return;
    }

    try {
      const requestId = await submitRequest.mutateAsync(headerFields.trim());
      toast.success('Request submitted successfully');
      navigate({ to: '/request/$requestId', params: { requestId } });
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit request');
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate({ to: '/my-requests' })}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to My Requests
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Create New Request</CardTitle>
          <CardDescription>
            Submit a non-standard manufacturing request for approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="headerFields">Request Details</Label>
              <Textarea
                id="headerFields"
                value={headerFields}
                onChange={(e) => setHeaderFields(e.target.value)}
                placeholder="Enter the details of your non-standard manufacturing request..."
                rows={8}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Provide a clear description of the non-standard request, including specifications and requirements.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: '/my-requests' })}
                disabled={submitRequest.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitRequest.isPending}>
                {submitRequest.isPending ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
