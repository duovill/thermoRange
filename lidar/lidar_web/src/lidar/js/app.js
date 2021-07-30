function init() {

  var stats = initStats();
  var renderer = initRenderer();
  var camera = initCamera();
  var clock = new THREE.Clock();
  var trackballControls = initTrackballControls(camera, renderer);

  camera.position.x = 0;
  camera.position.y = 0;
  camera.position.z = 250;

  camera.lookAt(new THREE.Vector3(0, 0, 0))

  var scene = new THREE.Scene();

  $(function(){
    $.post("http://127.0.0.1:8000/scan", JSON.stringify({ip: "192.168.0.1", port: 2000})).done(function(data){
      console.log(data)
      createPoints(data.points);
      render();
    }).fail(function(a){
      alert('hiba');
    });
  })



  function createPoints(points) {

    var geom = new THREE.Geometry();
    var material = new THREE.PointsMaterial({
      size: 0.2,
      vertexColors: true,
      color: 0xffffff,
      opacity: 0.5,
      transparent: true,
    });

    const N = 40;

    for (var i = 0; i < N; i++) {
      for (var j = 0; j < N; j++) {
        var particle = new THREE.Vector3(i, j, 0);
        geom.vertices.push(particle);
        geom.colors.push(new THREE.Color(0xffffff));
      }
    }
    
    for (var i = 0; i < N; i++) {
      for (var j = 0; j < N; j++) {
        var particle = new THREE.Vector3(i, 0, j);
        geom.vertices.push(particle);
        geom.colors.push(new THREE.Color(0xffffff));
      }
    }

    for (var i = 0; i < N; i++) {
      for (var j = 0; j < N; j++) {
        var particle = new THREE.Vector3(N, i, j);
        geom.vertices.push(particle);
        geom.colors.push(new THREE.Color(0xffffff));
      }
    }

    var r = 32;
    const xCenter = N;
    const zCenter = 0;

    for(var i = 0; i < points.length; i++) {
        var particle = new THREE.Vector3(points[i][0], points[i][1], points[i][2]);
        geom.vertices.push(particle);
        geom.colors.push(new THREE.Color(0x7ef542));
    }

    // for (var y = 0; y < 16; y += 0.2) {
    //   for (var i = 0; i < 2 * Math.PI; i += 0.02) {
    //     var x = r * Math.cos(i) + xCenter + rn(0.1, 0.5);
    //     var z = r * Math.sin(i) + zCenter + rn(0.1, 0.5);
    //     if(x > N) {
    //       continue;
    //     }

    //     if(z < 0) {
    //       continue;
    //     }
      
    //     tmp.push([x,y,z])
    //     var particle = new THREE.Vector3(x, y, z);
    //     geom.vertices.push(particle);
    //     geom.colors.push(new THREE.Color(0xfcdb03));
    //   }

    //   r -= 0.4 - rn(0.01, 0.04);
    // }

    var cloud = new THREE.Points(geom, material);
    scene.add(cloud);
  }


  function render() {
    stats.update();
    trackballControls.update(clock.getDelta());
    requestAnimationFrame(render);
    renderer.render(scene, camera);
  }
}

function rn(min, max) {
  return Math.random() * (max - min) + min;
};
