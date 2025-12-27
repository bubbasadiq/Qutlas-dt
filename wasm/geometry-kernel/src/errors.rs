//! Comprehensive error handling for the geometry kernel.
//!
//! All errors provide context and can be serialized to JSON for TypeScript integration.

use serde::{Deserialize, Serialize};
use std::fmt;

/// Kernel error codes for programmatic error handling in TypeScript
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum ErrorCode {
    #[serde(rename = "INVALID_JSON")]
    InvalidJson,
    #[serde(rename = "INVALID_INTENT")]
    InvalidIntent,
    #[serde(rename = "UNKNOWN_PRIMITIVE")]
    UnknownPrimitive,
    #[serde(rename = "UNKNOWN_OPERATION")]
    UnknownOperation,
    #[serde(rename = "MISSING_PARAMETER")]
    MissingParameter,
    #[serde(rename = "INVALID_PARAMETER")]
    InvalidParameter,
    #[serde(rename = "CIRCULAR_REFERENCE")]
    CircularReference,
    #[serde(rename = "CSG_ERROR")]
    CsgError,
    #[serde(rename = "MESH_GENERATION_ERROR")]
    MeshGenerationError,
    #[serde(rename = "STEP_EXPORT_ERROR")]
    StepExportError,
    #[serde(rename = "CONSTRAINT_VIOLATION")]
    ConstraintViolation,
    #[serde(rename = "TOPOLOGY_ERROR")]
    TopologyError,
    #[serde(rename = "INTERNAL_ERROR")]
    InternalError,
}

impl fmt::Display for ErrorCode {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ErrorCode::InvalidJson => write!(f, "INVALID_JSON"),
            ErrorCode::InvalidIntent => write!(f, "INVALID_INTENT"),
            ErrorCode::UnknownPrimitive => write!(f, "UNKNOWN_PRIMITIVE"),
            ErrorCode::UnknownOperation => write!(f, "UNKNOWN_OPERATION"),
            ErrorCode::MissingParameter => write!(f, "MISSING_PARAMETER"),
            ErrorCode::InvalidParameter => write!(f, "INVALID_PARAMETER"),
            ErrorCode::CircularReference => write!(f, "CIRCULAR_REFERENCE"),
            ErrorCode::CsgError => write!(f, "CSG_ERROR"),
            ErrorCode::MeshGenerationError => write!(f, "MESH_GENERATION_ERROR"),
            ErrorCode::StepExportError => write!(f, "STEP_EXPORT_ERROR"),
            ErrorCode::ConstraintViolation => write!(f, "CONSTRAINT_VIOLATION"),
            ErrorCode::TopologyError => write!(f, "TOPOLOGY_ERROR"),
            ErrorCode::InternalError => write!(f, "INTERNAL_ERROR"),
        }
    }
}

/// Comprehensive error type with context for debugging
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KernelError {
    pub code: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub context: Option<ErrorContext>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hint: Option<String>,
}

impl KernelError {
    pub fn new(code: ErrorCode, message: impl Into<String>) -> Self {
        KernelError {
            code: code.to_string(),
            message: message.into(),
            context: None,
            hint: None,
        }
    }

    pub fn with_context(mut self, context: ErrorContext) -> Self {
        self.context = Some(context);
        self
    }

    pub fn with_hint(mut self, hint: impl Into<String>) -> Self {
        self.hint = Some(hint.into());
        self
    }
}

impl fmt::Display for KernelError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "[{}] {}", self.code, self.message)
    }
}

impl std::error::Error for KernelError {}

/// Additional context about where an error occurred
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorContext {
    pub operation_id: Option<String>,
    pub primitive_type: Option<String>,
    pub parameter: Option<String>,
    pub line: Option<usize>,
    pub details: Option<String>,
}

impl ErrorContext {
    pub fn new() -> Self {
        ErrorContext {
            operation_id: None,
            primitive_type: None,
            parameter: None,
            line: None,
            details: None,
        }
    }

    pub fn with_operation(mut self, id: impl Into<String>) -> Self {
        self.operation_id = Some(id.into());
        self
    }

    pub fn with_primitive(mut self, type_: impl Into<String>) -> Self {
        self.primitive_type = Some(type_.into());
        self
    }

    pub fn with_parameter(mut self, param: impl Into<String>) -> Self {
        self.parameter = Some(param.into());
        self
    }

    pub fn with_details(mut self, details: impl Into<String>) -> Self {
        self.details = Some(details.into());
        self
    }
}

/// Type alias for Result with KernelError
pub type KernelResult<T> = Result<T, KernelError>;

/// Convenience constructors for common errors
impl KernelError {
    pub fn invalid_json(msg: impl Into<String>) -> Self {
        KernelError::new(ErrorCode::InvalidJson, msg)
    }

    pub fn invalid_intent(msg: impl Into<String>) -> Self {
        KernelError::new(ErrorCode::InvalidIntent, msg)
    }

    pub fn unknown_primitive(type_: impl Into<String>) -> Self {
        KernelError::new(
            ErrorCode::UnknownPrimitive,
            format!("Unknown primitive type: {}", type_.into()),
        )
    }

    pub fn unknown_operation(type_: impl Into<String>) -> Self {
        KernelError::new(
            ErrorCode::UnknownOperation,
            format!("Unknown operation type: {}", type_.into()),
        )
    }

    pub fn missing_parameter(param: impl Into<String>) -> Self {
        KernelError::new(
            ErrorCode::MissingParameter,
            format!("Missing required parameter: {}", param.into()),
        )
    }

    pub fn invalid_parameter(param: impl Into<String>, value: impl Into<String>) -> Self {
        KernelError::new(
            ErrorCode::InvalidParameter,
            format!("Invalid parameter '{}': {}", param.into(), value.into()),
        )
    }

    pub fn circular_reference(id: impl Into<String>) -> Self {
        KernelError::new(
            ErrorCode::CircularReference,
            format!("Circular reference detected involving: {}", id.into()),
        )
    }

    pub fn csg_error(msg: impl Into<String>) -> Self {
        KernelError::new(ErrorCode::CsgError, msg)
    }

    pub fn mesh_generation_error(msg: impl Into<String>) -> Self {
        KernelError::new(ErrorCode::MeshGenerationError, msg)
    }

    pub fn step_export_error(msg: impl Into<String>) -> Self {
        KernelError::new(ErrorCode::StepExportError, msg)
    }

    pub fn constraint_violation(msg: impl Into<String>) -> Self {
        KernelError::new(ErrorCode::ConstraintViolation, msg)
    }

    pub fn topology_error(msg: impl Into<String>) -> Self {
        KernelError::new(ErrorCode::TopologyError, msg)
    }

    pub fn internal(msg: impl Into<String>) -> Self {
        KernelError::new(ErrorCode::InternalError, msg)
    }
}
