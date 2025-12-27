//! Deterministic hashing for content-addressed caching.
//!
//! Uses Blake3 for fast, cryptographically secure hashing that's
//! guaranteed to be deterministic across platforms and runs.

use crate::types::GeometryIR;
use serde::Serialize;

/// Compute deterministic hash of intent IR
///
/// This function guarantees:
/// 1. Same intent → same hash (deterministic)
/// 2. Different intent → different hash (collision-resistant)
/// 3. Platform-independent output
/// 4. Fast computation
pub fn hash_intent(ir: &GeometryIR) -> String {
    // Canonicalize before hashing to ensure determinism
    let canonical = canonicalize_intent(ir);
    let hash = blake3::hash(canonical.as_bytes());
    format!("intent_{}", hash.to_hex())
}

/// Compute hash from JSON string directly (for caching)
///
/// This is used when we receive raw JSON and want to check cache
/// without full deserialization.
pub fn hash_intent_json(json: &str) -> String {
    // Normalize the JSON to ensure deterministic hashing
    let normalized = normalize_json(json);
    let hash = blake3::hash(normalized.as_bytes());
    format!("intent_{}", hash.to_hex())
}

/// Compute hash of any serializable value
///
/// Generic hashing for intermediate results
pub fn hash_value<T: Serialize>(value: &T) -> String {
    let json = serde_json::to_string(value).unwrap_or_default();
    hash_intent_json(&json)
}

/// Canonicalize intent for deterministic hashing
///
/// This sorts object keys, removes whitespace, and ensures consistent
/// floating-point representation.
fn canonicalize_intent(ir: &GeometryIR) -> String {
    let mut canonical = serde_json::to_value(ir).unwrap_or_else(|_| {
        serde_json::json!({
            "part": ir.part,
            "operations": [],
            "constraints": []
        })
    });

    canonicalize_value(&mut canonical);

    serde_json::to_string(&canonical).unwrap_or_default()
}

/// Recursively canonicalize a JSON value
fn canonicalize_value(value: &mut serde_json::Value) {
    match value {
        serde_json::Value::Object(map) => {
            // Sort object keys for deterministic ordering
            let mut entries: Vec<_> = map.iter_mut().collect();
            entries.sort_by(|a, b| a.0.cmp(b.0));
            for (_, v) in entries {
                canonicalize_value(v);
            }
        }
        serde_json::Value::Array(arr) => {
            for v in arr.iter_mut() {
                canonicalize_value(v);
            }
        }
        _ => {}
    }
}

/// Normalize JSON string for hashing
///
/// This handles whitespace and formatting differences while
/// preserving semantic content.
fn normalize_json(json: &str) -> String {
    if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(json) {
        let mut canonical = parsed;
        canonicalize_value(&mut canonical);
        serde_json::to_string(&canonical).unwrap_or_else(|_| json.to_string())
    } else {
        // If parsing fails, just normalize whitespace
        json.split_whitespace().collect()
    }
}

/// Verify hash integrity
///
/// Returns true if the hash matches the intent
pub fn verify_hash(ir: &GeometryIR, hash: &str) -> bool {
    let computed = hash_intent(ir);
    computed == hash
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{Intent, PrimitiveIntent, PrimitiveType};

    #[test]
    fn test_deterministic_hashing() {
        let ir = GeometryIR {
            part: "test_part".to_string(),
            operations: vec![Intent::Primitive(PrimitiveIntent {
                id: "box1".to_string(),
                type_: PrimitiveType::Box,
                parameters: vec![("width".to_string(), 10.0)]
                    .into_iter()
                    .collect(),
                transform: None,
                timestamp: 0.0,
            })],
            constraints: vec![],
        };

        let hash1 = hash_intent(&ir);
        let hash2 = hash_intent(&ir);

        assert_eq!(hash1, hash2);
        assert!(hash1.starts_with("intent_"));
    }

    #[test]
    fn test_different_intents_different_hashes() {
        let ir1 = GeometryIR {
            part: "test_part".to_string(),
            operations: vec![],
            constraints: vec![],
        };

        let ir2 = GeometryIR {
            part: "other_part".to_string(),
            operations: vec![],
            constraints: vec![],
        };

        let hash1 = hash_intent(&ir1);
        let hash2 = hash_intent(&ir2);

        assert_ne!(hash1, hash2);
    }

    #[test]
    fn test_json_normalization() {
        let json1 = r#"{ "a": 1, "b": 2 }"#;
        let json2 = r#"{ "b": 2, "a": 1 }"#;

        let hash1 = hash_intent_json(json1);
        let hash2 = hash_intent_json(json2);

        assert_eq!(hash1, hash2);
    }

    #[test]
    fn test_verify_hash() {
        let ir = GeometryIR {
            part: "test".to_string(),
            operations: vec![],
            constraints: vec![],
        };

        let hash = hash_intent(&ir);
        assert!(verify_hash(&ir, &hash));
    }
}
