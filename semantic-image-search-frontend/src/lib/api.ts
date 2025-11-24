const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface SearchResult {
  id: string | null;
  score: number;
  metadata: {
    image_url?: string;
    thumbnail_url?: string;
    description?: string;
    photographer?: string;
    photographer_profile?: string;
    tags?: string[];
    query?: string;
    source?: string;
    width?: number;
    height?: number;
    color?: string;
  };
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  count: number;
  top_k: number;
  ingested: Array<{
    id: string;
    image_url: string;
    query: string;
    [key: string]: any;
  }>;
}

export interface SearchRequest {
  query: string;
  mode?: 'text' | 'image' | 'hybrid';
  image_url?: string;
  ingest?: boolean;
  page?: number;
  per_page?: number;
  top_k?: number;
  min_score?: number;
  // Filters
  color?: string;
  orientation?: 'landscape' | 'portrait' | 'squarish';
  date_from?: string;
  date_to?: string;
  // Weighted scoring
  image_weight?: number;
  text_weight?: number;
  metadata_weight?: number;
  use_advanced_scoring?: boolean;
}

export interface Category {
  id: string | null;
  title: string | null;
  slug: string | null;
  description: string | null;
  cover_photo_url: string | null;
}

export interface CategoriesResponse {
  categories: Category[];
}

export interface StatsResponse {
  dimension: number;
  namespaces: Record<string, number>;
  total_vectors: number;
}

export interface EmbeddingResponse {
  embedding: number[];
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  async search(params: SearchRequest): Promise<SearchResponse> {
    return this.request<SearchResponse>('/search', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getCategories(perPage?: number): Promise<CategoriesResponse> {
    const params = perPage ? `?per_page=${perPage}` : '';
    return this.request<CategoriesResponse>(`/categories${params}`);
  }

  async getStats(): Promise<StatsResponse> {
    return this.request<StatsResponse>('/stats');
  }

  async generateTextEmbedding(text: string): Promise<EmbeddingResponse> {
    return this.request<EmbeddingResponse>('/embeddings/text', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  async generateImageEmbedding(imageUrl: string): Promise<EmbeddingResponse> {
    return this.request<EmbeddingResponse>('/embeddings/image-url', {
      method: 'POST',
      body: JSON.stringify({ image_url: imageUrl }),
    });
  }

  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/health');
  }

  async uploadImageSearch(
    file: File,
    options: {
      query?: string;
      top_k?: number;
      min_score?: number;
    } = {}
  ): Promise<SearchResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    // Build query params
    const params = new URLSearchParams();
    if (options.query) params.append('query', options.query);
    if (options.top_k) params.append('top_k', options.top_k.toString());
    if (options.min_score) params.append('min_score', options.min_score.toString());
    
    const url = `${this.baseUrl}/upload-search${params.toString() ? '?' + params.toString() : ''}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - browser will set it with boundary
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }
}

export const apiClient = new ApiClient();
