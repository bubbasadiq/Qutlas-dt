// hooks/use-stats.ts
// Hook for fetching platform and user statistics

import { useState, useEffect } from "react"
import { statsApi } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"

export function usePlatformStats() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    totalParts: 0,
    totalHubs: 0,
    isLoading: true,
    error: null
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStats(prev => ({ ...prev, isLoading: true, error: null }))
        const response = await statsApi.getPlatformStats()
        
        if (response.data) {
          setStats(prev => ({ ...prev, ...response.data, isLoading: false }))
        } else {
          throw new Error(response.error || "Failed to fetch platform statistics")
        }
      } catch (error) {
        setStats(prev => ({ ...prev, error: error instanceof Error ? error.message : "Unknown error", isLoading: false }))
      }
    }

    fetchStats()
  }, [])

  return stats
}

export function useUserStats() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    userId: "",
    email: "",
    totalProjects: 0,
    totalCompletedJobs: 0,
    accountCreated: "",
    isLoading: true,
    error: null
  })

  useEffect(() => {
    if (!user) {
      setStats(prev => ({ ...prev, isLoading: false }))
      return
    }

    const fetchUserStats = async () => {
      try {
        setStats(prev => ({ ...prev, isLoading: true, error: null }))
        const response = await statsApi.getUserStats(user.id)
        
        if (response.data) {
          setStats(prev => ({ ...prev, ...response.data, isLoading: false }))
        } else {
          throw new Error(response.error || "Failed to fetch user statistics")
        }
      } catch (error) {
        setStats(prev => ({ ...prev, error: error instanceof Error ? error.message : "Unknown error", isLoading: false }))
      }
    }

    fetchUserStats()
  }, [user])

  return stats
}

export function useRecentProjects() {
  const { user } = useAuth()
  const [projects, setProjects] = useState({
    data: [],
    isLoading: true,
    error: null
  })

  useEffect(() => {
    if (!user) {
      setProjects(prev => ({ ...prev, isLoading: false }))
      return
    }

    const fetchProjects = async () => {
      try {
        setProjects(prev => ({ ...prev, isLoading: true, error: null }))
        const response = await statsApi.getRecentProjects(user.id)
        
        if (response.data) {
          setProjects(prev => ({ ...prev, data: response.data.projects || [], isLoading: false }))
        } else {
          throw new Error(response.error || "Failed to fetch recent projects")
        }
      } catch (error) {
        setProjects(prev => ({ ...prev, error: error instanceof Error ? error.message : "Unknown error", isLoading: false }))
      }
    }

    fetchProjects()
  }, [user])

  return projects
}

export function useFeaturedProjects() {
  const [projects, setProjects] = useState({
    data: [],
    isLoading: true,
    error: null
  })

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setProjects(prev => ({ ...prev, isLoading: true, error: null }))
        const response = await statsApi.getFeaturedProjects()
        
        if (response.data) {
          setProjects(prev => ({ ...prev, data: response.data.projects || [], isLoading: false }))
        } else {
          throw new Error(response.error || "Failed to fetch featured projects")
        }
      } catch (error) {
        setProjects(prev => ({ ...prev, error: error instanceof Error ? error.message : "Unknown error", isLoading: false }))
      }
    }

    fetchProjects()
  }, [])

  return projects
}

export function useTestimonials() {
  const [testimonials, setTestimonials] = useState({
    data: [],
    isLoading: true,
    error: null
  })

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        setTestimonials(prev => ({ ...prev, isLoading: true, error: null }))
        const response = await statsApi.getTestimonials()
        
        if (response.data) {
          setTestimonials(prev => ({ ...prev, data: response.data.testimonials || [], isLoading: false }))
        } else {
          throw new Error(response.error || "Failed to fetch testimonials")
        }
      } catch (error) {
        setTestimonials(prev => ({ ...prev, error: error instanceof Error ? error.message : "Unknown error", isLoading: false }))
      }
    }

    fetchTestimonials()
  }, [])

  return testimonials
}