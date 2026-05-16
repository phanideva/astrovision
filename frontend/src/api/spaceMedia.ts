import { api } from "./client";

export type ApodResponse = {
  date: string;
  title: string;
  explanation: string;
  url: string;
  hdurl?: string;
  media_type: "image" | "video";
  thumbnail_url?: string;
  copyright?: string;
  service_version?: string;
  error?: string;
};

export type NasaSearchItem = {
  href: string;
  data: Array<{
    nasa_id: string;
    title: string;
    description?: string;
    date_created?: string;
    keywords?: string[];
    center?: string;
  }>;
  links?: Array<{ href: string; rel: string; render?: string }>;
};

export type NasaSearchResponse = {
  collection: {
    items: NasaSearchItem[];
    metadata?: { total_hits: number };
    links?: Array<{ href: string; rel: string; prompt?: string }>;
  };
};

export type CuratedItem = {
  id: string;
  title: string;
  category: string;
  credit: string;
  thumb: string;
  full: string;
  source_url: string;
};

export const spaceMediaApi = {
  apod: async (date?: string) =>
    (await api.get<ApodResponse>("/space-media/apod/", { params: { date } })).data,
  search: async (q: string, page = 1) =>
    (await api.get<NasaSearchResponse>("/space-media/search/", { params: { q, page } })).data,
  curated: async () =>
    (await api.get<{ items: CuratedItem[] }>("/space-media/curated/")).data.items,
  proxyUrl: (url: string) =>
    `${(api.defaults.baseURL || "").replace(/\/$/, "")}/space-media/proxy/?url=${encodeURIComponent(
      url
    )}`,
  marsRover: async (params: { rover?: string; sol?: string; earth_date?: string; camera?: string; page?: number }) =>
    (await api.get<{ photos: any[] }>("/space-media/mars-rover/", { params })).data,
  epic: async (date?: string) =>
    (await api.get<{ items: any[] }>("/space-media/epic/", { params: { date } })).data,
  neoFeed: async (start?: string, end?: string) =>
    (await api.get<any>("/space-media/neo-feed/", { params: { start, end } })).data,
  eonet: async (limit = 20) =>
    (await api.get<any>("/space-media/eonet/", { params: { limit } })).data,
  launchNext: async (limit = 5) =>
    (await api.get<any>("/space-media/launch-next/", { params: { limit } })).data,
  exoplanets: async (limit = 200) =>
    (await api.get<{ items: any[] }>("/space-media/exoplanets/", { params: { limit } })).data,
};

export type PublicPrediction = {
  id: number;
  image: string;
  predicted_class: string;
  confidence: number;
  probabilities: Record<string, number>;
  created_at: string;
  handle: string;
};

export const galleryApi = {
  publicList: async (page = 1) =>
    (
      await api.get<{ count: number; results: PublicPrediction[] }>(
        "/predictions/public/",
        { params: { page } }
      )
    ).data,
  leaderboard: async () =>
    (
      await api.get<{ since: string; results: { handle: string; total: number }[] }>(
        "/predictions/leaderboard/"
      )
    ).data,
  togglePublic: async (id: number) =>
    (await api.post(`/predictions/${id}/toggle-public/`)).data,
};
