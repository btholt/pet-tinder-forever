import type {
  ApiErrorBody,
  MeResponse,
  Pet,
  SwipeDirection,
  SwipeResponse,
} from "@shared/types";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    ...init,
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = (await res.json()) as ApiErrorBody;
      message = body.error || message;
    } catch {
      // response body wasn't JSON — fall back to statusText
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

export const api = {
  me: () => request<MeResponse>("/me"),

  petsQueue: (limit = 20) =>
    request<Pet[]>(`/pets/queue?limit=${limit}`),

  swipe: (petId: number, direction: SwipeDirection) =>
    request<SwipeResponse>("/swipes", {
      method: "POST",
      body: JSON.stringify({ petId, direction }),
    }),

  undoSwipe: (petId: number) =>
    request<void>(`/swipes/${petId}`, { method: "DELETE" }),

  matches: () => request<Pet[]>("/matches"),
};
