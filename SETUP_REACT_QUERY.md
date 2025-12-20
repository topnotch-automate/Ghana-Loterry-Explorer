# React Query Setup Instructions

## Installation

To enable React Query for optimized data fetching and caching, run:

```bash
cd frontend
npm install @tanstack/react-query
```

## Integration

The React Query setup is already prepared in `frontend/src/lib/queryClient.ts`.

To complete the integration:

1. **Update `frontend/src/main.tsx`**:
```typescript
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)
```

2. **Update API calls to use React Query** (optional but recommended):
```typescript
import { useQuery } from '@tanstack/react-query';

// Instead of useEffect + useState
const { data: draws, isLoading } = useQuery({
  queryKey: ['draws', lottoType],
  queryFn: () => drawsApi.getAll({ lottoType }),
});
```

## Benefits

- Automatic request deduplication
- Background refetching
- Optimistic updates
- Cache invalidation
- Retry logic with exponential backoff
