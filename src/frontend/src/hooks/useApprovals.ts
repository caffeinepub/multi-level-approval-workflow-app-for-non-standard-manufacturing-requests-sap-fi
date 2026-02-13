import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { ManufacturingRequest } from '../backend';

export function useGetMyApprovals() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<ManufacturingRequest[]>({
    queryKey: ['myApprovals', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [];
      
      const allApprovals: ManufacturingRequest[] = [];
      
      for (let level = 0; level < 8; level++) {
        try {
          const levelRequests = await actor.getRequestsByLevel(BigInt(level));
          allApprovals.push(...levelRequests);
        } catch (error) {
          // User is not an approver for this level, continue
        }
      }
      
      return allApprovals;
    },
    enabled: !!actor && !!identity && !actorFetching,
  });
}

export function useApproveRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, comment }: { requestId: string; comment: string | null }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.approveRequest(requestId, comment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myApprovals'] });
      queryClient.invalidateQueries({ queryKey: ['request'] });
      queryClient.invalidateQueries({ queryKey: ['userRequests'] });
    },
  });
}

export function useRejectRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, comment }: { requestId: string; comment: string | null }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.rejectRequest(requestId, comment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myApprovals'] });
      queryClient.invalidateQueries({ queryKey: ['request'] });
      queryClient.invalidateQueries({ queryKey: ['userRequests'] });
    },
  });
}

export function useIsRequestActionable(request: ManufacturingRequest | undefined) {
  const { data: myApprovals } = useGetMyApprovals();
  
  if (!request || !myApprovals) return false;
  
  return myApprovals.some(approval => approval.id === request.id);
}
