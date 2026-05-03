import { api } from "./client";

export interface Prediction {
  id: number;
  image: string;
  predicted_class: string;
  confidence: number;
  probabilities: Record<string, number>;
  is_public?: boolean;
  created_at: string;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const predictionsApi = {
  list: () => api.get<Paginated<Prediction>>("/predictions/").then((r) => r.data),
  create: (file: File) => {
    const fd = new FormData();
    fd.append("image", file);
    return api
      .post<Prediction>("/predictions/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
  remove: (id: number) => api.delete(`/predictions/${id}/`),
  togglePublic: (id: number) =>
    api.post<Prediction>(`/predictions/${id}/toggle-public/`).then((r) => r.data),
};
