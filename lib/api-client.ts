// API client with environment-based URL routing
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1"
const INTERNAL_API_URL = "http://localhost:3001/internal"

export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

export async function fetchApi<T = any>(
  endpoint: string,
  options?: RequestInit & { token?: string },
): Promise<ApiResponse<T>> {
  const { token, ...fetchOptions } = options || {}

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...fetchOptions.headers,
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }))
      return { error: error.message || "API Error" }
    }

    const data = await response.json()
    return { data }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// Catalog endpoints
export const catalogApi = {
  list: (token: string) => fetchApi("/catalog", { token }),
  getById: (id: string, token: string) => fetchApi(`/catalog/${id}`, { token }),
  getHubs: (id: string, token: string) => fetchApi(`/catalog/${id}/hubs`, { token }),
  create: (data: any, token: string) => fetchApi("/catalog", { method: "POST", body: JSON.stringify(data), token }),
}

// Jobs endpoints
export const jobsApi = {
  create: (data: any, token: string) => fetchApi("/jobs/create", { method: "POST", body: JSON.stringify(data), token }),
  getById: (id: string, token: string) => fetchApi(`/jobs/${id}`, { token }),
  list: (token: string) => fetchApi("/jobs", { token }),
}

// Upload endpoints
export const uploadApi = {
  asset: (file: File, token: string) => {
    const formData = new FormData()
    formData.append("file", file)
    return fetchApi("/upload/asset", { method: "POST", body: formData, token })
  },
}
