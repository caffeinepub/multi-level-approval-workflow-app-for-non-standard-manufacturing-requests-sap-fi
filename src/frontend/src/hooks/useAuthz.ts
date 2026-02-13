import { useInternetIdentity } from './useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';

export function useAuthz() {
  const { identity, clear } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const principal = identity?.getPrincipal().toString() || null;

  const logout = async () => {
    await clear();
    queryClient.clear();
  };

  return {
    isAuthenticated,
    principal,
    logout,
  };
}
