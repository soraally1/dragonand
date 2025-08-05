'use client';

import { useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/game');
      } else {
        router.push('/auth');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return <LoadingSpinner message="Loading..." />;
  }

  return <LoadingSpinner message="Redirecting..." />;
}
