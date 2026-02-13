import { useNavigate } from '@tanstack/react-router';
import { useGetUserRequests, formatRequestStatus, getStatusVariant } from '../hooks/useRequests';
import { LoadingPanel, EmptyPanel, ErrorPanel } from '../components/common/StatePanels';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

export default function MyRequestsPage() {
  const navigate = useNavigate();
  const { data: requests, isLoading, error } = useGetUserRequests();

  if (isLoading) {
    return <LoadingPanel message="Loading your requests..." />;
  }

  if (error) {
    return <ErrorPanel error={error} />;
  }

  if (!requests || requests.length === 0) {
    return (
      <EmptyPanel
        title="No requests yet"
        description="You haven't created any requests. Click 'New Request' to submit your first non-standard manufacturing request."
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Requests</CardTitle>
        <CardDescription>
          View and track all your submitted requests
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Request ID</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Approval Level</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-mono text-xs">
                  {request.id.substring(0, 20)}...
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {request.headerFields}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(request.status)}>
                    {formatRequestStatus(request.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {request.status === 'approved' || request.status === 'rejected'
                    ? '—'
                    : `Level ${Number(request.currentApprovalLevel) + 1} of 8`}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(Number(request.updatedAt) / 1000000).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate({ to: '/request/$requestId', params: { requestId: request.id } })}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
