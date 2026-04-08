import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { trpcClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface ReviewQueueItem {
  id: string;
  type: string;
  title: string;
  fit: number;
  status: string;
  time: string;
  action: string;
}

export default function ReviewQueue() {
  const { user, isLoaded } = useUser();
  const userId = user?.id ?? null;
  const [items, setItems] = useState<ReviewQueueItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !userId) return;
    void trpcClient.review.getQueue.query()
      .then(setItems)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed'));
  }, [isLoaded, userId]);

  if (!isLoaded) return null;
  if (!userId) return <div className="py-12 text-center text-slate-500">Sign in to view review queue</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Review Queue</h1>
          <p className="mt-1 text-slate-500">{items.length} items requiring your attention</p>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Badge variant="secondary" className="mb-2">{item.type}</Badge>
                  <CardTitle className="text-base">{item.title}</CardTitle>
                </div>
                {item.fit > 0 && (
                  <Badge variant={item.fit >= 90 ? 'success' : 'default'}>{item.fit}% Fit</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center justify-between text-sm text-slate-500">
                <span>{item.time}</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{item.status}</span>
              </div>
              <Separator className="mb-4" />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">Save for Later</Button>
                <Button size="sm" className="flex-1">Review</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
