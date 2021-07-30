ngivr.angular.factory('thermoWebgl', function () {

    return new function() {

        this.initWebgl = (opts) => {
            const { $container, bg, contextMenuEnabled  } = opts
            let { aspect, antialias, light } = opts
            if (aspect  === undefined) {
                aspect = 16/9
            }
            if (antialias  === undefined) {
                antialias = true
            }
            if (light === undefined) {
                light = true
            }
            const camera = new THREE.PerspectiveCamera( 50, aspect, 0.01, 2000 );
            const scene = new THREE.Scene();

            const renderer = new THREE.WebGLRenderer( { antialias: antialias } );
            renderer.setPixelRatio( window.devicePixelRatio );

            if (bg) {
                scene.background =  new THREE.Color( bg );
            }
            renderer.setClearColor( 0x000000, 1 );

            if (light) {
                const threeLight = new THREE.AmbientLight( 0xffffff , 1); // soft white light
                scene.add( threeLight );
            }

            const contextMenu = (event) => {
                event.preventDefault()
            }

            if (contextMenuEnabled !== false) {
                window.addEventListener('contextmenu', contextMenu)
            }

            const destroy = () => {
                if (contextMenuEnabled !== false) {
                    window.removeEventListener('contextmenu', contextMenu)
                }
            }



            const init = (opts = {}) => {

                const { noSetSize, id } = opts

                renderer.render(scene,camera);

                $container.empty()
                $container[0].appendChild( renderer.domElement );

                if (id !== undefined) {
                    renderer.domElement.id = id;
                }

                if (noSetSize !== true) {
                   // console.log($container.width(), $container.height())
                    renderer.setSize( $container.width(), $container.height() );
                }

            }

            return {
                camera, scene, renderer, destroy, init, domElement: renderer.domElement
            }
        }

        this.decorateWheelZoom = (opts) => {
  //          console.warn('decorateWheelZoom ')
            const { camera, $container} = opts

            const onWheel =  (event) => {
    //            console.warn(event)
                let changed = false
                const diff = 0.2
                if (event.deltaY < 0) {
                    changed = true
                    camera.zoom += diff
                } else if (event.deltaY > 0) {
                    changed = true
                    camera.zoom -= diff
                }

                const maxZoom = 4
                if (changed) {
                    if (camera.zoom < diff) {
                        camera.zoom = diff
                    } else if (camera.zoom > maxZoom) {
                        camera.zoom = maxZoom
                    }
                    console.log('decorateWheelZoom changed zoom', camera.zoom)
                    camera.updateProjectionMatrix()
                }

            }

//            console.warn('addEventListener wheel', $container[0])
            $container[0].addEventListener('wheel', onWheel)
            const result = {}


            result.destroy = () => {
                $container[0].removeEventListener('wheel', onWheel)
            }

            return result
        }

        this.decorateResizer = (opts) => {
            const { $container, renderer } = opts


            const debounce = _.debounce
            const resize = () => {
                const height = $container.outerWidth() * (9/16)
                $container.height(height)

                if (renderer) {

                    renderer.setSize($container.width(), $container.height())
                }
            }
            const resizeThreeContainer = debounce(resize , 500)

            window.addEventListener('resize', resizeThreeContainer)

            const result =  {}

            result.destroy = () => {
                window.removeEventListener('resize', resizeThreeContainer)
            }

            resize()
            resizeThreeContainer()

            return result
        }

        this.moveDecorator = (opts) => {
            const { object, reverse }  = opts
            //console.log('reverse', reverse)
            const result = {}
            result.keyW = false;
            result.keyA = false;
            result.keyS = false;
            result.keyD = false;

            result.onKeyDown = (event) =>     {
                const keyCode = event.keyCode;
                switch (keyCode) {
                    case 68: //d
                        result.keyD = true;
                        break;
                    case 83: //s
                        result.keyS = true;
                        break;
                    case 65: //a
                        result.keyA = true;
                        break;
                    case 87: //w
                        result.keyW = true;
                        break;
                }
            }
            result.onKeyUp = (event) => {
                const keyCode = event.keyCode;

                switch (keyCode) {
                    case 68: //d
                        result.keyD = false;
                        break;
                    case 83: //s
                        result.keyS = false;
                        break;
                    case 65: //a
                        result.keyA = false;
                        break;
                    case 87: //w
                        result.keyW = false;
                        break;
                }
            }

            let lastPosition = {}
            const onMouseMove = (event) => {
                if (trc.state.click) {
                    return
                }
                if (event.buttons === 1) {
                    //check to make sure there is data to compare against
                    if (typeof(lastPosition.x) != 'undefined') {

                        //get the change from last position to this position
                        const deltaX = lastPosition.x - event.clientX,
                            deltaY = lastPosition.y - event.clientY;

                        const diffMove = opts.diffMove * 1
                        //check which direction had the highest amplitude and then figure out direction by checking if the value is greater or less than zero
                        if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 0) {
                            //left
                            if (reverse === true) {
                                object.position.x += diffMove
                            } else {
                                object.position.x -= diffMove
                            }
                        } else if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX < 0) {
                            //right
                            //console.log('right')
                            if (reverse === true) {
                                object.position.x -= diffMove
                            } else {
                                object.position.x += diffMove
                            }
                        } else if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY > 0) {
                            //up
                            if (reverse === true) {
                                object.position.y -= diffMove
                            } else {
                                object.position.y += diffMove
                            }
                        } else if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY < 0) {
                            //down
                            if (reverse === true) {
                                object.position.y += diffMove
                            } else {
                                object.position.y -= diffMove
                            }
                        }
                    }

                    //set the new last position to the current for next time
                    lastPosition = {
                        x : event.clientX,
                        y : event.clientY
                    };
                }
            }


            document.addEventListener('mousemove', onMouseMove)
            window.addEventListener("keydown", result.onKeyDown, false);
            window.addEventListener("keyup", result.onKeyUp, false);


            result.destroy = () => {
                document.removeEventListener('mousemove', onMouseMove)
                window.removeEventListener("keydown", result.onKeyDown, false);
                window.removeEventListener("keyup", result.onKeyUp, false);

            }

            result.move = () => {
                if (result.keyD === true) {
                    if (reverse) {
                        object.position.x -= opts.diffMove;
                    } else {
                        object.position.x += opts.diffMove;
                    }
                }
                if (result.keyS === true) {
                    if (reverse) {
                        object.position.z -= opts.diffMove;
                    } else {
                        object.position.z += opts.diffMove;
                    }
                }
                if (result.keyA === true) {
                    if (reverse) {
                        object.position.x += opts.diffMove;
                    } else {
                        object.position.x -= opts.diffMove;
                    }
                }
                if (result.keyW === true) {
                    if (reverse) {
                        object.position.z += opts.diffMove;
                    } else {
                        object.position.z -= opts.diffMove;
                    }
                }
                /*
                if (result.keyA || result.keyD|| result.keyS || result.keyW) {
                    console.warn('trc-webgl moveDecorator.move', object.position, object.rotation)
                }
                 */
            }

            return result


        }

        this.decorateRotator = (opts) => {

            const { object, diff} = opts

            let lastPosition = {}
            const onMouseMove = (event) => {
                if (trc.state.click) {
                    return
                }
                //console.warn(event.buttons)
                if (event.buttons === 2) {
                    //check to make sure there is data to compare against
                    if (typeof(lastPosition.x) != 'undefined') {

                        //get the change from last position to this position
                        const deltaX = lastPosition.x - event.clientX,
                            deltaY = lastPosition.y - event.clientY;

                        //check which direction had the highest amplitude and then figure out direction by checking if the value is greater or less than zero
                        if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 0) {
                            //left
                            object.rotation.y -= diff
                        } else if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX < 0) {
                            //right
                            object.rotation.y += diff
                        } else if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY > 0) {
                            //up
                            object.rotation.x -= diff
                        } else if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY < 0) {
                            //down
                            object.rotation.x += diff
                        }
                    }

                    //set the new last position to the current for next time
                    lastPosition = {
                        x : event.clientX,
                        y : event.clientY
                    };

                }
            }

            document.addEventListener('mousemove', onMouseMove)
            const result = {}

            result.destroy = () => {
                document.removeEventListener('mousemove', onMouseMove)
            }

            return result

        }
    }

});

