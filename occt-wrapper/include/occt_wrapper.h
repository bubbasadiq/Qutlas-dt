#pragma once
#include <stdint.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

// Initialize OCCT (path optional). Returns 1 on success, 0 on failure.
int occt_init(const char* resource_path, char* out_error, int err_len);

// Load STEP/IGES/STL data from memory. Returns handle (>0) or 0 on error.
uint64_t occt_load_from_memory(const char* filename, const uint8_t* data, size_t len, char* out_error, int err_len);

// Export shape to STEP bytes (caller must free with occt_free_buffer).
// Returns 1 on success, 0 on failure.
int occt_export_step(uint64_t handle, uint8_t** out_buf, size_t* out_len, char* out_error, int err_len);

// Compute bounding box. Returns 1 on success, 0 on failure.
int occt_get_bounds(uint64_t handle,
                    double* minx, double* miny, double* minz,
                    double* maxx, double* maxy, double* maxz,
                    char* out_error, int err_len);

// Boolean operation: op = "union" | "cut" | "common". Returns new handle (>0) or 0 on error.
uint64_t occt_boolean(uint64_t target, uint64_t tool, const char* op, double tolerance, char* out_error, int err_len);

// Fillet operation (edge IDs not supported in this minimal impl; pass NULL/0 to auto). Returns new handle (>0) or 0 on error.
uint64_t occt_fillet(uint64_t target, const uint64_t* edge_ids, size_t edge_count, double radius, double tolerance, char* out_error, int err_len);

// Generate mesh (triangulate) and return OBJ bytes. Caller frees with occt_free_buffer.
// Returns 1 on success, 0 on failure.
int occt_generate_mesh_obj(uint64_t handle, double deflection, int linear_deflection, uint8_t** out_buf, size_t* out_len, char* out_error, int err_len);

// Free buffer returned by functions
void occt_free_buffer(uint8_t* buf);

// Release shape handle
int occt_release_handle(uint64_t handle, char* out_error, int err_len);

#ifdef __cplusplus
}
#endif
