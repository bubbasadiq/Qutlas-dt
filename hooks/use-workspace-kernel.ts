import { useWorkspace } from './use-workspace'

/**
 * Hook to access the kernel result from the workspace
 * This is used by components that need to render kernel-generated geometry
 */
export function useWorkspaceKernelResult() {
  const workspace = useWorkspace()
  return workspace.kernelResult
}
