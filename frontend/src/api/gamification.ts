import { api } from "./client";

export type Achievement = {
  id: number;
  code: string;
  title: string;
  description: string;
  icon: string;
  unlocked_at: string;
};

export type CatalogEntry = Omit<Achievement, "id" | "unlocked_at"> & { unlocked: boolean };

export type GamificationMe = {
  stat: {
    predictions_count: number;
    samples_explored: number;
    pages_visited: number;
    constellations_solved: number;
    last_event_at: string;
  };
  achievements: Achievement[];
  catalog: CatalogEntry[];
};

export const gamificationApi = {
  me: async () => (await api.get<GamificationMe>("/gamification/me/")).data,
  event: async (event: string) =>
    (await api.post<{ unlocked: Achievement[] }>("/gamification/event/", { event })).data,
};
