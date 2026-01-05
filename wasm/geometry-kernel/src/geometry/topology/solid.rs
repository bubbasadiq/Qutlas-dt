//! Solid definitions for topological solids in manufacturing-aware geometric representation.
//!
//! This module defines solids as the highest-level topological entities, composed of
//! shells and representing manufacturable volumes. Solids maintain manufacturing
//! constraints and support assembly-scale reasoning.

use crate::errors::{KernelError, KernelResult};
use crate::geometry::topology::{Shell, ShellId, ShellType};
use crate::types::BoundingBox;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Unique identifier for solids
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct SolidId(String);

impl SolidId {
    /// Create a new solid ID
    pub fn new(id: String) -> Self {
        SolidId(id)
    }

    /// Get string representation
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

/// Topological solid representing a manufacturable volume
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Solid {
    /// Outer shell defining the solid boundary
    pub outer_shell: ShellId,
    /// Inner shells defining voids/cavities
    pub inner_shells: Vec<ShellId>,
    /// Solid type classification
    pub solid_type: SolidType,
    /// Manufacturing material specification
    pub material: Option<MaterialSpec>,
    /// Manufacturing tolerance for this solid
    pub tolerance: f64,
    /// Solid volume (computed)
    pub volume: f64,
    /// Solid surface area (computed)
    pub surface_area: f64,
    /// Solid mass (volume * density)
    pub mass: f64,
    /// Bounding box (computed)
    pub bounding_box: Option<BoundingBox>,
    /// Manufacturing constraints
    pub manufacturing_constraints: Vec<SolidConstraint>,
    /// Assembly context information
    pub assembly_info: Option<AssemblyInfo>,
    /// Manufacturing process compatibility
    pub compatible_processes: Vec<crate::geometry::ir::ManufacturingProcess>,
}

impl Solid {
    /// Create a new solid with outer shell
    pub fn new(outer_shell: ShellId, solid_type: SolidType) -> Self {
        Solid {
            outer_shell,
            inner_shells: Vec::new(),
            solid_type,
            material: None,
            tolerance: 1e-6,
            volume: 0.0,
            surface_area: 0.0,
            mass: 0.0,
            bounding_box: None,
            manufacturing_constraints: Vec::new(),
            assembly_info: None,
            compatible_processes: Vec::new(),
        }
    }

    /// Create solid with material specification
    pub fn with_material(
        outer_shell: ShellId,
        solid_type: SolidType,
        material: MaterialSpec,
    ) -> Self {
        let mut solid = Solid::new(outer_shell, solid_type);
        solid.material = Some(material);
        solid
    }

    /// Add inner shell (void/cavity)
    pub fn add_inner_shell(&mut self, inner_shell: ShellId) {
        self.inner_shells.push(inner_shell);
    }

    /// Validate solid topology
    pub fn validate(&self, shell_collection: &HashMap<ShellId, Shell>) -> KernelResult<()> {
        // Check that outer shell exists and is closed
        let outer_shell = shell_collection
            .get(&self.outer_shell)
            .ok_or_else(|| KernelError::internal("Outer shell not found".to_string()))?;

        if outer_shell.shell_type != ShellType::Closed {
            return Err(KernelError::internal(
                "Solid outer shell must be closed".to_string(),
            ));
        }

        // Check that all inner shells exist and are closed
        for inner_shell_id in &self.inner_shells {
            let inner_shell = shell_collection.get(inner_shell_id).ok_or_else(|| {
                KernelError::internal(format!("Inner shell {} not found", inner_shell_id.as_str()))
            })?;

            if inner_shell.shell_type != ShellType::Closed {
                return Err(KernelError::internal(
                    "Solid inner shells must be closed".to_string(),
                ));
            }

            // Inner shells should be oriented inward (voids)
            if !inner_shell.is_void {
                // This could be a warning rather than error
            }
        }

        // Validate shell topology
        outer_shell.validate(&HashMap::new())?; // Would pass face collection

        for inner_shell_id in &self.inner_shells {
            if let Some(inner_shell) = shell_collection.get(inner_shell_id) {
                inner_shell.validate(&HashMap::new())?;
            }
        }

        Ok(())
    }

    /// Check if solid is manifold
    pub fn is_manifold(&self, shell_collection: &HashMap<ShellId, Shell>) -> bool {
        // Check outer shell manifoldness
        if let Some(outer_shell) = shell_collection.get(&self.outer_shell) {
            if !outer_shell.is_manifold(&HashMap::new()) {
                return false;
            }
        }

        // Check inner shells manifoldness
        for inner_shell_id in &self.inner_shells {
            if let Some(inner_shell) = shell_collection.get(inner_shell_id) {
                if !inner_shell.is_manifold(&HashMap::new()) {
                    return false;
                }
            }
        }

        true
    }

    /// Compute solid volume accounting for voids
    pub fn compute_volume(
        &mut self,
        shell_collection: &HashMap<ShellId, Shell>,
    ) -> KernelResult<f64> {
        let mut total_volume = 0.0;

        // Add outer shell volume
        if let Some(outer_shell) = shell_collection.get(&self.outer_shell) {
            total_volume += outer_shell.volume;
        }

        // Subtract inner shell volumes (voids)
        for inner_shell_id in &self.inner_shells {
            if let Some(inner_shell) = shell_collection.get(inner_shell_id) {
                total_volume -= inner_shell.volume;
            }
        }

        self.volume = total_volume.max(0.0); // Volume cannot be negative

        // Update mass if material is specified
        if let Some(ref material) = self.material {
            self.mass = self.volume * material.density;
        }

        Ok(self.volume)
    }

    /// Compute total surface area
    pub fn compute_surface_area(
        &mut self,
        shell_collection: &HashMap<ShellId, Shell>,
    ) -> KernelResult<f64> {
        let mut total_area = 0.0;

        // Add outer shell surface area
        if let Some(outer_shell) = shell_collection.get(&self.outer_shell) {
            total_area += outer_shell.surface_area;
        }

        // Add inner shell surface areas (internal surfaces)
        for inner_shell_id in &self.inner_shells {
            if let Some(inner_shell) = shell_collection.get(inner_shell_id) {
                total_area += inner_shell.surface_area;
            }
        }

        self.surface_area = total_area;
        Ok(self.surface_area)
    }

    /// Check if solid is manufacturable
    pub fn is_manufacturable(&self, shell_collection: &HashMap<ShellId, Shell>) -> bool {
        // Check solid-level constraints
        for constraint in &self.manufacturing_constraints {
            if !constraint.is_satisfied(self, shell_collection) {
                return false;
            }
        }

        // Check outer shell manufacturability
        if let Some(outer_shell) = shell_collection.get(&self.outer_shell) {
            if !outer_shell.is_manufacturable(&HashMap::new()) {
                return false;
            }
        }

        // Check inner shells manufacturability
        for inner_shell_id in &self.inner_shells {
            if let Some(inner_shell) = shell_collection.get(inner_shell_id) {
                if !inner_shell.is_manufacturable(&HashMap::new()) {
                    return false;
                }
            }
        }

        // Check solid-specific manufacturability constraints
        match self.solid_type {
            SolidType::Simple => true, // Simple solids are generally manufacturable
            SolidType::Composite => {
                // Composite solids may have complex interfaces
                self.inner_shells.len() <= 10 // Limit complexity
            }
            SolidType::Assembly => {
                // Assembly solids need proper interfaces
                self.assembly_info.is_some()
            }
            SolidType::Sheet => {
                // Sheet solids should have high aspect ratio
                if self.volume > 0.0 && self.surface_area > 0.0 {
                    let thickness = self.volume / self.surface_area;
                    thickness >= 0.1 && thickness <= 100.0 // Reasonable thickness range
                } else {
                    false
                }
            }
            SolidType::Wire => {
                // Wire solids are generally not manufacturable as volumes
                false
            }
        }
    }

    /// Get manufacturing complexity score (0-100, higher = more complex)
    pub fn manufacturing_complexity(&self, shell_collection: &HashMap<ShellId, Shell>) -> f64 {
        let mut complexity = 0.0;

        // Base complexity from solid type
        complexity += match self.solid_type {
            SolidType::Simple => 10.0,
            SolidType::Composite => 30.0,
            SolidType::Assembly => 50.0,
            SolidType::Sheet => 20.0,
            SolidType::Wire => 5.0,
        };

        // Add complexity for voids
        complexity += self.inner_shells.len() as f64 * 15.0;

        // Add complexity from shell analysis
        if let Some(outer_shell) = shell_collection.get(&self.outer_shell) {
            complexity += outer_shell.face_count() as f64 * 2.0;

            // Non-manifold topology increases complexity
            if !outer_shell.is_manifold(&HashMap::new()) {
                complexity += 25.0;
            }
        }

        // Volume-to-surface ratio complexity (thin parts are harder)
        if self.surface_area > 0.0 {
            let ratio = self.volume / self.surface_area;
            if ratio < 0.1 {
                complexity += 20.0; // Thin parts
            } else if ratio > 10.0 {
                complexity += 15.0; // Very thick parts
            }
        }

        complexity.min(100.0)
    }

    /// Get compatible manufacturing processes
    pub fn update_compatible_processes(&mut self, shell_collection: &HashMap<ShellId, Shell>) {
        let mut processes = vec![
            crate::geometry::ir::ManufacturingProcess::CNCMilling,
            crate::geometry::ir::ManufacturingProcess::Printing3D,
        ];

        // Filter based on solid characteristics
        match self.solid_type {
            SolidType::Sheet => {
                processes.push(crate::geometry::ir::ManufacturingProcess::SheetMetal);
                // Remove processes unsuitable for sheet materials
                processes.retain(|p| {
                    !matches!(p, crate::geometry::ir::ManufacturingProcess::DieCasting)
                });
            }
            SolidType::Simple => {
                // Simple solids can use most processes
                processes.push(crate::geometry::ir::ManufacturingProcess::CNCTurning);
                processes.push(crate::geometry::ir::ManufacturingProcess::InjectionMolding);
                processes.push(crate::geometry::ir::ManufacturingProcess::DieCasting);
            }
            SolidType::Composite => {
                // Composite solids may need specialized processes
                processes.retain(|p| {
                    matches!(
                        p,
                        crate::geometry::ir::ManufacturingProcess::CNCMilling
                            | crate::geometry::ir::ManufacturingProcess::Printing3D
                    )
                });
            }
            SolidType::Assembly => {
                // Assemblies are manufactured as separate parts
                processes.clear();
            }
            SolidType::Wire => {
                // Wire solids use specialized processes
                processes.clear();
            }
        }

        // Filter based on complexity
        let complexity = self.manufacturing_complexity(shell_collection);
        if complexity > 80.0 {
            // Very complex parts may only be 3D printable
            processes
                .retain(|p| matches!(p, crate::geometry::ir::ManufacturingProcess::Printing3D));
        }

        self.compatible_processes = processes;
    }

    /// Add manufacturing constraint
    pub fn add_constraint(&mut self, constraint: SolidConstraint) {
        self.manufacturing_constraints.push(constraint);
    }

    /// Set assembly context
    pub fn set_assembly_info(&mut self, info: AssemblyInfo) {
        self.assembly_info = Some(info);
    }

    /// Get shell count (outer + inner)
    pub fn shell_count(&self) -> usize {
        1 + self.inner_shells.len()
    }

    /// Check if solid has voids
    pub fn has_voids(&self) -> bool {
        !self.inner_shells.is_empty()
    }
}

/// Types of solids for different geometric entities
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SolidType {
    /// Simple solid (single connected component)
    Simple,
    /// Composite solid (multiple features/operations)
    Composite,
    /// Assembly solid (collection of parts)
    Assembly,
    /// Sheet solid (thin-walled structure)
    Sheet,
    /// Wire solid (1D structure, not really a volume)
    Wire,
}

/// Material specification for manufacturing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MaterialSpec {
    /// Material name
    pub name: String,
    /// Density (kg/m³)
    pub density: f64,
    /// Young's modulus (Pa)
    pub youngs_modulus: Option<f64>,
    /// Poisson's ratio
    pub poissons_ratio: Option<f64>,
    /// Yield strength (Pa)
    pub yield_strength: Option<f64>,
    /// Manufacturing properties
    pub manufacturing_properties: HashMap<String, f64>,
}

impl MaterialSpec {
    /// Create material specification for common materials
    pub fn aluminum() -> Self {
        let mut props = HashMap::new();
        props.insert("machinability_rating".to_string(), 80.0);
        props.insert("weldability_rating".to_string(), 85.0);

        MaterialSpec {
            name: "Aluminum 6061".to_string(),
            density: 2700.0,
            youngs_modulus: Some(69e9),
            poissons_ratio: Some(0.33),
            yield_strength: Some(276e6),
            manufacturing_properties: props,
        }
    }

    pub fn steel() -> Self {
        let mut props = HashMap::new();
        props.insert("machinability_rating".to_string(), 70.0);
        props.insert("weldability_rating".to_string(), 90.0);

        MaterialSpec {
            name: "Carbon Steel 1020".to_string(),
            density: 7850.0,
            youngs_modulus: Some(200e9),
            poissons_ratio: Some(0.30),
            yield_strength: Some(350e6),
            manufacturing_properties: props,
        }
    }

    pub fn plastic_abs() -> Self {
        let mut props = HashMap::new();
        props.insert("print_temperature".to_string(), 230.0);
        props.insert("bed_temperature".to_string(), 80.0);

        MaterialSpec {
            name: "ABS Plastic".to_string(),
            density: 1040.0,
            youngs_modulus: Some(2.3e9),
            poissons_ratio: Some(0.40),
            yield_strength: Some(40e6),
            manufacturing_properties: props,
        }
    }
}

/// Assembly context information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssemblyInfo {
    /// Assembly name/identifier
    pub assembly_name: String,
    /// Part number in assembly
    pub part_number: String,
    /// Interfaces with other parts
    pub interfaces: Vec<AssemblyInterface>,
    /// Assembly constraints
    pub constraints: Vec<AssemblyConstraint>,
    /// Installation sequence information
    pub installation_sequence: Option<u32>,
}

/// Interface between assembly parts
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssemblyInterface {
    /// Interface type
    pub interface_type: InterfaceType,
    /// Mating part identifier
    pub mating_part: String,
    /// Interface location/surfaces
    pub location: InterfaceLocation,
    /// Tolerance requirements
    pub tolerances: HashMap<String, f64>,
}

/// Types of assembly interfaces
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum InterfaceType {
    /// Bolted connection
    Bolted,
    /// Welded connection
    Welded,
    /// Press fit
    PressFit,
    /// Sliding fit
    SlidingFit,
    /// Threaded connection
    Threaded,
    /// Adhesive bond
    Adhesive,
}

/// Interface location specification
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InterfaceLocation {
    /// Surface identifiers involved in interface
    pub surfaces: Vec<String>,
    /// Interface coordinate system
    pub coordinate_system: Option<[f64; 16]>, // 4x4 transformation matrix
}

/// Assembly constraint
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssemblyConstraint {
    /// Constraint type
    pub constraint_type: AssemblyConstraintType,
    /// Constraint parameters
    pub parameters: HashMap<String, f64>,
    /// Related parts
    pub related_parts: Vec<String>,
}

/// Types of assembly constraints
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum AssemblyConstraintType {
    /// Distance constraint
    Distance,
    /// Angle constraint
    Angle,
    /// Concentricity constraint
    Concentric,
    /// Parallelism constraint
    Parallel,
    /// Perpendicularity constraint
    Perpendicular,
}

/// Manufacturing constraints for solids
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SolidConstraint {
    /// Type of constraint
    pub constraint_type: SolidConstraintType,
    /// Constraint parameters
    pub parameters: HashMap<String, f64>,
    /// Manufacturing process this applies to
    pub process: crate::geometry::ir::ManufacturingProcess,
}

impl SolidConstraint {
    /// Create minimum volume constraint
    pub fn min_volume(volume: f64, process: crate::geometry::ir::ManufacturingProcess) -> Self {
        let mut parameters = HashMap::new();
        parameters.insert("min_volume".to_string(), volume);

        SolidConstraint {
            constraint_type: SolidConstraintType::MinVolume,
            parameters,
            process,
        }
    }

    /// Create maximum complexity constraint
    pub fn max_complexity(
        complexity: f64,
        process: crate::geometry::ir::ManufacturingProcess,
    ) -> Self {
        let mut parameters = HashMap::new();
        parameters.insert("max_complexity".to_string(), complexity);

        SolidConstraint {
            constraint_type: SolidConstraintType::MaxComplexity,
            parameters,
            process,
        }
    }

    /// Create material compatibility constraint
    pub fn material_compatible(process: crate::geometry::ir::ManufacturingProcess) -> Self {
        SolidConstraint {
            constraint_type: SolidConstraintType::MaterialCompatible,
            parameters: HashMap::new(),
            process,
        }
    }

    /// Check if constraint is satisfied
    pub fn is_satisfied(&self, solid: &Solid, shell_collection: &HashMap<ShellId, Shell>) -> bool {
        match self.constraint_type {
            SolidConstraintType::MinVolume => {
                if let Some(min_volume) = self.parameters.get("min_volume") {
                    solid.volume >= *min_volume
                } else {
                    true
                }
            }
            SolidConstraintType::MaxComplexity => {
                if let Some(max_complexity) = self.parameters.get("max_complexity") {
                    solid.manufacturing_complexity(shell_collection) <= *max_complexity
                } else {
                    true
                }
            }
            SolidConstraintType::MaterialCompatible => {
                if let Some(ref material) = solid.material {
                    // Check if material is compatible with process
                    match self.process {
                        crate::geometry::ir::ManufacturingProcess::CNCMilling => {
                            // Most materials can be machined
                            true
                        }
                        crate::geometry::ir::ManufacturingProcess::Printing3D => {
                            // Check if material has printing properties
                            material
                                .manufacturing_properties
                                .contains_key("print_temperature")
                        }
                        crate::geometry::ir::ManufacturingProcess::InjectionMolding => {
                            // Only certain materials suitable for molding
                            material.name.contains("Plastic") || material.name.contains("Polymer")
                        }
                        _ => true, // Other processes have their own rules
                    }
                } else {
                    false // No material specified
                }
            }
        }
    }
}

/// Types of solid constraints for manufacturing
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum SolidConstraintType {
    /// Minimum volume constraint
    MinVolume,
    /// Maximum manufacturing complexity
    MaxComplexity,
    /// Material compatibility requirement
    MaterialCompatible,
}

/// Collection of topological solids
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TopologicalSolid {
    /// All solids in the collection
    solids: HashMap<SolidId, Solid>,
    /// Next available solid index
    next_solid_index: usize,
}

impl TopologicalSolid {
    /// Create new topological solid collection
    pub fn new() -> Self {
        TopologicalSolid {
            solids: HashMap::new(),
            next_solid_index: 0,
        }
    }

    /// Add solid to collection
    pub fn add_solid(&mut self, solid: Solid) -> KernelResult<SolidId> {
        let solid_id = SolidId::new(format!("solid_{}", self.next_solid_index));
        self.next_solid_index += 1;

        self.solids.insert(solid_id.clone(), solid);
        Ok(solid_id)
    }

    /// Get solid by ID
    pub fn get_solid(&self, solid_id: &SolidId) -> Option<&Solid> {
        self.solids.get(solid_id)
    }

    /// Get mutable solid by ID
    pub fn get_solid_mut(&mut self, solid_id: &SolidId) -> Option<&mut Solid> {
        self.solids.get_mut(solid_id)
    }

    /// Validate all solids
    pub fn validate(&self, shell_collection: &HashMap<ShellId, Shell>) -> KernelResult<()> {
        for solid in self.solids.values() {
            solid.validate(shell_collection)?;
        }
        Ok(())
    }

    /// Get statistics about solid collection
    pub fn stats(&self, shell_collection: &HashMap<ShellId, Shell>) -> SolidCollectionStats {
        let total_solids = self.solids.len();
        let mut solid_type_counts = HashMap::new();
        let mut total_volume = 0.0;
        let mut total_mass = 0.0;
        let mut manufacturability_count = 0;
        let mut avg_complexity = 0.0;

        for solid in self.solids.values() {
            *solid_type_counts
                .entry(solid.solid_type.clone())
                .or_insert(0) += 1;
            total_volume += solid.volume;
            total_mass += solid.mass;
            avg_complexity += solid.manufacturing_complexity(shell_collection);

            if solid.is_manufacturable(shell_collection) {
                manufacturability_count += 1;
            }
        }

        if total_solids > 0 {
            avg_complexity /= total_solids as f64;
        }

        let manufacturability_ratio = if total_solids > 0 {
            manufacturability_count as f64 / total_solids as f64
        } else {
            0.0
        };

        SolidCollectionStats {
            total_solids,
            solid_type_counts,
            total_volume,
            total_mass,
            avg_complexity,
            manufacturability_ratio,
        }
    }
}

impl Default for TopologicalSolid {
    fn default() -> Self {
        Self::new()
    }
}

/// Statistics for solid collections
#[derive(Debug, Clone)]
pub struct SolidCollectionStats {
    pub total_solids: usize,
    pub solid_type_counts: HashMap<SolidType, usize>,
    pub total_volume: f64,
    pub total_mass: f64,
    pub avg_complexity: f64,
    pub manufacturability_ratio: f64,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_solid_creation() {
        let shell_id = ShellId::new("shell_1".to_string());
        let solid = Solid::new(shell_id.clone(), SolidType::Simple);

        assert_eq!(solid.outer_shell, shell_id);
        assert_eq!(solid.solid_type, SolidType::Simple);
        assert_eq!(solid.inner_shells.len(), 0);
        assert!(!solid.has_voids());
    }

    #[test]
    fn test_solid_with_material() {
        let shell_id = ShellId::new("shell_1".to_string());
        let material = MaterialSpec::aluminum();
        let solid = Solid::with_material(shell_id, SolidType::Simple, material.clone());

        assert!(solid.material.is_some());
        assert_eq!(solid.material.unwrap().name, material.name);
    }

    #[test]
    fn test_solid_with_voids() {
        let outer_shell = ShellId::new("outer".to_string());
        let inner_shell = ShellId::new("inner".to_string());

        let mut solid = Solid::new(outer_shell, SolidType::Composite);
        solid.add_inner_shell(inner_shell);

        assert!(solid.has_voids());
        assert_eq!(solid.shell_count(), 2);
    }

    #[test]
    fn test_material_specs() {
        let aluminum = MaterialSpec::aluminum();
        assert_eq!(aluminum.density, 2700.0);
        assert!(aluminum.youngs_modulus.is_some());

        let steel = MaterialSpec::steel();
        assert_eq!(steel.density, 7850.0);

        let plastic = MaterialSpec::plastic_abs();
        assert!(plastic
            .manufacturing_properties
            .contains_key("print_temperature"));
    }

    #[test]
    fn test_solid_constraints() {
        use crate::geometry::ir::ManufacturingProcess;

        let constraint = SolidConstraint::min_volume(100.0, ManufacturingProcess::CNCMilling);
        assert_eq!(constraint.constraint_type, SolidConstraintType::MinVolume);

        let mut solid = Solid::new(ShellId::new("test".to_string()), SolidType::Simple);
        solid.volume = 50.0; // Less than minimum

        assert!(!constraint.is_satisfied(&solid, &HashMap::new()));

        solid.volume = 150.0; // More than minimum
        assert!(constraint.is_satisfied(&solid, &HashMap::new()));
    }

    #[test]
    fn test_manufacturing_complexity() {
        let shell_collection = HashMap::new();

        let simple_solid = Solid::new(ShellId::new("simple".to_string()), SolidType::Simple);
        let simple_complexity = simple_solid.manufacturing_complexity(&shell_collection);

        let mut composite_solid =
            Solid::new(ShellId::new("composite".to_string()), SolidType::Composite);
        composite_solid.add_inner_shell(ShellId::new("void1".to_string()));
        composite_solid.add_inner_shell(ShellId::new("void2".to_string()));
        let composite_complexity = composite_solid.manufacturing_complexity(&shell_collection);

        assert!(composite_complexity > simple_complexity);
    }

    #[test]
    fn test_topological_solid_collection() {
        let mut collection = TopologicalSolid::new();
        let shell_id = ShellId::new("shell_1".to_string());
        let solid = Solid::new(shell_id, SolidType::Simple);

        let solid_id = collection.add_solid(solid).unwrap();
        assert!(collection.get_solid(&solid_id).is_some());

        let shell_collection = HashMap::new();
        let stats = collection.stats(&shell_collection);
        assert_eq!(stats.total_solids, 1);
    }

    #[test]
    fn test_assembly_info() {
        let mut solid = Solid::new(ShellId::new("part".to_string()), SolidType::Assembly);

        let assembly_info = AssemblyInfo {
            assembly_name: "Test Assembly".to_string(),
            part_number: "PART-001".to_string(),
            interfaces: Vec::new(),
            constraints: Vec::new(),
            installation_sequence: Some(1),
        };

        solid.set_assembly_info(assembly_info.clone());
        assert!(solid.assembly_info.is_some());
        assert_eq!(
            solid.assembly_info.unwrap().part_number,
            assembly_info.part_number
        );
    }

    #[test]
    fn test_compatible_processes() {
        let shell_collection = HashMap::new();

        let mut simple_solid = Solid::new(ShellId::new("simple".to_string()), SolidType::Simple);
        simple_solid.update_compatible_processes(&shell_collection);

        // Simple solids should be compatible with many processes
        assert!(simple_solid.compatible_processes.len() > 3);

        let mut sheet_solid = Solid::new(ShellId::new("sheet".to_string()), SolidType::Sheet);
        sheet_solid.update_compatible_processes(&shell_collection);

        // Sheet solids should include sheet metal processes
        assert!(sheet_solid
            .compatible_processes
            .contains(&crate::geometry::ir::ManufacturingProcess::SheetMetal));
    }

    #[test]
    fn test_solid_volume_calculation() {
        let mut shell_collection = HashMap::new();

        let mut outer_shell = Shell::new(Vec::new(), crate::geometry::topology::ShellType::Closed);
        outer_shell.volume = 100.0;
        let outer_shell_id = ShellId::new("outer".to_string());
        shell_collection.insert(outer_shell_id.clone(), outer_shell);

        let mut inner_shell = Shell::new(Vec::new(), crate::geometry::topology::ShellType::Closed);
        inner_shell.volume = 30.0;
        let inner_shell_id = ShellId::new("inner".to_string());
        shell_collection.insert(inner_shell_id.clone(), inner_shell);

        let mut solid = Solid::new(outer_shell_id.clone(), SolidType::Solid);
        solid.inner_shells.push(inner_shell_id.clone());

        let calculated_volume = solid.calculate_volume(&shell_collection);

        // Volume should be outer - inner = 100 - 30 = 70
        assert_eq!(calculated_volume, 70.0);
    }
}
