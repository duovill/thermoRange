# About

Thermo Range Client is the web client using WebGL.

# 3D / WebGL / Three.js
https://threejs.org/docs/  

# Cool links
https://github.com/angular-ui  

Thermo Range Server uses Express as the backend and some components might use C++.


# The defaults

# thermo-range-ngivr dev
**http port:**  10300  
**redis db:** 19  
**mongodb:**  thermo-range-ngivr-dev  
**service:** thermo-range-ngivr-development.service

# thermo-range-ngivr master
**http port:**  10400  
**redis db:** 20  
**mongodb:**  thermo-range-ngivr  
**service:** thermo-range-ngivr-production.service



# PATHS
For now, only the following URL paths are allowed:
* /api/*
* /public/*
* /socket.io/*
* /data/

Any other will not work with the system.

# Minimum system install
* ArrayFire
* CMAKE
* OpenCV

# ArrayFire

## Mailing list  
https://groups.google.com/forum/#!forum/arrayfire-users  

## Install problem
http://arrayfire.org/docs/installing.htm  
  
Wrong:  
```bash
echo /opt/arrayfire/lib > /etc/ld.so.conf.d/arrayfire.conf
sudo ldconfig
```

Right:
```bash
echo /opt/arrayfire/lib64 > /etc/ld.so.conf.d/arrayfire.conf
sudo ldconfig
```

### Missing deps

```bash
apt install libxrandr2 libxinerama1 libxcursor1
```

### Install on AMD
```bash
# on polaris AMD GPU have to use legacy
#./amdgpu-pro-install --opencl=pal
./amdgpu-pro-install --opencl=legacy
```


## Genetic algorithm
  
http://arrayfire.org/docs/machine_learning_2geneticalgorithm_8cpp-example.htm  


# OpenCV 

Might need: https://github.com/opencv/opencv_contrib

## Build with cmake installation

https://www.cerebrumedge.com/single-post/2017/12/26/Compiling-OpenCV-with-CUDA-and-FFMpeg-on-Ubuntu-1604

OpenCV requires `python` `numpy`.

```bash
# with gtk 2.x
# OpenCV(4.0.1) /home/patrikx3/Downloads/opencv-4.0.1/modules/highgui/src/window.cpp:627: error: (-2:Unspecified error) The function is not implemented. Rebuild the library with Windows, GTK+ 2.x or Cocoa support. If you are on Ubuntu or Debian, install libgtk2.0-dev and pkg-config, then re-run cmake or configure script in function 'cvShowImage'
sudo apt install -y python-pip python3-pip cmake cmake-curses-gui libgtk2.0-dev pkg-config libjpeg-dev libtiff-dev libpng-dev libavcodec-dev libavformat-dev libswscale-dev libv4l-dev libxvidcore-dev libx264-dev libgtk-3-dev libatlas-base-dev gfortran unzip

pip install numpy
pip3 install numpy

wget https://github.com/opencv/opencv/archive/4.1.1.zip
unzip 4.1.1.zip
# download opencv
# create a different folder for building
cd opencv-4.1.1
mkdir build

# have to set use EXAMPLES!!!!
cmake -D CMAKE_BUILD_TYPE=RELEASE \
    -D WITH_FFMPEG=1 \
	-D CMAKE_INSTALL_PREFIX=/usr/local \
	-D INSTALL_PYTHON_EXAMPLES=ON \
	-D INSTALL_C_EXAMPLES=ON \
	-D OPENCV_ENABLE_NONFREE=ON \
//	-D OPENCV_EXTRA_MODULES_PATH=~/opencv_contrib/modules \
//	-D PYTHON_EXECUTABLE=~/.virtualenvs/cv/bin/python \
	-D BUILD_EXAMPLES=ON ../

make -j24 # ngerp

make -j16 # laptop
# 8 magon 4 perc kb, 3.2 GHZ-en
make -j8 # workstation

sudo make install
sudo ldconfig
```

Erdekes peldak:
```bash
example_cpp_dbt_face_detection
example_cpp_demhist
example_cpp_detect_blob
example_cpp_example
example_cpp_facedetect
example_cpp_letter_recog
example_cpp_lkdemo
example_cpp_morphology2
example_cpp_opencv_version
example_cpp_peopledetect
example_cpp_qrcode
example_cpp_smiledetect
example_cpp_travelsalesman
example_tapi_ufacedetect
```

Face recognition:

```bash
example_cpp_dbt_face_detection
example_cpp_facedetect
example_tapi_ufacedetect
```

## Via APT on Ubuntu
https://www.learnopencv.com/install-opencv-4-on-ubuntu-18-04/

https://www.google.com/search?q=opencv+face+recognition+webcam+stream&oq=opencv+face+recognition+webcam+stream+&aqs=chrome..69i57.7764j0j7&sourceid=chrome&ie=UTF-8

# Booost
`apt install libboost-all-dev`

