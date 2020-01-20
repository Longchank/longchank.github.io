if (!Detector.webgl) Detector.addGetWebGLMessage();
var statsEnabled = true;
var container, stats, loader;
var camera, scene, renderer, raycaster;
var cameraCube, sceneCube;
var controls;
var mesh;
var spotLight;
var raycaster;
var mouse;
var intersects;
var projector;
var pos = new THREE.Vector3(0, 0, 0);
var eventZoomCTRL;

//Clean up vars

//init();
//animate();

function allItemsLoaded() {
  $(".loader").fadeOut("slow");
}

function init() {
  //Clean up renderer.

  container = document.getElementById("container");
  //Add camera that uses the 'container' w/h as aspect. Was too lazy to orient the object so i oriented the XYZ of the camera instead.
  camera = new THREE.PerspectiveCamera(
    60,
    container.clientWidth / container.clientHeight,
    0.01,
    1000
  );
  //        camera.rotation.order = "YXZ";
  orig_camPos = camera.position.set(19, 12, -25);

  //------------------------------------------------------//
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.domElement.id = "threedee";
  renderer.setClearColor(0x000000, 0); // the default
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  //Shadow
  var canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;

  var context = canvas.getContext("2d");
  var gradient = context.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    0,
    canvas.width / 2,
    canvas.height / 2,
    canvas.width / 2
  );
  gradient.addColorStop(0.1, "rgba(210,210,210,1)");
  gradient.addColorStop(1, "rgba(255,255,255,1)");

  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  var shadowTexture = new THREE.Texture(canvas);
  shadowTexture.needsUpdate = true;

  var shadowMaterial = new THREE.MeshBasicMaterial({ map: shadowTexture });
  var shadowGeo = new THREE.PlaneBufferGeometry(300, 300, 1, 1);

  mesh = new THREE.Mesh(shadowGeo, shadowMaterial);
  mesh.position.y = -1;
  mesh.rotation.x = -Math.PI / 2;

  //End shadow

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  renderer.autoClear = false;
  renderer.gammaInput = true;
  renderer.gammaOutput = true;
  renderer.toneMapping = THREE.LinearToneMapping;
  renderer.toneMappingExposure = 1.5;
  renderer.toneMappingWhitePoint = 1;

  scene = new THREE.Scene();

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.rotateSpeed = 0.08;
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  controls.enableZoom = true;
  controls.enablePan = false;
  controls.maxDistance = 40;
  controls.minDistance = 20;
  controls.target.set(0, 0, 0);

  eventZoomCTRL = function zoomModel(isZoomOut, scale) {
    var zoomFactor = 0.2;
    if (isZoomOut) {
      console.log("in");
      controls.dollyIn(1 + zoomFactor);
    } else {
      console.log("out");
      controls.dollyOut(1 + zoomFactor);
    }
  };

  // LIGHTS

  scene.add(new THREE.HemisphereLight(0xe6f7ff, 0xffffe6, 1));
  //				scene.add( new THREE.AmbientLight( 0xffffff ) );

  //This needs a shitton of more testing.
  //Loading manager that is hooked up to the loadingscreen.
  var manager = new THREE.LoadingManager();
  manager.onProgress = function(item, loaded, total) {
    console.log(item, loaded, total);
  };

  manager.onLoad = function() {
    console.log("all items loaded");
    allItemsLoaded();
  };

  manager.onError = function() {
    console.log("error");
  };
  var path = "assets/models/textures/";
  var loader = new THREE.OBJLoader();
  var material = new THREE.MeshStandardMaterial();
  //Loader can be use angular for easier editing of product.
  loader.load("assets/models/gainomax.obj", function(group) {
    //Texture loader, this is where the loadtime is the highest. That is why we have the LoadManager hooked up to the textureloader.
    var loader = new THREE.TextureLoader(manager);
    //Since this is all plastic all over, it does not need a texture for metalness/ruffness
    //Setup an json file for all editible variables here.
    material.roughness = 0.6;
    material.metalness = 0.4;
    //                    material.aoMapIntensity = 4;
    material.map = loader.load(path + "DIFFUSE.png");
    material.normalMap = loader.load(path + "gainer_normals_unity.PNG");
    //                    material.aoMap = loader.load( path + 'AO.png' );
    material.map.wrapS = THREE.RepeatWrapping;
    material.normalMap.wrapS = THREE.RepeatWrapping;
    //                    material.aoMap.wrapS = THREE.RepeatWrapping;

    group.traverse(function(child) {
      if (child instanceof THREE.Mesh) {
        child.material = material;
      }
    });
    //This should not exist. What is this even?
    //					group.position.x = - 0.45;
    //					group.rotation.y = - Math.PI / 2;
    scene.add(group);
  });
  //Should be editable. On/OFf for Cubes
  var genCubeUrls = function(prefix, postfix) {
    return [
      prefix + "_right" + postfix,
      prefix + "_left" + postfix,
      prefix + "_top" + postfix,
      prefix + "_bottom" + postfix,
      prefix + "_front" + postfix,
      prefix + "_back" + postfix
    ];
  };

  var hdrUrls = genCubeUrls("./assets/models/hdr/cube", ".hdr");
  new THREE.HDRCubeTextureLoader(manager).load(
    THREE.UnsignedByteType,
    hdrUrls,
    function(hdrCubeMap) {
      var pmremGenerator = new THREE.PMREMGenerator(hdrCubeMap);
      pmremGenerator.update(renderer);

      var pmremCubeUVPacker = new THREE.PMREMCubeUVPacker(
        pmremGenerator.cubeLods
      );
      pmremCubeUVPacker.update(renderer);

      hdrCubeRenderTarget = pmremCubeUVPacker.CubeUVRenderTarget;

      material.envMap = hdrCubeRenderTarget.texture;
      material.needsUpdate = true;
    }
  );
}

//Add function for click to zoom. Press on the model zoom into that position, now that is the new rotational origo.
//Double click to zoom out again.

function animate() {
  requestAnimationFrame(animate);
  render();
  controls.update();
}

//The update function. Everything above needs to be done per frame.
function render() {
  camera.lookAt(scene.position);

  renderer.render(scene, camera);
}
