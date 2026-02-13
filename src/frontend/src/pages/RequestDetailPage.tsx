import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useGetRequest } from '../hooks/useRequests';
import { useApproveRequest, useRejectRequest, useIsRequestActionable } from '../hooks/useApprovals';
import { useGetCallerUserProfile } from '../hooks/useCurrentUserProfile';
import { formatRequestStatus, getStatusVariant } from '../hooks/useRequests';
import { LoadingPanel, ErrorPanel } from '../components/common/StatePanels';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

export default function RequestDetailPage() {
  const { requestId } = useParams({ from: '/request/$requestId' });
  const navigate = useNavigate();
  const { data: request, isLoading, error } = useGetRequest(requestId);
  const { data: userProfile } = useGetCallerUserProfile();
  const isActionable = useIsRequestActionable(request);
  const approveRequest = useApproveRequest();
  const rejectRequest = useRejectRequest();
  const [comment, setComment] = useState('');
  const [actionInProgress, setActionInProgress] = useState<'approve' | 'reject' | null>(null);

  const handleApprove = async () => {
    if (!request) return;
    
    setActionInProgress('approve');
    try {
      await approveRequest.mutateAsync({ 
        requestId: request.id, 
        comment: comment.trim() || null 
      });
      toast.success('Request approved successfully');
      setComment('');
      navigate({ to: '/my-approvals' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve request');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async () => {
    if (!request) return;
    
    if (!comment.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setActionInProgress('reject');
    try {
      await rejectRequest.mutateAsync({ 
        requestId: request.id, 
        comment: comment.trim() 
      });
      toast.success('Request rejected');
      setComment('');
      navigate({ to: '/my-approvals' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject request');
    } finally {
      setActionInProgress(null);
    }
  };

  if (isLoading) {
    return <LoadingPanel message="Loading request details..." />;
  }

  if (error) {
    return <ErrorPanel error={error} />;
  }

  if (!request) {
    return <ErrorPanel error={new Error('Request not found')} />;
  }

  const canTakeAction = isActionable && (request.status === 'submitted' || request.status === 'inApproval');

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate({ to: '/my-requests' })}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Request Details</CardTitle>
              <CardDescription className="font-mono text-xs mt-2">
                {request.id}
              </CardDescription>
            </div>
            <Badge variant={getStatusVariant(request.status)} className="text-sm">
              {formatRequestStatus(request.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div>
              <Label className="text-muted-foreground">Request Details</Label>
              <p className="mt-2 text-sm whitespace-pre-wrap">{request.headerFields}</p>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Current Approval Level</Label>
                <p className="mt-1 text-sm font-medium">
                  {request.status === 'approved' || request.status === 'rejected'
                    ? 'Completed'
                    : `Level ${Number(request.currentApprovalLevel) + 1} of 8`}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Created</Label>
                <p className="mt-1 text-sm">
                  {new Date(Number(request.createdAt) / 1000000).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Approval History</CardTitle>
          <CardDescription>
            Complete audit trail of all approval actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {request.approvalRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No approval actions yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Level</TableHead>
                  <TableHead>Approver</TableHead>
                  <TableHead>Decision</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {request.approvalRecords.map((record, index) => (
                  <TableRow key={index}>
                    <TableCell>Level {index + 1}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {record.approver.toString().substring(0, 20)}...
                    </TableCell>
                    <TableCell>
                      <Badge variant={record.status === 'approved' ? 'default' : 'destructive'}>
                        {record.status === 'approved' ? 'Approved' : 'Rejected'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {record.comment || '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(Number(record.timestamp) / 1000000).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {canTakeAction && (
        <Card>
          <CardHeader>
            <CardTitle>Take Action</CardTitle>
            <CardDescription>
              Review and approve or reject this request
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="comment">Comment (optional for approval, required for rejection)</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add your comments or feedback..."
                rows={4}
                className="mt-2"
              />
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={handleApprove}
                disabled={!!actionInProgress}
                className="flex-1"
              >
                {actionInProgress === 'approve' ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </>
                )}
              </Button>
              <Button
                onClick={handleReject}
                disabled={!!actionInProgress}
                variant="destructive"
                className="flex-1"
              >
                {actionInProgress === 'reject' ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
