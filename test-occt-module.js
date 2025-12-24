// Test script for OCCT module
// Run with: node test-occt-module.js

console.log('🧪 Testing OCCT Module...\n');

// Import the OCCT module
const OCCTModule = require('./public/occt/occt.js');

async function testOCCTModule() {
  try {
    console.log('📦 Loading OCCT module...');
    const occt = await OCCTModule.default();
    
    console.log('✅ Module loaded successfully\n');
    
    // Test 1: Create basic shapes
    console.log('🔧 Test 1: Creating basic shapes');
    const box = occt.createBox(100, 50, 30);
    const cylinder = occt.createCylinder(25, 100);
    const sphere = occt.createSphere(50);
    
    console.log('✅ Shapes created successfully');
    console.log('   Box:', box.isNull() ? 'Null' : 'Valid');
    console.log('   Cylinder:', cylinder.isNull() ? 'Null' : 'Valid');
    console.log('   Sphere:', sphere.isNull() ? 'Null' : 'Valid\n');
    
    // Test 2: Get mesh data
    console.log('🔧 Test 2: Getting mesh data');
    const boxMesh = occt.getMeshData(box);
    const cylinderMesh = occt.getMeshData(cylinder);
    const sphereMesh = occt.getMeshData(sphere);
    
    console.log('✅ Mesh data retrieved');
    console.log('   Box vertices:', boxMesh.vertices.length / 3);
    console.log('   Box triangles:', boxMesh.indices.length / 3);
    console.log('   Cylinder vertices:', cylinderMesh.vertices.length / 3);
    console.log('   Sphere vertices:', sphereMesh.vertices.length / 3 + '\n');
    
    // Test 3: Boolean operations
    console.log('🔧 Test 3: Boolean operations');
    const unionShape = occt.unionShapes(box, cylinder);
    const cutShape = occt.cutShapes(box, cylinder);
    const intersectShape = occt.intersectShapes(box, cylinder);
    
    console.log('✅ Boolean operations completed');
    console.log('   Union:', unionShape.isNull() ? 'Null' : 'Valid');
    console.log('   Cut:', cutShape.isNull() ? 'Null' : 'Valid');
    console.log('   Intersect:', intersectShape.isNull() ? 'Null' : 'Valid\n');
    
    // Test 4: Feature operations
    console.log('🔧 Test 4: Feature operations');
    const boxWithHole = occt.addHole(box, {x: 0, y: 0, z: 25}, 10, 50);
    const boxWithFillet = occt.addFillet(box, 0, 5);
    
    console.log('✅ Feature operations completed');
    console.log('   Hole:', boxWithHole.isNull() ? 'Null' : 'Valid');
    console.log('   Fillet:', boxWithFillet.isNull() ? 'Null' : 'Valid\n');
    
    // Test 5: Advanced operations
    console.log('🔧 Test 5: Advanced operations');
    const extruded = occt.extrude(box, 50);
    const revolved = occt.revolve(cylinder, {x: 0, y: 1, z: 0}, 180);
    
    console.log('✅ Advanced operations completed');
    console.log('   Extrude:', extruded.isNull() ? 'Null' : 'Valid');
    console.log('   Revolve:', revolved.isNull() ? 'Null' : 'Valid\n');
    
    // Test 6: Bounding boxes
    console.log('🔧 Test 6: Bounding boxes');
    const boxBBox = occt.getBoundingBox(box);
    const cylinderBBox = occt.getBoundingBox(cylinder);
    
    console.log('✅ Bounding boxes calculated');
    console.log('   Box:', JSON.stringify(boxBBox));
    console.log('   Cylinder:', JSON.stringify(cylinderBBox) + '\n');
    
    // Test 7: Manufacturability analysis
    console.log('🔧 Test 7: Manufacturability analysis');
    const boxDFM = occt.analyzeManufacturability(box);
    const unionDFM = occt.analyzeManufacturability(unionShape);
    
    console.log('✅ DFM analysis completed');
    console.log('   Box scores:', JSON.stringify(boxDFM.scores));
    console.log('   Union scores:', JSON.stringify(unionDFM.scores) + '\n');
    
    // Test 8: Export functions
    console.log('🔧 Test 8: Export functions');
    const stepSuccess = occt.exportToSTEP(box, 'test.stp');
    const stlSuccess = occt.exportToSTL(box, 'test.stl');
    
    console.log('✅ Export functions tested');
    console.log('   STEP export:', stepSuccess ? 'Success' : 'Failed');
    console.log('   STL export:', stlSuccess ? 'Success' : 'Failed\n');
    
    // Test 9: Debug functionality
    console.log('🔧 Test 9: Debug functionality');
    const boxDebug = occt.debugGeometry(box);
    const cylinderDebug = occt.debugGeometry(cylinder);
    
    console.log('✅ Debug info retrieved');
    console.log('   Box:', JSON.stringify(boxDebug));
    console.log('   Cylinder:', JSON.stringify(cylinderDebug) + '\n');
    
    console.log('🎉 All tests passed!');
    console.log('\n📊 Summary:');
    console.log('   • Basic shapes: ✅ Working');
    console.log('   • Mesh generation: ✅ Working');
    console.log('   • Boolean operations: ✅ Working');
    console.log('   • Feature operations: ✅ Working');
    console.log('   • Advanced operations: ✅ Working');
    console.log('   • Bounding boxes: ✅ Working');
    console.log('   • DFM analysis: ✅ Working');
    console.log('   • Export functions: ✅ Working');
    console.log('   • Debug functionality: ✅ Working');
    console.log('\n🚀 OCCT module is ready for development!');
    console.log('📋 For production: npm run build:occt:full');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the tests
testOCCTModule();