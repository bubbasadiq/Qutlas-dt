#include <emscripten/bind.h>
#include <BRepPrimAPI_MakeBox.hxx>
#include <BRepPrimAPI_MakeCylinder.hxx>
#include <BRepPrimAPI_MakeSphere.hxx>
#include <BRepPrimAPI_MakeCone.hxx>
#include <BRepPrimAPI_MakeTorus.hxx>
#include <BRepAlgoAPI_Fuse.hxx>
#include <BRepAlgoAPI_Cut.hxx>
#include <BRepAlgoAPI_Common.hxx>
#include <BRepMesh_IncrementalMesh.hxx>
#include <BRepBndLib.hxx>
#include <Bnd_Box.hxx>
#include <BRepFilletAPI_MakeFillet.hxx>
#include <BRepBuilderAPI_Transform.hxx>
#include <BRepBuilderAPI_MakeWire.hxx>
#include <BRepBuilderAPI_MakeEdge.hxx>
#include <BRepBuilderAPI_MakeFace.hxx>
#include <BRepOffsetAPI_MakeThickSolid.hxx>
#include <BRepOffsetAPI_MakeOffset.hxx>
#include <BRepPrimAPI_MakePrism.hxx>
#include <GC_MakeCircle.hxx>
#include <gp_Ax2.hxx>
#include <gp_Ax1.hxx>
#include <gp_Pnt.hxx>
#include <gp_Dir.hxx>
#include <gp_Vec.hxx>
#include <STEPControl_Writer.hxx>
#include <IGESControl_Writer.hxx>
#include <StlAPI_Writer.hxx>
#include <TopExp_Explorer.hxx>
#include <TopoDS.hxx>
#include <TopoDS_Face.hxx>
#include <TopAbs_ShapeEnum.hxx>
#include <TCollection_AsciiString.hxx>
#include <Poly_Triangulation.hxx>
#include <BRep_Tool.hxx>
#include <TopLoc_Location.hxx>
#include <vector>
#include <string>

using namespace emscripten;

// Geometry wrapper class for TypeScript integration
class GeometryWrapper {
public:
    TopoDS_Shape shape;
    
    GeometryWrapper() {}
    GeometryWrapper(const TopoDS_Shape& s) : shape(s) {}
    
    bool isNull() const {
        return shape.IsNull();
    }
};

// Forward declarations
GeometryWrapper createBox(double width, double height, double depth);
GeometryWrapper createCylinder(double radius, double height);
GeometryWrapper createSphere(double radius);
GeometryWrapper createCone(double radius, double height);
GeometryWrapper createTorus(double majorRadius, double minorRadius);
GeometryWrapper unionShapes(const GeometryWrapper& shape1, const GeometryWrapper& shape2);
GeometryWrapper cutShapes(const GeometryWrapper& shape1, const GeometryWrapper& shape2);
GeometryWrapper intersectShapes(const GeometryWrapper& shape1, const GeometryWrapper& shape2);
GeometryWrapper addHole(const GeometryWrapper& geometry, const emscripten::val& position, double diameter, double depth);
GeometryWrapper addFillet(const GeometryWrapper& geometry, int edgeIndex, double radius);
GeometryWrapper addChamfer(const GeometryWrapper& geometry, int edgeIndex, double distance);
GeometryWrapper extrude(const GeometryWrapper& profile, double distance);
GeometryWrapper revolve(const GeometryWrapper& profile, const emscripten::val& axis, double angle);
emscripten::val getMeshData(const GeometryWrapper& geometry);
emscripten::val getBoundingBox(const GeometryWrapper& geometry);
emscripten::val analyzeManufacturability(const GeometryWrapper& geometry);
bool exportToSTEP(const GeometryWrapper& geometry, const std::string& filename);
bool exportToIGES(const GeometryWrapper& geometry, const std::string& filename);
bool exportToSTL(const GeometryWrapper& geometry, const std::string& filename);

// Basic Shape Construction
GeometryWrapper createBox(double width, double height, double depth) {
    BRepPrimAPI_MakeBox makeBox(width, height, depth);
    makeBox.Build();
    if (!makeBox.IsDone()) {
        return GeometryWrapper();
    }
    return GeometryWrapper(makeBox.Shape());
}

GeometryWrapper createCylinder(double radius, double height) {
    BRepPrimAPI_MakeCylinder makeCylinder(radius, height);
    makeCylinder.Build();
    if (!makeCylinder.IsDone()) {
        return GeometryWrapper();
    }
    return GeometryWrapper(makeCylinder.Shape());
}

GeometryWrapper createSphere(double radius) {
    BRepPrimAPI_MakeSphere makeSphere(radius);
    makeSphere.Build();
    if (!makeSphere.IsDone()) {
        return GeometryWrapper();
    }
    return GeometryWrapper(makeSphere.Shape());
}

GeometryWrapper createCone(double radius, double height) {
    BRepPrimAPI_MakeCone makeCone(radius, 0.0, height);
    makeCone.Build();
    if (!makeCone.IsDone()) {
        return GeometryWrapper();
    }
    return GeometryWrapper(makeCone.Shape());
}

GeometryWrapper createTorus(double majorRadius, double minorRadius) {
    BRepPrimAPI_MakeTorus makeTorus(majorRadius, minorRadius);
    makeTorus.Build();
    if (!makeTorus.IsDone()) {
        return GeometryWrapper();
    }
    return GeometryWrapper(makeTorus.Shape());
}

// Boolean Operations
GeometryWrapper unionShapes(const GeometryWrapper& shape1, const GeometryWrapper& shape2) {
    if (shape1.isNull() || shape2.isNull()) {
        return GeometryWrapper();
    }
    
    BRepAlgoAPI_Fuse fusion(shape1.shape, shape2.shape);
    fusion.Build();
    if (!fusion.IsDone()) {
        return GeometryWrapper();
    }
    return GeometryWrapper(fusion.Shape());
}

GeometryWrapper cutShapes(const GeometryWrapper& shape1, const GeometryWrapper& shape2) {
    if (shape1.isNull() || shape2.isNull()) {
        return GeometryWrapper();
    }
    
    BRepAlgoAPI_Cut cut(shape1.shape, shape2.shape);
    cut.Build();
    if (!cut.IsDone()) {
        return GeometryWrapper();
    }
    return GeometryWrapper(cut.Shape());
}

GeometryWrapper intersectShapes(const GeometryWrapper& shape1, const GeometryWrapper& shape2) {
    if (shape1.isNull() || shape2.isNull()) {
        return GeometryWrapper();
    }
    
    BRepAlgoAPI_Common common(shape1.shape, shape2.shape);
    common.Build();
    if (!common.IsDone()) {
        return GeometryWrapper();
    }
    return GeometryWrapper(common.Shape());
}

// Feature Operations
GeometryWrapper addHole(const GeometryWrapper& geometry, const emscripten::val& position, double diameter, double depth) {
    if (geometry.isNull()) {
        return GeometryWrapper();
    }
    
    double x = position["x"].as<double>();
    double y = position["y"].as<double>();
    double z = position["z"].as<double>();
    
    gp_Pnt holeCenter(x, y, z);
    gp_Dir holeAxis(0, 0, 1);
    gp_Ax2 holeAxisSystem(holeCenter, holeAxis);
    
    BRepPrimAPI_MakeCylinder makeHole(diameter / 2.0, depth);
    makeHole.Build();
    if (!makeHole.IsDone()) {
        return GeometryWrapper();
    }
    
    BRepAlgoAPI_Cut cut(geometry.shape, makeHole.Shape());
    cut.Build();
    if (!cut.IsDone()) {
        return GeometryWrapper();
    }
    
    return GeometryWrapper(cut.Shape());
}

GeometryWrapper addFillet(const GeometryWrapper& geometry, int edgeIndex, double radius) {
    if (geometry.isNull()) {
        return GeometryWrapper();
    }
    
    BRepFilletAPI_MakeFillet fillet(geometry.shape);
    
    int currentEdgeIndex = 0;
    TopExp_Explorer explorer(geometry.shape, TopAbs_EDGE);
    
    while (explorer.More() && currentEdgeIndex <= edgeIndex) {
        if (currentEdgeIndex == edgeIndex) {
            const TopoDS_Edge& edge = TopoDS::Edge(explorer.Current());
            fillet.Add(radius, edge);
            break;
        }
        explorer.Next();
        currentEdgeIndex++;
    }
    
    fillet.Build();
    if (!fillet.IsDone()) {
        return GeometryWrapper();
    }
    
    return GeometryWrapper(fillet.Shape());
}

GeometryWrapper addChamfer(const GeometryWrapper& geometry, int edgeIndex, double distance) {
    if (geometry.isNull()) {
        return GeometryWrapper();
    }
    
    // Note: Simple chamfer implementation - in production would use BRepFilletAPI_MakeChamfer
    return addFillet(geometry, edgeIndex, distance * 0.5); // Approximate chamfer with reduced fillet
}

// Feature Operations (Advanced)
GeometryWrapper extrude(const GeometryWrapper& profile, double distance) {
    if (profile.isNull()) {
        return GeometryWrapper();
    }
    
    gp_Vec extrusionDirection(0, 0, distance);
    BRepPrimAPI_MakePrism prism(profile.shape, extrusionDirection);
    prism.Build();
    if (!prism.IsDone()) {
        return GeometryWrapper();
    }
    return GeometryWrapper(prism.Shape());
}

GeometryWrapper revolve(const GeometryWrapper& profile, const emscripten::val& axis, double angle) {
    // Simplified revolve implementation - in production would use proper revolution
    // For now, return a simple cylinder as placeholder
    if (profile.isNull()) {
        return GeometryWrapper();
    }
    
    // Create a simple cylinder as placeholder for revolve operation
    double radius = 25.0; // Default radius
    double height = 50.0; // Default height
    
    BRepPrimAPI_MakeCylinder makeCylinder(radius, height);
    makeCylinder.Build();
    if (!makeCylinder.IsDone()) {
        return GeometryWrapper();
    }
    return GeometryWrapper(makeCylinder.Shape());
}

// Mesh Generation
emscripten::val getMeshData(const GeometryWrapper& geometry) {
    emscripten::val result = emscripten::val::object();
    
    if (geometry.isNull()) {
        result.set("vertices", emscripten::val::array());
        result.set("indices", emscripten::val::array());
        result.set("normals", emscripten::val::array());
        return result;
    }
    
    // Generate mesh with reasonable deflection
    BRepMesh_IncrementalMesh mesh(geometry.shape, 0.01);
    mesh.Perform();
    
    std::vector<double> vertices;
    std::vector<int> indices;
    
    TopExp_Explorer faceExplorer(geometry.shape, TopAbs_FACE);
    int vertexOffset = 0;

    while (faceExplorer.More()) {
        TopoDS_Face face = TopoDS::Face(faceExplorer.Current());
        TopLoc_Location loc;
        Handle(Poly_Triangulation) tri = BRep_Tool::Triangulation(face, loc);

        if (!tri.IsNull()) {
            gp_Trsf tr = loc.Transformation();

            // Add vertices
            for (int i = 1; i <= tri->NbNodes(); i++) {
                gp_Pnt p = tri->Node(i);
                tr.Transforms(p.ChangeCoord());
                vertices.push_back(p.X());
                vertices.push_back(p.Y());
                vertices.push_back(p.Z());
            }

            // Add triangle indices
            for (int i = 1; i <= tri->NbTriangles(); i++) {
                const Poly_Triangle& triangle = tri->Triangle(i);
                int n1, n2, n3;
                triangle.Get(n1, n2, n3);
                indices.push_back(vertexOffset + n1 - 1); // Convert from 1-based to 0-based
                indices.push_back(vertexOffset + n2 - 1);
                indices.push_back(vertexOffset + n3 - 1);
            }

            vertexOffset += tri->NbNodes();
        }
        faceExplorer.Next();
    }
    
    // Convert vectors to JavaScript arrays
    emscripten::val resultVertices = emscripten::val::array();
    emscripten::val resultIndices = emscripten::val::array();
    
    for (size_t i = 0; i < vertices.size(); i++) {
        resultVertices.call<void>("push", vertices[i]);
    }
    
    for (size_t i = 0; i < indices.size(); i++) {
        resultIndices.call<void>("push", indices[i]);
    }
    
    result.set("vertices", resultVertices);
    result.set("indices", resultIndices);
    result.set("normals", emscripten::val::array()); // Normals would be computed on client side
    
    return result;
}

// Bounding Box Calculation
emscripten::val getBoundingBox(const GeometryWrapper& geometry) {
    emscripten::val bbox = emscripten::val::object();
    
    if (geometry.isNull()) {
        bbox.set("x", 0);
        bbox.set("y", 0);
        bbox.set("z", 0);
        bbox.set("width", 0);
        bbox.set("height", 0);
        bbox.set("depth", 0);
        return bbox;
    }
    
    Bnd_Box box;
    BRepBndLib::Add(geometry.shape, box);
    
    Standard_Real xMin, yMin, zMin, xMax, yMax, zMax;
    box.Get(xMin, yMin, zMin, xMax, yMax, zMax);
    
    bbox.set("x", xMin);
    bbox.set("y", yMin);
    bbox.set("z", zMin);
    bbox.set("width", xMax - xMin);
    bbox.set("height", yMax - yMin);
    bbox.set("depth", zMax - zMin);
    
    return bbox;
}

// DFM Analysis (Simplified)
emscripten::val analyzeManufacturability(const GeometryWrapper& geometry) {
    emscripten::val report = emscripten::val::object();
    emscripten::val warnings = emscripten::val::array();
    emscripten::val scores = emscripten::val::object();
    
    if (!geometry.isNull()) {
        // Simplified analysis - in production would implement proper DFM checks
        scores.set("machiningScore", 85.0);
        scores.set("moldingScore", 70.0);
        scores.set("printingScore", 90.0);
    } else {
        scores.set("machiningScore", 0.0);
        scores.set("moldingScore", 0.0);
        scores.set("printingScore", 0.0);
    }
    
    report.set("warnings", warnings);
    report.set("scores", scores);
    
    return report;
}

// Export Functions
bool exportToSTEP(const GeometryWrapper& geometry, const std::string& filename) {
    if (geometry.isNull()) {
        return false;
    }
    
    STEPControl_Writer writer;
    IFSelect_ReturnStatus status = writer.Transfer(geometry.shape, STEPControl_AsIs);
    if (status != IFSelect_RetDone) {
        return false;
    }
    
    return writer.Write(filename.c_str()) == IFSelect_RetDone;
}

bool exportToIGES(const GeometryWrapper& geometry, const std::string& filename) {
    if (geometry.isNull()) {
        return false;
    }
    
    IGESControl_Writer writer;
    writer.AddShape(geometry.shape);
    return writer.Write(filename.c_str());
}

bool exportToSTL(const GeometryWrapper& geometry, const std::string& filename) {
    if (geometry.isNull()) {
        return false;
    }
    
    StlAPI_Writer writer;
    return writer.Write(geometry.shape, filename.c_str());
}

// Emscripten bindings
EMSCRIPTEN_BINDINGS(occt_module) {
    class_<GeometryWrapper>("Geometry")
        .constructor<>()
        .constructor<const GeometryWrapper&>()
        .function("isNull", &GeometryWrapper::isNull);
    
    function("createBox", &createBox);
    function("createCylinder", &createCylinder);
    function("createSphere", &createSphere);
    function("createCone", &createCone);
    function("createTorus", &createTorus);
    function("unionShapes", &unionShapes);
    function("cutShapes", &cutShapes);
    function("intersectShapes", &intersectShapes);
    function("addHole", &addHole);
    function("addFillet", &addFillet);
    function("addChamfer", &addChamfer);
    function("extrude", &extrude);
    function("revolve", &revolve);
    function("getMeshData", &getMeshData);
    function("getBoundingBox", &getBoundingBox);
    function("analyzeManufacturability", &analyzeManufacturability);
    function("exportToSTEP", &exportToSTEP);
    function("exportToIGES", &exportToIGES);
    function("exportToSTL", &exportToSTL);
}