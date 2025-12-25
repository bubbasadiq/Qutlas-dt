// Material properties for geometry

use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};

#[wasm_bindgen]
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Material {
    name: String,
    color: [f32; 3],  // RGB 0-1
    metallic: f32,    // 0-1
    roughness: f32,   // 0-1
    opacity: f32,     // 0-1
}

#[wasm_bindgen]
impl Material {
    #[wasm_bindgen(constructor)]
    pub fn new(name: String, r: f32, g: f32, b: f32, metallic: f32, roughness: f32, opacity: f32) -> Self {
        Material {
            name,
            color: [r.clamp(0.0, 1.0), g.clamp(0.0, 1.0), b.clamp(0.0, 1.0)],
            metallic: metallic.clamp(0.0, 1.0),
            roughness: roughness.clamp(0.0, 1.0),
            opacity: opacity.clamp(0.0, 1.0),
        }
    }
    
    #[wasm_bindgen(getter)]
    pub fn name(&self) -> String {
        self.name.clone()
    }
    
    #[wasm_bindgen(getter)]
    pub fn color(&self) -> Vec<f32> {
        self.color.to_vec()
    }
    
    #[wasm_bindgen(getter)]
    pub fn metallic(&self) -> f32 {
        self.metallic
    }
    
    #[wasm_bindgen(getter)]
    pub fn roughness(&self) -> f32 {
        self.roughness
    }
    
    #[wasm_bindgen(getter)]
    pub fn opacity(&self) -> f32 {
        self.opacity
    }
    
    pub fn to_json(&self) -> Result<JsValue, JsValue> {
        serde_wasm_bindgen::to_value(&self)
            .map_err(|e| JsValue::from_str(&format!("Failed to serialize material: {}", e)))
    }
}

// Material presets
#[wasm_bindgen]
pub fn create_aluminum_material() -> Material {
    Material::new(
        "Aluminum 6061-T6".to_string(),
        0.75, 0.77, 0.78,  // Light gray
        0.85,              // Fairly metallic
        0.3,               // Slightly rough
        1.0,               // Opaque
    )
}

#[wasm_bindgen]
pub fn create_steel_material() -> Material {
    Material::new(
        "Stainless Steel 304".to_string(),
        0.70, 0.72, 0.73,  // Gray
        0.95,              // Very metallic
        0.2,               // Smooth
        1.0,               // Opaque
    )
}

#[wasm_bindgen]
pub fn create_plastic_material() -> Material {
    Material::new(
        "ABS Plastic".to_string(),
        0.85, 0.85, 0.90,  // Light blue-gray
        0.0,               // Not metallic
        0.5,               // Medium roughness
        1.0,               // Opaque
    )
}

#[wasm_bindgen]
pub fn create_brass_material() -> Material {
    Material::new(
        "Brass".to_string(),
        0.88, 0.78, 0.50,  // Golden
        0.90,              // Very metallic
        0.25,              // Somewhat smooth
        1.0,               // Opaque
    )
}

#[wasm_bindgen]
pub fn create_copper_material() -> Material {
    Material::new(
        "Copper".to_string(),
        0.95, 0.64, 0.54,  // Copper color
        0.95,              // Very metallic
        0.20,              // Smooth
        1.0,               // Opaque
    )
}

#[wasm_bindgen]
pub fn create_titanium_material() -> Material {
    Material::new(
        "Titanium".to_string(),
        0.66, 0.68, 0.70,  // Dark gray
        0.90,              // Very metallic
        0.35,              // Medium roughness
        1.0,               // Opaque
    )
}

impl Default for Material {
    fn default() -> Self {
        create_aluminum_material()
    }
}
