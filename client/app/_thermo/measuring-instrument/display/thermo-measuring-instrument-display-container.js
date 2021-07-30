ngivr.angular.directive('thermoMeasuringInstrumentDisplayContainer', function() {

    return {
        templateUrl: 'app/_thermo/measuring-instrument/display/thermo-measuring-instrument-display-container.html',

        controller: function ($scope, $state, $stateParams, ngivrService, thermoWebgl, $sce, ngivrException, $http, socket) {

            const equipmentId = $stateParams.id
            $scope.equipment = undefined
            $scope.equipmentId = equipmentId
            $scope.equipmentMacId = $stateParams.macId
            $scope.batchId = undefined

            const currentlyMeasuring = () => {
                ngivr.growl('Jelenleg éppen pontfelhő  mérés történik.')
            }
            const initMeasure = async() => {
                try {
                    const response = await $http.get(`/api/thermo/measure/point-cloud/check/${$scope.equipmentMacId}`)
                    //console.warn(response)
                    if (response.data.result !== null) {
                        $scope.pointcloudMeasureDisabled = true
                        currentlyMeasuring()
                    }
                } catch(e) {
                    ngivrException.handler(e)
                }
            }
            initMeasure();

            const thermoNgivrMeasure = {
                start: (data) => {
                    if (data.macId === $scope.equipmentMacId) {
                        ngivr.growl('Mérés pontfelhő indul...')
                        $scope.pointcloudMeasureDisabled = true
                        $scope.$digest()
                    }
                },
                complete: (data) => {
                    if (data.macId === $scope.equipmentMacId) {
                        ngivr.growl('Mérés pontfelhő kész...')
                        $scope.pointcloudMeasureDisabled = false
                        $scope.$digest()
                    }
                },
                error: (data) => {
                    if (data.macId === $scope.equipmentMacId) {
                        ngivr.growl('Mérés pontfelhő hiba volt...')
                        $scope.pointcloudMeasureDisabled = false
                        ngivrException.handler(data.error)
                        $scope.$digest()
                    }
                }
            }

            $scope.pointcloudMeasureDisabled = false

            socket.ioClient.on('thermo-ngivr-measure-complete', thermoNgivrMeasure.complete)
            socket.ioClient.on('thermo-ngivr-measure-start', thermoNgivrMeasure.start)
            socket.ioClient.on('thermo-ngivr-measure-error', thermoNgivrMeasure.error)

            $scope.$on('$destroy', () => {
                socket.ioClient.removeListener('thermo-ngivr-measure-complete', thermoNgivrMeasure.complete)
                socket.ioClient.removeListener('thermo-ngivr-measure-start', thermoNgivrMeasure.start)
                socket.ioClient.removeListener('thermo-ngivr-measure-error', thermoNgivrMeasure.error)
            })

            let pointCloudData
            $scope.pointcloudMeasure = async() => {
                try {
//                    this.remove.pointCloud()
                    const response = await $http.get(`/api/thermo/measure/point-cloud/${$scope.equipmentMacId}`)
                    if (response.data.info === 'measuring') {
                        currentlyMeasuring()
                    }
//                    pointCloudData = pointcloudMeasureResponse.data.pointClouds
//                    this.set.pointCloud()
                } catch(e) {
                    ngivrException.handler(e)
                }
            }

            const currentlyMeasuringThermal = () => {
                ngivr.growl('Jelenleg éppen hőkamera mérés történik.')
            }
            const initMeasureThermal = async() => {
                try {
                    const response = await $http.get(`/api/thermo/measure/thermal/check/${$scope.equipmentMacId}`)
                    //console.warn(response)
                    if (response.data.result !== null) {
                        $scope.thermalCameraMeasureDisabled = true
                        currentlyMeasuringThermal()
                    }
                } catch(e) {
                    ngivrException.handler(e)
                }
            }
            initMeasureThermal();

            const thermoNgivrMeasureThermal = {
                start: (data) => {
                    if (data.macId === $scope.equipmentMacId) {
                        ngivr.growl('Mérés hőkamera indul...')
                        $scope.thermalCameraMeasureDisabled = true
                        $scope.$digest()
                    }
                },
                complete: (data) => {
                    if (data.macId === $scope.equipmentMacId) {
                        ngivr.growl('Mérés hőkamera kész...')
                        $scope.thermalCameraMeasureDisabled = false
                        $scope.$digest()
                    }
                },
                error: (data) => {
                    if (data.macId === $scope.equipmentMacId) {
                        ngivr.growl('Mérés hőkamera hiba volt...')
                        $scope.thermalCameraMeasureDisabled = false
                        ngivrException.handler(data.error)
                        $scope.$digest()
                    }
                }
            }

            $scope.thermalCameraMeasureDisabled = false

            socket.ioClient.on('thermo-ngivr-measure-thermal-complete', thermoNgivrMeasureThermal.complete)
            socket.ioClient.on('thermo-ngivr-measure-thermal-start', thermoNgivrMeasureThermal.start)
            socket.ioClient.on('thermo-ngivr-measure-thermal-error', thermoNgivrMeasureThermal.error)

            $scope.$on('$destroy', () => {
                socket.ioClient.removeListener('thermo-ngivr-measure-thermal-complete', thermoNgivrMeasureThermal.complete)
                socket.ioClient.removeListener('thermo-ngivr-measure-thermal-start', thermoNgivrMeasureThermal.start)
                socket.ioClient.removeListener('thermo-ngivr-measure-thermal-error', thermoNgivrMeasureThermal.error)
            })

            $scope.thermalCameraMeasure = async() => {
                try {
//                    this.remove.pointCloud()
                    const response = await $http.get(`/api/thermo/measure/thermal/${$scope.equipmentMacId}`)
                    if (response.data.info === 'measuring') {
                        currentlyMeasuringThermal()
                    }
//                    pointCloudData = pointcloudMeasureResponse.data.pointClouds
//                    this.set.pointCloud()
                } catch(e) {
                    ngivrException.handler(e)
                }
            }


            // console.warn('$stateParams', $stateParams)

            let $container;
            let webglInit, camera, scene, renderer, orbitControls, pointCloudGeometry;
            const webglId = 'thermo-measuring-instrument-display-3d'
            const canvasId = 'thermo-measuring-instrument-display-3d-canvas'

            let currentBatchVideoId
            $scope.setVideo = function (opts) {
                if (opts.doc._id === currentBatchVideoId) {
                    currentBatchVideoId = undefined;
                    $scope.videoConfig.sources = []
                    return
                }
                currentBatchVideoId = opts.doc._id;
                const batchIdUrl = `/api/thermo/batch-video/${opts.doc._id}`;
                //console.warn('setVideo', opts, batchIdUrl)
                $scope.videoConfig.sources = [
                    {src: $sce.trustAsResourceUrl(batchIdUrl), type: "video/mp4"},
                ]
            }

            ngivrService.data.id({
                schema: 'measuringInstrument',
                id: equipmentId,
                $scope: $scope,
                subscribe: async (promise) => {
                    try {
                        const response = await promise;
                        $scope.equipment = response.data.doc
                    } catch(e) {
                        ngivr.exception.handler(e)
                    }
                }
            })

            // GLOBAL
            this.loadWebGl = () => {
                console.log('thermo display after post link')
                $container = $('#' + webglId)
                webglInit = thermoWebgl.initWebgl({
                    $container: $container,
                    bg: '#000000',
                    contextMenuEnabled: true,
                })

                camera = webglInit.camera
                scene = webglInit.scene
                renderer = webglInit.renderer


                const webglInitResult = webglInit.init({
                    noSetSize: false,
                    id: canvasId,
                });

                orbitControls = new THREE.OrbitControls( camera, renderer.domElement );

                for(let key of Object.keys(this.set)) {
                    this.set[key]();
                }

                this.reset();
                this.animate()
            }

            setTimeout(() => {
                this.loadWebGl()
            }, 500)

            $scope.$on('$destory', () => {
                this.animateRender = false;
                if (webglInit) {
                    webglInit.destroy()
                }
            })

            $scope.$on('thermo-load-point-clouds', async(event, data) => {
                try {
                    this.remove.pointCloud()
                    const response = await $http.get(`/data/thermoRangeBatchPointCloud/id/${data}`)
                    //console.warn(event, data, response)
                    pointCloudData = response.data.doc.cloudPoints
                    this.set.pointCloud()
                } catch(e) {
                    ngivrException.handler(e)
                }
            })

            // WEBGL / 3D

            this.objects = {
                pointCloud: undefined,
                plane: undefined,
                axes: undefined,
            }

            this.reset = () => {

                if (orbitControls !== undefined) {
                    orbitControls.dispose()
                }
                camera.position.x = 100;
                camera.position.y = 100;
                camera.position.z = 100;

                camera.zoom = 1
                camera.updateProjectionMatrix()

                camera.lookAt(scene.position);

                orbitControls = new THREE.OrbitControls( camera, renderer.domElement );
                this.remove.pointCloud()

            }

            this.remove = {
                axes: () => {
                    if (this.objects.axes !== undefined) {
                        scene.remove(this.objects.axes)
                        this.objects.axes = undefined
                    }
                },
                plane: () => {
                    if (this.objects.plane !== undefined) {
                        scene.remove(this.objects.plane)
                        this.objects.plane = undefined
                    }
                },
                pointCloud: () => {
                    if (this.objects.pointCloud !== undefined) {
                        scene.remove(this.objects.pointCloud)
                        this.objects.pointCloud = undefined
                    }
                },
            }

            let zMoving = 200
            let yMoving = 200

            const points = 100000

            $scope.points = points

            this.calculatePointCloud = () => {


                pointCloudGeometry.vertices = []

                for(let point of pointCloudData) {
                    const vector = new THREE.Vector3();
                    vector.x = point[0]
                    vector.y = point[1]
                    vector.z = point[2]
                    pointCloudGeometry.vertices.push( vector );
                }
                /*
                pointCloudGeometry.vertices = []
                const sectionCount = 1000
                const sections = points / sectionCount

                let zStep = 10
                let yStep = 10
                let z = 0 - ((sections / 2) * zStep)
                for (let sectionsIndex = 0; sectionsIndex < sections; sectionsIndex++) {
                    let x = -500

                    for ( let i = 0; i < sectionCount; i ++ ) {
                        const star = new THREE.Vector3();
                        //star.x = THREE.Math.randFloatSpread( 500 );
                        //star.z = THREE.Math.randFloatSpread( 500 );
                        //star.y = THREE.Math.randFloat( 0, 480 );

                        star.x = (
                            Math.cos((x + z + (sectionsIndex * yStep)) )
                        ) * yMoving
                        star.z = Math.cos((z + (sectionsIndex * zStep)) )
                            * zMoving
                        star.y = Math.sin((x + (sectionsIndex * yStep)) )
                            * yMoving

                        x++
                        pointCloudGeometry.vertices.push( star );
                    }

                    z = z + zStep
                }
                 */
            }

            this.set = {
                pointCloud: () => {

                    if (this.objects.pointCloud !== undefined) {
                        return this.remove.pointCloud()
                    }

                    if (pointCloudData === undefined) {
                        return
                    }

                    pointCloudGeometry = new THREE.Geometry();

                    this.calculatePointCloud()


                    const pointCloudMaterial = new THREE.PointsMaterial( {
                        color: 0xffffff,
                        size: 0.1,
                    } );
                    const pointCloud = new THREE.Points( pointCloudGeometry, pointCloudMaterial );

                    this.objects.pointCloud = pointCloud
                    scene.add( this.objects.pointCloud );

                },
                plane: () => {

                    if (this.objects.plane !== undefined) {
                        return this.remove.plane()
                    }


                    const planeGeometry = new THREE.PlaneGeometry(640,480);
                    const planeMaterial = new THREE.MeshBasicMaterial({color: 0xffffff, opacity: 0.1, transparent: true});
                    const plane = new THREE.Mesh(planeGeometry,planeMaterial);
                    plane.rotation.x = -0.5*Math.PI;
                    plane.position.x = 0;
                    plane.position.y = -0.1;
                    plane.position.z = 0;

                    this.objects.plane = plane

                    scene.add(this.objects.plane );
                },
                axes: () => {
                    if (this.objects.axes !== undefined) {
                        return this.remove.axes()
                    }

                    const axes = new THREE.AxesHelper(1000);
                    this.objects.axes = axes;
                    scene.add(this.objects.axes);
                }
            }

            this.animateRender = true
            this.animate = () => {
                if (this.animateRender === false) {
                    return;
                }

               // this.remove.pointCloud()
               // this.set.pointCloud()
                renderer.render( scene, camera )

                requestAnimationFrame( this.animate );
            }

            $scope.back = () => {
              $state.go('thermo-measuring-instrument')
            }

            $scope.reset = this.reset
            $scope.showInfo = false

            // VIDEO
            const sources = [
                [
                    {src: $sce.trustAsResourceUrl("/assets/video/video1.mp4"), type: "video/mp4"},
                ],
                [
                    {src: $sce.trustAsResourceUrl("/assets/video/video2.mp4"), type: "video/mp4"},
                ],
                [
                    {src: $sce.trustAsResourceUrl("/assets/video/video3.mp4"), type: "video/mp4"},
                ],
                [
                    {src: $sce.trustAsResourceUrl("/assets/video/video4.mkv"), type: "video/mp4"},
                ]
            ]

            let videoAPI

            $scope.$watch('videoConfig.sources', (newVal, oldVal) => {
                //console.warn('switch video')
                if (videoAPI) {
                    videoAPI.stop()
                }
            })

            $scope.videoConfig = {
                onPlayerReady: ($API) => {
                    videoAPI = $API;
                    //console.warn('onPlayerReady', $API)
                },
                sourceList: sources,
                sources: undefined,
                tracks: [
                    /*
                    {
                        src: "http://www.videogular.com/assets/subs/pale-blue-dot.vtt",
                        kind: "subtitles",
                        srclang: "en",
                        label: "English",
                        default: ""
                    }
                     */
                ],
                theme: "bower_components/videogular-themes-default/videogular.css",
                plugins: {
                    /*
                    poster: "http://www.videogular.com/assets/images/videogular.png"
                     */
                }
            };
            //$scope.videoConfig.sources = $scope.videoConfig.sourceList[0]
        }
    }

} )
