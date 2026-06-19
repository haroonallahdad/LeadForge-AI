'use client';

import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function useUser({ redirectTo = '', redirectIfFound = false } = {}) {
  const router = useRouter();
  const pathname = usePathname();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user'],
    queryFn: authApi.me,
    retry: false,
    // Only fetch if we have a token
    enabled: authApi.isLoggedIn(),
  });

  useEffect(() => {
    // If no redirect is needed, just return
    if (!redirectTo) return;

    // Wait until loading is done
    if (isLoading) return;

    // Handle redirect based on user state
    if (
      (!redirectIfFound && !user && !authApi.isLoggedIn()) ||
      (redirectIfFound && user)
    ) {
      if (pathname !== redirectTo) {
        router.push(redirectTo);
      }
    }
  }, [user, isLoading, redirectTo, redirectIfFound, router, pathname]);

  return { user, isLoading, error };
}
