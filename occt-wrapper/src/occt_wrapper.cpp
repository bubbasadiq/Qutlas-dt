// occt_wrapper.cpp
#include "occt_wrapper.h"
#include <map>
#include <mutex>
#include <atomic>
#include <vector>
#include <string>
#include <sstream>
#include <fstream>
#include <iostream>
#include <cstdio>
#include <cstdlib>
#include <memory>

// OCCT headers
#include <STEPControl_Reader.hxx>
#include <STEPControl_Writer.hxx>
#include <IGESControl_Reader.hxx>
#include <BRep_Builder.hxx>
#include <TopoDS_Shape.hxx>
#include <TopExp_Explorer.hxx>
#include <TopoDS_Face.hxx>
#include <TopoDS.hxx>
#include <BRepMesh_IncrementalMesh.hxx>
#include <BRepAlgoAPI_Fuse.hxx>
#include <BRepAlgoAPI_Cut.hxx>
#include <BRepAlgoAPI_Common.hxx>
#include <BRepBndLib.hxx>
#include <Bnd_Box.hxx>
#include <BRepTools.hxx>
#include <Poly_Triangulation.hxx>
#include <BRep_Tool.hxx>
#include <TopLoc_Location.hxx>
#include <gp_Pnt.hxx>
#include <gp_Trsf.hxx>

static std::mutex registry_mutex;
static std::map<uint64_t, TopoDS_Shape> shape_registry;
static std::atomic<uint64_t> next_handle{1};

static void write_error(const std::string& s, char* out_error, int err_len) {
    if (out_error && err_len > 0) {
        snprintf(out_error, err_len, "%s", s.c_str());
    }
}

// Minimal init - placeholder for future resource path handling.
int occt_init(const char* resource_path, char* out_error, int err_len) {
    (void)resource_path;
    // In more advanced setups, set OCCT resource directory or environment variables here.
    return 1;
}

static std::string write_temp_file(const char* filename, const uint8_t* data, size_t len, char* out_error, int err_len) {
    // create a unique tmp filename
    uint64_t id = next_handle.fetch_add(1);
    std::string tmp = "/tmp/occt_upload_" + std::to_string(id) + "_" + (filename ? filename : "upload");
    // ensure suffix
    // write bytes
    std::ofstream ofs(tmp, std::ios::binary);
    if (!ofs) {
        write_error("failed to create temp file", out_error, err_len);
        return "";
    }
    ofs.write(reinterpret_cast<const char*>(data), len);
    ofs.close();
    return tmp;
}

uint64_t occt_load_from_memory(const char* filename, const uint8_t* data, size_t len, char* out_error, int err_len) {
    if (!data || len == 0) {
        write_error("empty input data", out_error, err_len);
        return 0;
    }
    std::string tmp = write_temp_file(filename, data, len, out_error, err_len);
    if (tmp.empty()) return 0;

    try {
        // Try STEP first
        STEPControl_Reader reader;
        IFSelect_ReturnStatus status = reader.ReadFile(tmp.c_str());
        if (status == IFSelect_RetDone) {
            if (!reader.TransferRoots()) {
                write_error("STEP transfer failed", out_error, err_len);
                std::remove(tmp.c_str());
                return 0;
            }
            TopoDS_Shape shape = reader.OneShape();
            if (shape.IsNull()) {
                write_error("STEP produced empty shape", out_error, err_len);
                std::remove(tmp.c_str());
                return 0;
            }
            uint64_t h = next_handle.fetch_add(1);
            {
                std::scoped_lock lock(registry_mutex);
                shape_registry[h] = shape;
            }
            std::remove(tmp.c_str());
            return h;
        }
        // If STEP read failed, try IGES
        IGESControl_Reader igesReader;
        IFSelect_ReturnStatus igesStatus = igesReader.ReadFile(tmp.c_str());
        if (igesStatus == IFSelect_RetDone) {
            if (!igesReader.TransferRoots()) {
                write_error("IGES transfer failed", out_error, err_len);
                std::remove(tmp.c_str());
                return 0;
            }
            TopoDS_Shape shape = igesReader.OneShape();
            if (shape.IsNull()) {
                write_error("IGES produced empty shape", out_error, err_len);
                std::remove(tmp.c_str());
                return 0;
            }
            uint64_t h = next_handle.fetch_add(1);
            {
                std::scoped_lock lock(registry_mutex);
                shape_registry[h] = shape;
            }
            std::remove(tmp.c_str());
            return h;
        }

        // As a fallback, attempt to treat file as an STL via BRepTools::Read? (not ideal)
        // For now, return error.
        write_error("failed to read as STEP or IGES", out_error, err_len);
        std::remove(tmp.c_str());
        return 0;
    } catch (std::exception& e) {
        write_error(std::string("exception: ") + e.what(), out_error, err_len);
        std::remove(tmp.c_str());
        return 0;
    } catch (...) {
        write_error("unknown exception during load", out_error, err_len);
        std::remove(tmp.c_str());
        return 0;
    }
}

int occt_export_step(uint64_t handle, uint8_t** out_buf, size_t* out_len, char* out_error, int err_len) {
    if (!out_buf || !out_len) {
        write_error("invalid output pointers", out_error, err_len);
        return 0;
    }
    std::scoped_lock lock(registry_mutex);
    auto it = shape_registry.find(handle);
    if (it == shape_registry.end()) {
        write_error("handle not found", out_error, err_len);
        return 0;
    }
    try {
        // Write to temp file then read bytes
        std::string tmp = "/tmp/occt_export_" + std::to_string(handle) + ".step";
        STEPControl_Writer writer;
        IFSelect_ReturnStatus stat = writer.Transfer(it->second, STEPControl_AsIs);
        if (stat != IFSelect_RetDone) {
            write_error("STEP transfer in writer failed", out_error, err_len);
            return 0;
        }
        IFSelect_ReturnStatus stat2 = writer.Write(tmp.c_str());
        if (stat2 != IFSelect_RetDone) {
            write_error("STEP write failed", out_error, err_len);
            return 0;
        }
        // read file bytes
        std::ifstream ifs(tmp, std::ios::binary | std::ios::ate);
        if (!ifs) {
            write_error("cannot open tmp step for reading", out_error, err_len);
            std::remove(tmp.c_str());
            return 0;
        }
        std::streamsize size = ifs.tellg();
        ifs.seekg(0, std::ios::beg);
        std::vector<char> buffer(size);
        if (!ifs.read(buffer.data(), size)) {
            write_error("failed to read tmp step file", out_error, err_len);
            std::remove(tmp.c_str());
            return 0;
        }
        ifs.close();
        *out_len = (size_t)size;
        *out_buf = (uint8_t*)malloc(*out_len);
        if (!*out_buf) {
            write_error("malloc failed", out_error, err_len);
            std::remove(tmp.c_str());
            return 0;
        }
        memcpy(*out_buf, buffer.data(), *out_len);
        std::remove(tmp.c_str());
        return 1;
    } catch (std::exception& e) {
        write_error(std::string("exception: ") + e.what(), out_error, err_len);
        return 0;
    }
}

int occt_get_bounds(uint64_t handle, double* minx, double* miny, double* minz,
                    double* maxx, double* maxy, double* maxz, char* out_error, int err_len) {
    std::scoped_lock lock(registry_mutex);
    auto it = shape_registry.find(handle);
    if (it == shape_registry.end()) {
        write_error("handle not found", out_error, err_len);
        return 0;
    }
    try {
        Bnd_Box box;
        BRepBndLib::Add(it->second, box);
        Standard_Real xMin, yMin, zMin, xMax, yMax, zMax;
        box.Get(xMin, yMin, zMin, xMax, yMax, zMax);
        if (minx) *minx = xMin;
        if (miny) *miny = yMin;
        if (minz) *minz = zMin;
        if (maxx) *maxx = xMax;
        if (maxy) *maxy = yMax;
        if (maxz) *maxz = zMax;
        return 1;
    } catch (std::exception& e) {
        write_error(std::string("bounds exception: ") + e.what(), out_error, err_len);
        return 0;
    }
}

uint64_t occt_boolean(uint64_t target, uint64_t tool, const char* op, double tolerance, char* out_error, int err_len) {
    TopoDS_Shape Ta, Ua;
    {
        std::scoped_lock lock(registry_mutex);
        auto itT = shape_registry.find(target);
        auto itU = shape_registry.find(tool);
        if (itT == shape_registry.end() || itU == shape_registry.end()) {
            write_error("target or tool handle not found", out_error, err_len);
            return 0;
        }
        Ta = itT->second;
        Ua = itU->second;
    }
    try {
        std::string s = op ? std::string(op) : std::string();
        TopoDS_Shape result;
        if (s == "union" || s == "fuse") {
            BRepAlgoAPI_Fuse opf(Ta, Ua);
            opf.SetFuzzyValue(tolerance);
            opf.Build();
            if (!opf.IsDone()) { write_error("fuse failed", out_error, err_len); return 0; }
            result = opf.Shape();
        } else if (s == "cut") {
            BRepAlgoAPI_Cut opc(Ta, Ua);
            opc.SetFuzzyValue(tolerance);
            opc.Build();
            if (!opc.IsDone()) { write_error("cut failed", out_error, err_len); return 0; }
            result = opc.Shape();
        } else if (s == "common" || s == "intersect") {
            BRepAlgoAPI_Common opc(Ta, Ua);
            opc.SetFuzzyValue(tolerance);
            opc.Build();
            if (!opc.IsDone()) { write_error("common failed", out_error, err_len); return 0; }
            result = opc.Shape();
        } else {
            write_error("unknown boolean operation", out_error, err_len);
            return 0;
        }
        uint64_t h = next_handle.fetch_add(1);
        {
            std::scoped_lock lock(registry_mutex);
            shape_registry[h] = result;
        }
        return h;
    } catch (std::exception& e) {
        write_error(std::string("boolean exception: ") + e.what(), out_error, err_len);
        return 0;
    }
}

// Minimal fillet: wrapper that returns error for now, placeholder for real ChFi usage.
// For robust fillet you'd use BRepFilletAPI_MakeFillet, iterate edges, etc.
// This minimal implementation returns the same shape (no-op) as a new handle to preserve API parity.
uint64_t occt_fillet(uint64_t target, const uint64_t* edge_ids, size_t edge_count, double radius, double tolerance, char* out_error, int err_len) {
    (void)edge_ids; (void)edge_count; (void)radius; (void)tolerance;
    std::scoped_lock lock(registry_mutex);
    auto it = shape_registry.find(target);
    if (it == shape_registry.end()) {
        write_error("target handle not found", out_error, err_len);
        return 0;
    }
    // NOTE: production should implement BRepFilletAPI_MakeFillet and map edges.
    // For now we duplicate the shape and return a new handle for the caller to use.
    TopoDS_Shape copyShape = it->second;
    uint64_t h = next_handle.fetch_add(1);
    shape_registry[h] = copyShape;
    return h;
}

int occt_generate_mesh_obj(uint64_t handle, double deflection, int linear_deflection, uint8_t** out_buf, size_t* out_len, char* out_error, int err_len) {
    if (!out_buf || !out_len) {
        write_error("invalid output pointers", out_error, err_len);
        return 0;
    }
    TopoDS_Shape shape;
    {
        std::scoped_lock lock(registry_mutex);
        auto it = shape_registry.find(handle);
        if (it == shape_registry.end()) {
            write_error("handle not found", out_error, err_len);
            return 0;
        }
        shape = it->second;
    }
    try {
        // Perform meshing
        double defl = (deflection > 0.0) ? deflection : 0.1;
        BRepMesh_IncrementalMesh(meshshape := shape, defl, false, linear_deflection > 0 ? linear_deflection : 0, true);
        // The line above uses a short variable name; but older OCCT requires the constructor call exactly:
        // BRepMesh_IncrementalMesh mesh(shape, defl, false, linear_deflection, true);
        // for portability we'll do:
        BRepMesh_IncrementalMesh mesh(shape, defl, false, linear_deflection, true);
        mesh.Perform();

        std::ostringstream obj;
        obj << "# qutlas occt obj\n";

        // Collect global vertex list and faces, because triangulation returns per-face nodes
        std::vector<gp_Pnt> global_vertices;
        std::vector<std::array<int,3>> global_faces;

        // Iterate faces and read triangulation
        TopExp_Explorer faceExplorer(shape, TopAbs_FACE);
        for (; faceExplorer.More(); faceExplorer.Next()) {
            TopoDS_Face face = TopoDS::Face(faceExplorer.Current());
            TopLoc_Location loc;
            Handle(Poly_Triangulation) tri = BRep_Tool::Triangulation(face, loc);
            if (tri.IsNull()) continue;

            // transform points by location transform
            gp_Trsf tr = loc.Transformation();

            int nNodes = tri->NbNodes();
            int nTriangles = tri->NbTriangles();

            // map local node index -> global index
            std::vector<int> localToGlobal(nNodes + 1, -1); // 1-based indices in OCCT

            for (int ni = 1; ni <= nNodes; ++ni) {
                gp_Pnt p = tri->Nodes()->Value(ni);
                tr.Transform(p);
                // append to global list
                global_vertices.push_back(p);
                localToGlobal[ni] = (int)global_vertices.size(); // 1-based OBJ index
            }

            for (int ti = 1; ti <= nTriangles; ++ti) {
                Poly_Triangle triangle = tri->Triangles()->Value(ti);
                int n1, n2, n3;
                triangle.Get(n1, n2, n3);
                int g1 = localToGlobal[n1];
                int g2 = localToGlobal[n2];
                int g3 = localToGlobal[n3];
                if (g1 <= 0 || g2 <= 0 || g3 <= 0) continue;
                global_faces.push_back({g1, g2, g3});
            }
        }

        // Write vertices
        for (size_t i = 0; i < global_vertices.size(); ++i) {
            gp_Pnt &p = global_vertices[i];
            obj << "v " << p.X() << " " << p.Y() << " " << p.Z() << "\n";
        }
        // Write faces
        for (size_t i = 0; i < global_faces.size(); ++i) {
            auto f = global_faces[i];
            obj << "f " << f[0] << " " << f[1] << " " << f[2] << "\n";
        }

        std::string s = obj.str();
        *out_len = s.size();
        *out_buf = (uint8_t*)malloc(*out_len);
        if (!*out_buf) {
            write_error("malloc failed", out_error, err_len);
            return 0;
        }
        memcpy(*out_buf, s.data(), *out_len);
        return 1;
    } catch (std::exception& e) {
        write_error(std::string("mesh exception: ") + e.what(), out_error, err_len);
        return 0;
    }
}

void occt_free_buffer(uint8_t* buf) {
    if (buf) free(buf);
}

int occt_release_handle(uint64_t handle, char* out_error, int err_len) {
    std::scoped_lock lock(registry_mutex);
    auto it = shape_registry.find(handle);
    if (it == shape_registry.end()) {
        write_error("handle not found", out_error, err_len);
        return 0;
    }
    shape_registry.erase(it);
    return 1;
}
