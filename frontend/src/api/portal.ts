import { api } from "./client";

export interface PortalMissionItem {
  id: number;
  day: string;
  count: number;
  is_completed: boolean;
  is_claimed: boolean;
  mission: {
    code: string;
    title: string;
    description: string;
    persona: string;
    action_type: string;
    target_count: number;
    reward_xp: number;
  };
}

export interface PortalSummary {
  counts: Record<string, number>;
  recent_predictions: Array<{ id: number; predicted_class: string; confidence: number; created_at: string; image?: string }>;
  missions_today: PortalMissionItem[];
  recent_journal: Array<{ id: number; title: string; mood: string; body_md: string; created_at: string }>;
  unread_notifications: number;
  suggested_module: string;
}

export interface JournalEntry {
  id: number;
  title: string;
  body_md: string;
  mood: "inspired" | "curious" | "analytical" | "celebratory";
  linked_prediction: number | null;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface Collection {
  id: number;
  name: string;
  description: string;
  cover_url: string;
  is_public: boolean;
  created_at: string;
  items_count: number;
  items: Array<{ id: number; kind: string; ref_id: string; payload_json: Record<string, unknown>; added_at: string }>;
}

export interface PortalNotification {
  id: number;
  kind: "mission" | "achievement" | "system";
  title: string;
  body: string;
  link: string;
  read_at: string | null;
  created_at: string;
  is_read: boolean;
}

export const portalApi = {
  summary: async () => (await api.get<PortalSummary>("/portal/summary/")).data,
  missionsToday: async () => (await api.get<{ items: PortalMissionItem[] }>("/portal/missions/today/")).data,
  claimMission: async (code: string) => (await api.post<{ ok: boolean; reward_xp: number }>(`/portal/missions/${code}/claim/`)).data,

  listJournal: async () => (await api.get<{ count: number; results: JournalEntry[] }>("/portal/journal/")).data,
  createJournal: async (payload: Pick<JournalEntry, "title" | "body_md" | "mood">) =>
    (await api.post<JournalEntry>("/portal/journal/", payload)).data,
  updateJournal: async (id: number, payload: Partial<Pick<JournalEntry, "title" | "body_md" | "mood" | "pinned">>) =>
    (await api.patch<JournalEntry>(`/portal/journal/${id}/`, payload)).data,
  deleteJournal: async (id: number) => await api.delete(`/portal/journal/${id}/`),

  listCollections: async () => (await api.get<{ count: number; results: Collection[] }>("/portal/collections/")).data,
  createCollection: async (payload: Pick<Collection, "name" | "description" | "cover_url" | "is_public">) =>
    (await api.post<Collection>("/portal/collections/", payload)).data,
  addCollectionItem: async (collectionId: number, payload: { kind: string; ref_id: string; payload_json?: Record<string, unknown> }) =>
    (await api.post(`/portal/collections/${collectionId}/items/`, payload)).data,
  removeCollectionItem: async (collectionId: number, itemId: number) =>
    await api.delete(`/portal/collections/${collectionId}/items/${itemId}/`),

  listNotifications: async (unread = false) =>
    (await api.get<{ results: PortalNotification[] }>("/portal/notifications/", { params: { unread } })).data,
  markNotificationRead: async (id: number) => (await api.post<{ ok: boolean }>(`/portal/notifications/${id}/read/`)).data,
  markAllNotificationsRead: async () => (await api.post<{ ok: boolean; updated: number }>("/portal/notifications/read-all/")).data,
  visit: async (module: string) => (await api.post<{ ok: boolean }>("/portal/visit/", { module })).data,
};
