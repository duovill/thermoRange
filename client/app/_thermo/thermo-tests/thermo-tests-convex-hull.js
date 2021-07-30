ngivr.angular.directive('thermoTestsConvexHull', function () {

    return {
        templateUrl: 'app/_thermo/thermo-tests/thermo-tests-convex-hull.html',

        controller: function ($scope, $state, thermoWebgl) {

            let container, $container;
            let group, camera, scene, renderer;
            const webglId = 'thermo-tests-convex-hull-3d'

            const containerSmaller = 1.5


            let timeoutNew

            $scope.rotateHull = true
            $scope.points = 500

            $scope.$watch('points', (o, n) => {
                $scope.new()
            })

            $scope.new = () => {
                this.animateRender = false
                this.$onDestroy();
                if ($container !== undefined) {
                    $container.empty();
                }
                timeoutNew = setTimeout(() => {
                    this.animateRender = true
                    this.init();
                    this.animate();
                    $scope.$digest()
                }, 100)
            }

            this.$postLink = () => {
                // console.log('thermo-tests-convex-hull post link')

            }

            const getVolume = (geometry) => {

                if (!geometry.isBufferGeometry) {
                    console.log("'geometry' must be an indexed or non-indexed buffer geometry");
                    return 0;
                }
                const signedVolumeOfTriangle = (p1, p2, p3) => {
                    return p1.dot(p2.cross(p3)) / 6.0;
                }

                const isIndexed = geometry.index !== null;
                let position = geometry.attributes.position;
                let sum = 0;
                let p1 = new THREE.Vector3(),
                    p2 = new THREE.Vector3(),
                    p3 = new THREE.Vector3();
                if (!isIndexed) {
                    let faces = position.count / 3;
                    for (let i = 0; i < faces; i++) {
                        p1.fromBufferAttribute(position, i * 3 + 0);
                        p2.fromBufferAttribute(position, i * 3 + 1);
                        p3.fromBufferAttribute(position, i * 3 + 2);
                        sum += signedVolumeOfTriangle(p1, p2, p3);
                    }
                } else {
                    let index = geometry.index;
                    let faces = index.count / 3;
                    for (let i = 0; i < faces; i++) {
                        p1.fromBufferAttribute(position, index.array[i * 3 + 0]);
                        p2.fromBufferAttribute(position, index.array[i * 3 + 1]);
                        p3.fromBufferAttribute(position, index.array[i * 3 + 2]);
                        sum += signedVolumeOfTriangle(p1, p2, p3);
                    }
                }
                return sum;
            }


            this.init = () => {

                container = document.getElementById(webglId);
                $container = $('#' + webglId)

                scene = new THREE.Scene();

                renderer = new THREE.WebGLRenderer({antialias: true});
                renderer.setPixelRatio(window.devicePixelRatio);
                renderer.setSize($container.width() / containerSmaller, $container.width() / containerSmaller / 16 * 9);
                container.appendChild(renderer.domElement);

                // camera

                camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 1000);
                camera.position.set(15, 20, 30);
                scene.add(camera);

                // controls

                var controls = new THREE.OrbitControls(camera, renderer.domElement);
                controls.minDistance = 1;
                controls.maxDistance = 500;
                controls.maxPolarAngle = Math.PI / 2;

                scene.add(new THREE.AmbientLight(0x222222));

                // light

                var light = new THREE.PointLight(0xffffff, 1);
                camera.add(light);

                // helper

                scene.add(new THREE.AxesHelper(20));


                group = new THREE.Group();
                scene.add(group);

                // points

                var vertices = [];

                for (let i = 0; i < $scope.points; i++) {
                    const star = new THREE.Vector3();
                    star.x = THREE.Math.randFloatSpread(THREE.Math.randInt(5, 20));
                    star.y = THREE.Math.randFloatSpread(THREE.Math.randInt(5, 20));
                    star.z = THREE.Math.randFloatSpread(THREE.Math.randInt(5, 20));
                    vertices.push(star);
                }

//                console.log(vertices)
//                vertices = new THREE.DodecahedronGeometry( 10 ).vertices;
//                console.log(vertices)

                // textures

                var loader = new THREE.TextureLoader();
                var texture = loader.load('bower_components/threejs/examples/textures/sprites/disc.png');

                var pointsMaterial = new THREE.PointsMaterial({
                    color: 0x0000ff,
                    map: texture,
                    size: 1,
                    alphaTest: 0.5
                });

                var pointsGeometry = new THREE.BufferGeometry().setFromPoints(vertices);

                var points = new THREE.Points(pointsGeometry, pointsMaterial);
                group.add(points);

                // convex hull

                var meshMaterial = new THREE.MeshLambertMaterial({
                    color: 0xffffff,
                    opacity: 0.5,
                    transparent: true
                });

                var meshGeometry = new THREE.ConvexBufferGeometry(vertices);

                $scope.volume = getVolume(meshGeometry).toFixed(2)

                var mesh = new THREE.Mesh(meshGeometry, meshMaterial);
                mesh.material.side = THREE.BackSide; // back faces
                mesh.renderOrder = 0;
                group.add(mesh);

                var mesh = new THREE.Mesh(meshGeometry, meshMaterial.clone());
                mesh.material.side = THREE.FrontSide; // front faces
                mesh.renderOrder = 1;
                group.add(mesh);

                // convex hull line material
                var lineMaterial = new THREE.MeshPhongMaterial({
                    color: 0xffffff,
                    opacity: 1.0,
                    transparent: true,
                    wireframe: true
                });
                //group.add( new THREE.Mesh( meshGeometry, meshMaterial ) );
                group.add(new THREE.Mesh(meshGeometry, lineMaterial));

                window.addEventListener('resize', onWindowResize, false);
                onWindowResize()
            }

            function onWindowResize() {

                camera.aspect = 16 / 9;
                camera.updateProjectionMatrix();

                renderer.setSize($container.width() / containerSmaller, $container.width() / containerSmaller / 16 * 9);
            }

            this.animateRender = true
            this.animate = () => {
                if (this.animateRender === false) {
                    return;
                }
                requestAnimationFrame(this.animate);

                if ($scope.rotateHull) {
                    group.rotation.y += 0.005;
                }
                renderer.render(scene, camera);
            }

            this.$onDestroy = () => {
                this.animateRender = false
                clearTimeout(timeoutNew)
                window.removeEventListener('resize', onWindowResize, false);
            }


        }
    }

})
