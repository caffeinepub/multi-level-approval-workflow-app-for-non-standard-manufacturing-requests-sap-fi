import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { ManufacturingRequest } from '../backend';

export function useGetUserRequests() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<ManufacturingRequest[]>({
    queryKey: ['userRequests', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [];
      return actor.getUserRequests(identity.getPrincipal());
    },
    enabled: !!actor && !!identity && !actorFetching,
  });
}

export function useGetRequest(requestId: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<ManufacturingRequest>({
    queryKey: ['request', requestId],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getRequest(requestId);
    },
    enabled: !!actor && !actorFetching && !!requestId,
    retry: false,
  });
}

export function useSubmitRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (headerFields: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitRequest(headerFields);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userRequests'] });
    },
  });
}

export function formatRequestStatus(status: ManufacturingRequest['status']): string {
  const statusMap = {
    draft: 'Draft',
    submitted: 'Submitted',
    inApproval: 'In Approval',
    approved: 'Approved',
    rejected: 'Rejected',
  };
  return statusMap[status] || status;
}

export function getStatusVariant(status: ManufacturingRequest['status']): 'default' | 'secondary' | 'destructive' | 'outline' {
  const variantMap = {
    draft: 'outline' as const,
    submitted: 'secondary' as const,
    inApproval: 'default' as const,
    approved: 'default' as const,
    rejected: 'destructive' as const,
  };
  return variantMap[status] || 'default';
}
