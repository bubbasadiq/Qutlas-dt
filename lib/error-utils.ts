/**
 * Utility for handling and mapping error messages to user-friendly versions.
 */

export const mapErrorMessage = (error: any): string => {
  if (!error) return "An unexpected error occurred. Please try again."

  const message = typeof error === 'string' 
    ? error 
    : (error.message || error.error || "An unexpected error occurred.")

  const lowerMessage = message.toLowerCase()

  // Network errors
  if (lowerMessage.includes("network") || lowerMessage.includes("fetch")) {
    return "Connection error. Please check your internet and try again."
  }

  // Authentication errors
  if (lowerMessage.includes("invalid login credentials")) {
    return "Invalid email or password. Please try again."
  }
  if (lowerMessage.includes("email not confirmed")) {
    return "Please verify your email address before signing in."
  }
  if (lowerMessage.includes("already registered") || lowerMessage.includes("already exists")) {
    return "This email is already registered. Try signing in instead."
  }
  if (lowerMessage.includes("weak password")) {
    return "Your password is too weak. Please use at least 8 characters."
  }
  if (lowerMessage.includes("invalid email")) {
    return "Please enter a valid email address."
  }

  // Rate limiting
  if (lowerMessage.includes("rate limit") || lowerMessage.includes("too many requests")) {
    return "Too many attempts. Please wait a moment and try again."
  }

  // Generic fallback for system errors that shouldn't be exposed
  if (
    lowerMessage.includes("database") || 
    lowerMessage.includes("sql") || 
    lowerMessage.includes("server error") ||
    lowerMessage.includes("internal") ||
    lowerMessage.includes("unexpected token") ||
    lowerMessage.includes("undefined")
  ) {
    return "Something went wrong on our end. We've been notified and are looking into it."
  }

  return message
}

/**
 * Logs the actual error for debugging but returns a friendly message for the UI
 */
export const handleFriendlyError = (error: any, context?: string): string => {
  console.error(`Error in ${context || 'app'}:`, error)
  return mapErrorMessage(error)
}
