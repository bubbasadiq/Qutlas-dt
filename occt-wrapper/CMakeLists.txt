cmake_minimum_required(VERSION 3.10)
project(occt_wrapper LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)

# You may need to point CMAKE_PREFIX_PATH to your OCCT install if not system-installed.
# e.g. -DCMAKE_PREFIX_PATH=/opt/opencascade
find_package(OpenCASCADE REQUIRED)

include_directories(${CMAKE_CURRENT_SOURCE_DIR}/include)
include_directories(${OpenCASCADE_INCLUDE_DIR})

set(SRC
    src/occt_wrapper.cpp
)

add_library(occt_wrapper SHARED ${SRC})
target_include_directories(occt_wrapper PRIVATE ${OpenCASCADE_INCLUDE_DIR})
target_link_libraries(occt_wrapper PRIVATE ${OpenCASCADE_LIBRARIES})

# set soname and output directory
set_target_properties(occt_wrapper PROPERTIES PUBLIC_HEADER "include/occt_wrapper.h" OUTPUT_NAME "occt_wrapper")
install(TARGETS occt_wrapper DESTINATION lib)
install(FILES include/occt_wrapper.h DESTINATION include)
