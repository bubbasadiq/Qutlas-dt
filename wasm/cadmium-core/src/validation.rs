// Parameter validation for geometry operations

use wasm_bindgen::JsValue;

const MIN_DIMENSION: f64 = 0.01;  // 0.01mm minimum
const MAX_DIMENSION: f64 = 10000.0; // 10m maximum
const EPSILON: f64 = 1e-10;

pub struct ValidationError {
    pub message: String,
}

impl ValidationError {
    pub fn new(message: impl Into<String>) -> Self {
        Self {
            message: message.into(),
        }
    }
    
    pub fn to_js_value(&self) -> JsValue {
        JsValue::from_str(&self.message)
    }
}

pub type ValidationResult<T> = Result<T, ValidationError>;

pub fn validate_dimension(value: f64, name: &str) -> ValidationResult<()> {
    if value <= EPSILON {
        return Err(ValidationError::new(format!(
            "{} must be positive (got {})",
            name, value
        )));
    }
    
    if value < MIN_DIMENSION {
        return Err(ValidationError::new(format!(
            "{} must be at least {}mm (got {}mm)",
            name, MIN_DIMENSION, value
        )));
    }
    
    if value > MAX_DIMENSION {
        return Err(ValidationError::new(format!(
            "{} must not exceed {}mm (got {}mm)",
            name, MAX_DIMENSION, value
        )));
    }
    
    Ok(())
}

pub fn validate_radius(radius: f64, name: &str) -> ValidationResult<()> {
    validate_dimension(radius, name)
}

pub fn validate_segments(segments: u32, min: u32) -> ValidationResult<()> {
    if segments < min {
        return Err(ValidationError::new(format!(
            "Segments must be at least {} (got {})",
            min, segments
        )));
    }
    
    if segments > 1000 {
        return Err(ValidationError::new(format!(
            "Segments must not exceed 1000 (got {})",
            segments
        )));
    }
    
    Ok(())
}

pub fn validate_box_dimensions(width: f64, height: f64, depth: f64) -> ValidationResult<()> {
    validate_dimension(width, "width")?;
    validate_dimension(height, "height")?;
    validate_dimension(depth, "depth")?;
    Ok(())
}

pub fn validate_cylinder(radius: f64, height: f64, segments: u32) -> ValidationResult<()> {
    validate_radius(radius, "radius")?;
    validate_dimension(height, "height")?;
    validate_segments(segments, 3)?;
    Ok(())
}

pub fn validate_sphere(radius: f64, segments_lat: u32, segments_lon: u32) -> ValidationResult<()> {
    validate_radius(radius, "radius")?;
    validate_segments(segments_lat, 3)?;
    validate_segments(segments_lon, 3)?;
    Ok(())
}

pub fn validate_cone(radius: f64, height: f64, segments: u32) -> ValidationResult<()> {
    validate_radius(radius, "radius")?;
    validate_dimension(height, "height")?;
    validate_segments(segments, 3)?;
    
    // Cone-specific: radius should be reasonable relative to height
    if radius > height * 2.0 {
        return Err(ValidationError::new(format!(
            "Cone radius ({}) should not exceed twice the height ({})",
            radius, height
        )));
    }
    
    Ok(())
}

pub fn validate_torus(major_radius: f64, minor_radius: f64, segments_major: u32, segments_minor: u32) -> ValidationResult<()> {
    validate_radius(major_radius, "major radius")?;
    validate_radius(minor_radius, "minor radius")?;
    validate_segments(segments_major, 3)?;
    validate_segments(segments_minor, 3)?;
    
    if minor_radius >= major_radius {
        return Err(ValidationError::new(format!(
            "Minor radius ({}) must be less than major radius ({})",
            minor_radius, major_radius
        )));
    }
    
    Ok(())
}

pub fn validate_hole(diameter: f64, depth: f64) -> ValidationResult<()> {
    validate_dimension(diameter, "hole diameter")?;
    validate_dimension(depth, "hole depth")?;
    
    if diameter > 1000.0 {
        return Err(ValidationError::new(format!(
            "Hole diameter should not exceed 1000mm (got {}mm)",
            diameter
        )));
    }
    
    Ok(())
}

pub fn validate_fillet_radius(radius: f64) -> ValidationResult<()> {
    validate_dimension(radius, "fillet radius")?;
    
    if radius > 100.0 {
        return Err(ValidationError::new(format!(
            "Fillet radius should not exceed 100mm (got {}mm)",
            radius
        )));
    }
    
    Ok(())
}

pub fn validate_chamfer_distance(distance: f64) -> ValidationResult<()> {
    validate_dimension(distance, "chamfer distance")?;
    
    if distance > 100.0 {
        return Err(ValidationError::new(format!(
            "Chamfer distance should not exceed 100mm (got {}mm)",
            distance
        )));
    }
    
    Ok(())
}
