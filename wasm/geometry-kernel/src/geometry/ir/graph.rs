//! Dependency graph and deterministic ordering for IR nodes.
//!
//! This module manages the evaluation order of IR nodes based on their
//! dependencies, ensuring deterministic and reproducible geometry generation.

use crate::errors::{KernelError, KernelResult};
use crate::geometry::ir::node::{IRNode, NodeId};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet, VecDeque};

/// Dependency graph for IR nodes with topological ordering
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IRGraph {
    /// All nodes indexed by their ID
    nodes: HashMap<NodeId, IRNode>,

    /// Forward dependencies: node_id -> [nodes that depend on this node]
    forward_deps: HashMap<NodeId, HashSet<NodeId>>,

    /// Reverse dependencies: node_id -> [nodes this node depends on]
    reverse_deps: HashMap<NodeId, HashSet<NodeId>>,

    /// Cached topological order
    cached_order: Option<Vec<NodeId>>,

    /// Graph modification counter for cache invalidation
    modification_count: u64,
}

impl IRGraph {
    /// Create a new empty graph
    pub fn new() -> Self {
        IRGraph {
            nodes: HashMap::new(),
            forward_deps: HashMap::new(),
            reverse_deps: HashMap::new(),
            cached_order: None,
            modification_count: 0,
        }
    }

    /// Add a node to the graph
    pub fn add_node(&mut self, node: IRNode) -> KernelResult<()> {
        let node_id = node.id.clone();

        // Validate dependencies exist
        for dep_id in &node.dependencies {
            if !self.nodes.contains_key(dep_id) {
                return Err(KernelError::invalid_graph(format!(
                    "Dependency {} not found for node {}",
                    dep_id.as_str(),
                    node_id.as_str()
                )));
            }
        }

        // Check for circular dependencies
        if self.would_create_cycle(&node_id, &node.dependencies)? {
            return Err(KernelError::invalid_graph(format!(
                "Adding node {} would create a circular dependency",
                node_id.as_str()
            )));
        }

        // Remove existing node if updating
        if self.nodes.contains_key(&node_id) {
            self.remove_node(&node_id)?;
        }

        // Update dependency mappings
        for dep_id in &node.dependencies {
            self.forward_deps
                .entry(dep_id.clone())
                .or_insert_with(HashSet::new)
                .insert(node_id.clone());

            self.reverse_deps
                .entry(node_id.clone())
                .or_insert_with(HashSet::new)
                .insert(dep_id.clone());
        }

        // Add the node
        self.nodes.insert(node_id, node);
        self.invalidate_cache();

        Ok(())
    }

    /// Remove a node from the graph
    pub fn remove_node(&mut self, node_id: &NodeId) -> KernelResult<()> {
        if !self.nodes.contains_key(node_id) {
            return Err(KernelError::node_not_found(node_id.as_str()));
        }

        // Check if other nodes depend on this one
        if let Some(dependents) = self.forward_deps.get(node_id) {
            if !dependents.is_empty() {
                return Err(KernelError::invalid_graph(format!(
                    "Cannot remove node {} - other nodes depend on it: {:?}",
                    node_id.as_str(),
                    dependents.iter().map(|id| id.as_str()).collect::<Vec<_>>()
                )));
            }
        }

        // Remove from dependency mappings
        if let Some(deps) = self.reverse_deps.remove(node_id) {
            for dep_id in deps {
                if let Some(forward_set) = self.forward_deps.get_mut(&dep_id) {
                    forward_set.remove(node_id);
                    if forward_set.is_empty() {
                        self.forward_deps.remove(&dep_id);
                    }
                }
            }
        }

        self.forward_deps.remove(node_id);
        self.nodes.remove(node_id);
        self.invalidate_cache();

        Ok(())
    }

    /// Get a node by ID
    pub fn get_node(&self, node_id: &NodeId) -> Option<&IRNode> {
        self.nodes.get(node_id)
    }

    /// Get mutable reference to a node by ID
    pub fn get_node_mut(&mut self, node_id: &NodeId) -> Option<&mut IRNode> {
        if self.nodes.contains_key(node_id) {
            self.invalidate_cache();
        }
        self.nodes.get_mut(node_id)
    }

    /// Get all nodes in the graph
    pub fn nodes(&self) -> &HashMap<NodeId, IRNode> {
        &self.nodes
    }

    /// Get topological ordering of nodes for evaluation
    pub fn topological_order(&mut self) -> KernelResult<&Vec<NodeId>> {
        if self.cached_order.is_none() {
            let order = self.compute_topological_order()?;
            self.cached_order = Some(order);
        }

        Ok(self.cached_order.as_ref().unwrap())
    }

    /// Get nodes that depend on the given node
    pub fn get_dependents(&self, node_id: &NodeId) -> Vec<&NodeId> {
        self.forward_deps
            .get(node_id)
            .map(|set| set.iter().collect())
            .unwrap_or_default()
    }

    /// Get nodes that the given node depends on
    pub fn get_dependencies(&self, node_id: &NodeId) -> Vec<&NodeId> {
        self.reverse_deps
            .get(node_id)
            .map(|set| set.iter().collect())
            .unwrap_or_default()
    }

    /// Get all root nodes (nodes with no dependencies)
    pub fn get_root_nodes(&self) -> Vec<&NodeId> {
        self.nodes
            .keys()
            .filter(|node_id| {
                self.reverse_deps
                    .get(node_id)
                    .map(|deps| deps.is_empty())
                    .unwrap_or(true)
            })
            .collect()
    }

    /// Get all leaf nodes (nodes with no dependents)
    pub fn get_leaf_nodes(&self) -> Vec<&NodeId> {
        self.nodes
            .keys()
            .filter(|node_id| {
                self.forward_deps
                    .get(node_id)
                    .map(|deps| deps.is_empty())
                    .unwrap_or(true)
            })
            .collect()
    }

    /// Validate the entire graph for consistency
    pub fn validate(&self) -> KernelResult<()> {
        // Check all dependencies exist
        for (node_id, node) in &self.nodes {
            for dep_id in &node.dependencies {
                if !self.nodes.contains_key(dep_id) {
                    return Err(KernelError::invalid_graph(format!(
                        "Node {} references non-existent dependency {}",
                        node_id.as_str(),
                        dep_id.as_str()
                    )));
                }
            }
        }

        // Check for cycles
        if self.has_cycles()? {
            return Err(KernelError::invalid_graph(
                "Graph contains cycles".to_string(),
            ));
        }

        // Validate dependency mapping consistency
        for (node_id, forward_deps) in &self.forward_deps {
            for dependent_id in forward_deps {
                let reverse_deps = self.reverse_deps.get(dependent_id).ok_or_else(|| {
                    KernelError::invalid_graph(format!(
                        "Inconsistent dependency mapping for node {}",
                        dependent_id.as_str()
                    ))
                })?;

                if !reverse_deps.contains(node_id) {
                    return Err(KernelError::invalid_graph(format!(
                        "Forward/reverse dependency mismatch: {} -> {}",
                        node_id.as_str(),
                        dependent_id.as_str()
                    )));
                }
            }
        }

        Ok(())
    }

    /// Compute strongly connected components
    pub fn strongly_connected_components(&self) -> Vec<Vec<NodeId>> {
        let mut index_counter = 0;
        let mut stack = Vec::new();
        let mut indices: HashMap<NodeId, usize> = HashMap::new();
        let mut lowlinks: HashMap<NodeId, usize> = HashMap::new();
        let mut on_stack: HashSet<NodeId> = HashSet::new();
        let mut components = Vec::new();

        for node_id in self.nodes.keys() {
            if !indices.contains_key(node_id) {
                self.tarjan_scc(
                    node_id,
                    &mut index_counter,
                    &mut stack,
                    &mut indices,
                    &mut lowlinks,
                    &mut on_stack,
                    &mut components,
                );
            }
        }

        components
    }

    /// Create a subgraph containing only the specified nodes and their dependencies
    pub fn subgraph(&self, node_ids: &[NodeId]) -> KernelResult<IRGraph> {
        let mut subgraph = IRGraph::new();
        let mut to_include = HashSet::new();

        // Collect all dependencies recursively
        let mut queue: VecDeque<NodeId> = node_ids.iter().cloned().collect();
        while let Some(node_id) = queue.pop_front() {
            if to_include.insert(node_id.clone()) {
                if let Some(node) = self.nodes.get(&node_id) {
                    for dep_id in &node.dependencies {
                        queue.push_back(dep_id.clone());
                    }
                }
            }
        }

        // Add nodes in dependency order
        let ordered_nodes = self.get_ordered_subset(&to_include)?;
        for node_id in ordered_nodes {
            if let Some(node) = self.nodes.get(&node_id) {
                subgraph.add_node(node.clone())?;
            }
        }

        Ok(subgraph)
    }

    /// Get statistics about the graph
    pub fn stats(&self) -> GraphStats {
        let node_count = self.nodes.len();
        let edge_count: usize = self.reverse_deps.values().map(|deps| deps.len()).sum();
        let root_count = self.get_root_nodes().len();
        let leaf_count = self.get_leaf_nodes().len();

        let max_depth = self.compute_max_depth();
        let avg_dependencies = if node_count > 0 {
            edge_count as f64 / node_count as f64
        } else {
            0.0
        };

        GraphStats {
            node_count,
            edge_count,
            root_count,
            leaf_count,
            max_depth,
            avg_dependencies,
        }
    }

    // Private helper methods

    fn invalidate_cache(&mut self) {
        self.cached_order = None;
        self.modification_count += 1;
    }

    fn would_create_cycle(
        &self,
        new_node_id: &NodeId,
        dependencies: &[NodeId],
    ) -> KernelResult<bool> {
        // Use DFS to check if adding these dependencies would create a cycle
        let mut visited = HashSet::new();
        let mut rec_stack = HashSet::new();

        for dep_id in dependencies {
            if self.has_path_to(dep_id, new_node_id, &mut visited, &mut rec_stack)? {
                return Ok(true);
            }
        }

        Ok(false)
    }

    fn has_path_to(
        &self,
        from: &NodeId,
        to: &NodeId,
        visited: &mut HashSet<NodeId>,
        rec_stack: &mut HashSet<NodeId>,
    ) -> KernelResult<bool> {
        if from == to {
            return Ok(true);
        }

        if rec_stack.contains(from) {
            return Ok(false); // Already exploring this path
        }

        visited.insert(from.clone());
        rec_stack.insert(from.clone());

        if let Some(forward_deps) = self.forward_deps.get(from) {
            for dep_id in forward_deps {
                if self.has_path_to(dep_id, to, visited, rec_stack)? {
                    return Ok(true);
                }
            }
        }

        rec_stack.remove(from);
        Ok(false)
    }

    fn compute_topological_order(&self) -> KernelResult<Vec<NodeId>> {
        let mut in_degree: HashMap<NodeId, usize> = HashMap::new();
        let mut result = Vec::new();
        let mut queue = VecDeque::new();

        // Initialize in-degrees
        for node_id in self.nodes.keys() {
            let degree = self
                .reverse_deps
                .get(node_id)
                .map(|deps| deps.len())
                .unwrap_or(0);
            in_degree.insert(node_id.clone(), degree);

            if degree == 0 {
                queue.push_back(node_id.clone());
            }
        }

        // Process nodes in topological order
        while let Some(node_id) = queue.pop_front() {
            result.push(node_id.clone());

            // Process dependents
            if let Some(dependents) = self.forward_deps.get(&node_id) {
                for dependent_id in dependents {
                    let current_degree = in_degree.get_mut(dependent_id).unwrap();
                    *current_degree -= 1;

                    if *current_degree == 0 {
                        queue.push_back(dependent_id.clone());
                    }
                }
            }
        }

        // Check for cycles
        if result.len() != self.nodes.len() {
            return Err(KernelError::invalid_graph(
                "Graph contains cycles".to_string(),
            ));
        }

        // Sort by evaluation priority for deterministic ordering
        result.sort_by(|a, b| {
            let node_a = self.nodes.get(a).unwrap();
            let node_b = self.nodes.get(b).unwrap();

            node_a
                .evaluation_priority()
                .cmp(&node_b.evaluation_priority())
                .then_with(|| a.as_str().cmp(b.as_str())) // Tie-breaker for determinism
        });

        Ok(result)
    }

    fn has_cycles(&self) -> KernelResult<bool> {
        let mut white = HashSet::new();
        let mut gray = HashSet::new();
        let mut black = HashSet::new();

        // Initialize all nodes as white (unvisited)
        for node_id in self.nodes.keys() {
            white.insert(node_id.clone());
        }

        // DFS from each unvisited node
        while let Some(node_id) = white.iter().next().cloned() {
            if self.dfs_has_cycle(&node_id, &mut white, &mut gray, &mut black)? {
                return Ok(true);
            }
        }

        Ok(false)
    }

    fn dfs_has_cycle(
        &self,
        node_id: &NodeId,
        white: &mut HashSet<NodeId>,
        gray: &mut HashSet<NodeId>,
        black: &mut HashSet<NodeId>,
    ) -> KernelResult<bool> {
        white.remove(node_id);
        gray.insert(node_id.clone());

        if let Some(forward_deps) = self.forward_deps.get(node_id) {
            for dependent_id in forward_deps {
                if gray.contains(dependent_id) {
                    return Ok(true); // Back edge found - cycle detected
                }

                if white.contains(dependent_id) {
                    if self.dfs_has_cycle(dependent_id, white, gray, black)? {
                        return Ok(true);
                    }
                }
            }
        }

        gray.remove(node_id);
        black.insert(node_id.clone());
        Ok(false)
    }

    fn tarjan_scc(
        &self,
        node_id: &NodeId,
        index_counter: &mut usize,
        stack: &mut Vec<NodeId>,
        indices: &mut HashMap<NodeId, usize>,
        lowlinks: &mut HashMap<NodeId, usize>,
        on_stack: &mut HashSet<NodeId>,
        components: &mut Vec<Vec<NodeId>>,
    ) {
        indices.insert(node_id.clone(), *index_counter);
        lowlinks.insert(node_id.clone(), *index_counter);
        *index_counter += 1;
        stack.push(node_id.clone());
        on_stack.insert(node_id.clone());

        if let Some(forward_deps) = self.forward_deps.get(node_id) {
            for dependent_id in forward_deps {
                if !indices.contains_key(dependent_id) {
                    self.tarjan_scc(
                        dependent_id,
                        index_counter,
                        stack,
                        indices,
                        lowlinks,
                        on_stack,
                        components,
                    );
                    let dependent_lowlink = *lowlinks.get(dependent_id).unwrap();
                    let current_lowlink = lowlinks.get_mut(node_id).unwrap();
                    *current_lowlink = (*current_lowlink).min(dependent_lowlink);
                } else if on_stack.contains(dependent_id) {
                    let dependent_index = *indices.get(dependent_id).unwrap();
                    let current_lowlink = lowlinks.get_mut(node_id).unwrap();
                    *current_lowlink = (*current_lowlink).min(dependent_index);
                }
            }
        }

        let node_index = *indices.get(node_id).unwrap();
        let node_lowlink = *lowlinks.get(node_id).unwrap();

        if node_lowlink == node_index {
            let mut component = Vec::new();
            loop {
                let w = stack.pop().unwrap();
                on_stack.remove(&w);
                component.push(w.clone());
                if w == *node_id {
                    break;
                }
            }
            components.push(component);
        }
    }

    fn get_ordered_subset(&self, node_ids: &HashSet<NodeId>) -> KernelResult<Vec<NodeId>> {
        let mut in_degree: HashMap<NodeId, usize> = HashMap::new();
        let mut result = Vec::new();
        let mut queue = VecDeque::new();

        // Initialize in-degrees for subset
        for node_id in node_ids {
            let degree = self
                .reverse_deps
                .get(node_id)
                .map(|deps| deps.iter().filter(|dep| node_ids.contains(dep)).count())
                .unwrap_or(0);
            in_degree.insert(node_id.clone(), degree);

            if degree == 0 {
                queue.push_back(node_id.clone());
            }
        }

        // Process nodes in topological order
        while let Some(node_id) = queue.pop_front() {
            result.push(node_id.clone());

            if let Some(dependents) = self.forward_deps.get(&node_id) {
                for dependent_id in dependents {
                    if let Some(current_degree) = in_degree.get_mut(dependent_id) {
                        *current_degree -= 1;
                        if *current_degree == 0 {
                            queue.push_back(dependent_id.clone());
                        }
                    }
                }
            }
        }

        Ok(result)
    }

    fn compute_max_depth(&self) -> usize {
        let mut max_depth = 0;
        let mut memo: HashMap<NodeId, usize> = HashMap::new();

        for node_id in self.nodes.keys() {
            let depth = self.compute_node_depth(node_id, &mut memo);
            max_depth = max_depth.max(depth);
        }

        max_depth
    }

    fn compute_node_depth(&self, node_id: &NodeId, memo: &mut HashMap<NodeId, usize>) -> usize {
        if let Some(&cached_depth) = memo.get(node_id) {
            return cached_depth;
        }

        let depth = if let Some(deps) = self.reverse_deps.get(node_id) {
            if deps.is_empty() {
                0
            } else {
                1 + deps
                    .iter()
                    .map(|dep_id| self.compute_node_depth(dep_id, memo))
                    .max()
                    .unwrap_or(0)
            }
        } else {
            0
        };

        memo.insert(node_id.clone(), depth);
        depth
    }
}

impl Default for IRGraph {
    fn default() -> Self {
        Self::new()
    }
}

/// Graph statistics for analysis and debugging
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphStats {
    pub node_count: usize,
    pub edge_count: usize,
    pub root_count: usize,
    pub leaf_count: usize,
    pub max_depth: usize,
    pub avg_dependencies: f64,
}

// Extension to KernelError for graph-specific errors
impl KernelError {
    pub fn invalid_graph(message: String) -> Self {
        KernelError::internal(format!("Invalid graph: {}", message))
    }

    pub fn node_not_found(node_id: &str) -> Self {
        KernelError::internal(format!("Node not found: {}", node_id))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::geometry::ir::node::{NodeContent, NodeMetadata, NodeSource, NodeType};

    fn create_test_node(id: &str, deps: Vec<NodeId>) -> IRNode {
        let metadata = NodeMetadata::new(Some(id.to_string()), NodeSource::User);
        let content = NodeContent::Primitive {
            primitive_type: "box".to_string(),
            parameters: std::collections::HashMap::new(),
            transform: None,
        };

        IRNode::with_user_id(id, NodeType::Primitive, content, deps, metadata).unwrap()
    }

    #[test]
    fn test_graph_creation() {
        let mut graph = IRGraph::new();
        let node1 = create_test_node("node1", vec![]);

        graph.add_node(node1).unwrap();
        assert_eq!(graph.nodes().len(), 1);
    }

    #[test]
    fn test_dependency_validation() {
        let mut graph = IRGraph::new();

        // Try to add node with non-existent dependency
        let invalid_dep = NodeId::from_user_string("nonexistent");
        let node = create_test_node("node1", vec![invalid_dep]);

        assert!(graph.add_node(node).is_err());
    }

    #[test]
    fn test_cycle_detection() {
        let mut graph = IRGraph::new();

        // Add initial nodes
        let node1 = create_test_node("node1", vec![]);
        let node1_id = node1.id.clone();
        graph.add_node(node1).unwrap();

        let node2 = create_test_node("node2", vec![node1_id.clone()]);
        let node2_id = node2.id.clone();
        graph.add_node(node2).unwrap();

        // Try to create cycle: node1 -> node2 -> node1
        let node1_updated = create_test_node("node1", vec![node2_id]);
        assert!(graph.add_node(node1_updated).is_err());
    }

    #[test]
    fn test_topological_ordering() {
        let mut graph = IRGraph::new();

        // Create dependency chain: node1 -> node2 -> node3
        let node1 = create_test_node("node1", vec![]);
        let node1_id = node1.id.clone();
        graph.add_node(node1).unwrap();

        let node2 = create_test_node("node2", vec![node1_id.clone()]);
        let node2_id = node2.id.clone();
        graph.add_node(node2).unwrap();

        let node3 = create_test_node("node3", vec![node2_id.clone()]);
        graph.add_node(node3).unwrap();

        let order = graph.topological_order().unwrap();

        // Find positions in the order
        let pos1 = order.iter().position(|id| id == &node1_id).unwrap();
        let pos2 = order.iter().position(|id| id == &node2_id).unwrap();

        assert!(pos1 < pos2, "Dependencies should come before dependents");
    }

    #[test]
    fn test_root_and_leaf_nodes() {
        let mut graph = IRGraph::new();

        let root = create_test_node("root", vec![]);
        let root_id = root.id.clone();
        graph.add_node(root).unwrap();

        let leaf = create_test_node("leaf", vec![root_id.clone()]);
        let leaf_id = leaf.id.clone();
        graph.add_node(leaf).unwrap();

        let roots = graph.get_root_nodes();
        let leaves = graph.get_leaf_nodes();

        assert_eq!(roots.len(), 1);
        assert_eq!(leaves.len(), 1);
        assert_eq!(*roots[0], root_id);
        assert_eq!(*leaves[0], leaf_id);
    }

    #[test]
    fn test_subgraph_extraction() {
        let mut graph = IRGraph::new();

        // Create chain: A -> B -> C
        let node_a = create_test_node("A", vec![]);
        let id_a = node_a.id.clone();
        graph.add_node(node_a).unwrap();

        let node_b = create_test_node("B", vec![id_a.clone()]);
        let id_b = node_b.id.clone();
        graph.add_node(node_b).unwrap();

        let node_c = create_test_node("C", vec![id_b.clone()]);
        let id_c = node_c.id.clone();
        graph.add_node(node_c).unwrap();

        // Extract subgraph containing just C (should include A and B as dependencies)
        let subgraph = graph.subgraph(&[id_c.clone()]).unwrap();

        assert_eq!(subgraph.nodes().len(), 3);
        assert!(subgraph.nodes().contains_key(&id_a));
        assert!(subgraph.nodes().contains_key(&id_b));
        assert!(subgraph.nodes().contains_key(&id_c));
    }
}
