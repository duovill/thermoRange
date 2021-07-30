# cmake needs this line
cmake_minimum_required(VERSION 3.1)

# Enable C++11
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED TRUE)


project (thermo C CXX)

#find_package(ArrayFire)

find_package(OpenCV REQUIRED)

message(STATUS "OpenCV library status:")
message(STATUS "    config: ${OpenCV_DIR}")
message(STATUS "    version: ${OpenCV_VERSION}")
message(STATUS "    libraries: ${OpenCV_LIBS}")
message(STATUS "    include path: ${OpenCV_INCLUDE_DIRS}")


include_directories(${CMAKE_JS_INC})

file(GLOB SOURCE_FILES "native/thermo.cc" "native/pi-worker.cc"  "native/opencv-qrcode-worker.cc" )
add_library(${PROJECT_NAME} SHARED ${SOURCE_FILES} )
set_target_properties(${PROJECT_NAME} PROPERTIES PREFIX "" SUFFIX ".node")
target_link_libraries(${PROJECT_NAME} ${CMAKE_JS_LIB} ${OpenCV_LIBS})
target_include_directories(${PROJECT_NAME} PRIVATE "${CMAKE_SOURCE_DIR}/node_modules/node-addon-api")

message(STATUS "Is NGIVR_BUILD_CPU: $ENV{NGIVR_BULD_CPU}")

#IF(DEFINED ENV{NGIVR_BULD_CPU})
#    target_link_libraries(trs ArrayFire::afcpu)
#ELSE()
#    target_link_libraries(trs ArrayFire::afopencl)
#ENDIF()

#add_executable (test-math src/native/arrayfire/Math.cpp src/native/test/test-math.cpp)
#add_executable (test-generatic src/native/test/generetic-algorithm.cpp)
#add_executable (test-utf8 src/native/test/test-utf8.cpp)

#add_executable (test-opencv src/native/test/test-opencv.cpp)
#target_link_libraries(test-opencv ${OpenCV_LIBS})

#add_executable (test-opencv2 src/native/test/test-opencv2.cpp)
#target_link_libraries(test-opencv2 ${OpenCV_LIBS})

#IF(DEFINED ENV{NGIVR_BULD_CPU})
#    target_link_libraries(test-math ArrayFire::afcpu)
#ELSE()
#    target_link_libraries(test-math ArrayFire::afopencl)
#ENDIF()

#add_subdirectory(src/native/nan)
