import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Build URL from query key
    // First element is the base URL, second element (if object) contains query params
    const baseUrl = queryKey[0] as string;
    let url = baseUrl;
    
    if (queryKey.length > 1) {
      const secondPart = queryKey[1];
      if (typeof secondPart === "object" && secondPart !== null) {
        // It's a params object
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(secondPart)) {
          if (value !== undefined && value !== null) {
            params.set(key, String(value));
          }
        }
        const queryString = params.toString();
        if (queryString) {
          url = `${baseUrl}?${queryString}`;
        }
      } else if (typeof secondPart === "number" || typeof secondPart === "string") {
        // It's an ID - append to URL
        url = `${baseUrl}/${secondPart}`;
        // Check for third part (e.g., /api/posts/1/comments)
        if (queryKey.length > 2 && typeof queryKey[2] === "string") {
          url = `${url}/${queryKey[2]}`;
        }
      }
    }
    
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
