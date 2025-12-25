// hooks/use-projects.ts
// Hook for managing user projects

import { useState, useEffect, useCallback } from "react"
import { projectsApi } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"

export function useProjects() {
  const { user } = useAuth()
  const [projects, setProjects] = useState({
    data: [],
    isLoading: true,
    error: null
  })

  const fetchProjects = useCallback(async () => {
    if (!user) {
      setProjects(prev => ({ ...prev, isLoading: false, data: [] }))
      return
    }

    try {
      setProjects(prev => ({ ...prev, isLoading: true, error: null }))
      const response = await projectsApi.list(user.id)
      
      if (response.data) {
        setProjects(prev => ({ ...prev, data: response.data.projects || [], isLoading: false }))
      } else {
        throw new Error(response.error || "Failed to fetch projects")
      }
    } catch (error) {
      setProjects(prev => ({ ...prev, error: error instanceof Error ? error.message : "Unknown error", isLoading: false }))
    }
  }, [user])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const createProject = async (name: string, description: string = "", workspaceData: any = {}) => {
    if (!user) {
      throw new Error("User not authenticated")
    }

    try {
      const response = await projectsApi.create(user.id, {
        name,
        description,
        workspaceData
      })

      if (response.data) {
        await fetchProjects() // Refresh the list
        return response.data
      } else {
        throw new Error(response.error || "Failed to create project")
      }
    } catch (error) {
      throw error instanceof Error ? error : new Error("Unknown error")
    }
  }

  const getProjectById = async (projectId: string) => {
    if (!user) {
      throw new Error("User not authenticated")
    }

    try {
      const response = await projectsApi.getById(projectId, user.id)
      
      if (response.data) {
        return response.data
      } else {
        throw new Error(response.error || "Project not found")
      }
    } catch (error) {
      throw error instanceof Error ? error : new Error("Unknown error")
    }
  }

  const updateProject = async (projectId: string, updates: {
    name?: string
    description?: string
    workspaceData?: any
    status?: string
  }) => {
    if (!user) {
      throw new Error("User not authenticated")
    }

    try {
      const response = await projectsApi.update(projectId, user.id, updates)
      
      if (response.data) {
        await fetchProjects() // Refresh the list
        return response.data
      } else {
        throw new Error(response.error || "Failed to update project")
      }
    } catch (error) {
      throw error instanceof Error ? error : new Error("Unknown error")
    }
  }

  return {
    ...projects,
    fetchProjects,
    createProject,
    getProjectById,
    updateProject
  }
}