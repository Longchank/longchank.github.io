import * as THREE from "../js/three/build/three.module.js";
import { OrbitControls } from "../js/three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "../js/three/examples/jsm/loaders/GLTFLoader.js";

function init() {
  //Base
  const canvas = document.querySelector("#c");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.toneMapping = THREE.ReinhardToneMapping;
  renderer.toneMappingExposure = 3;
  const loadingScreen = document.getElementById("gooey");

  //Camera settings
  {
    const fov = 75;
    const aspect = 2;
    const near = 0.1;
    const far = 10;
    var camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = -3;
  }
  //Scene settings
  {
    var scene = new THREE.Scene();
    scene.background = new THREE.Color().setHSL(0.6, 0, 1);
    scene.fog = new THREE.Fog(scene.background, 1, 5000);
  }

  //Lights
  {
    //Hemilight
    const hemiLight = new THREE.HemisphereLight(0xebf5fb, 0xf6ddcc, 1);
    hemiLight.position.set(0, 0, 0);
    scene.add(hemiLight);
    //Ambilight
    var light = new THREE.AmbientLight(0x404040, 1);
    scene.add(light);
  }

  //Orbit controls
  {
    var controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.minDistance = 2;
    controls.maxDistance = 5;
    controls.maxPolarAngle = Math.PI;
  }

  const manager = new THREE.LoadingManager(() => {
    loadingScreen.classList.add("fade-out");
  });

  manager.onProgress = function(item, loaded, total) {
    console.log(item, loaded, total);
  };

  function Material() {
    const material = new THREE.MeshStandardMaterial();
    const diffuseMap = new THREE.TextureLoader().load(
      "./assets/models/textures/DIFFUSE.png"
    );
    diffuseMap.encoding = THREE.sRGBEncoding;
    diffuseMap.flipY = false;
    material.map = diffuseMap;

    return material;
  }

  function onProgress(xhr) {
    if (xhr.lengthComputable) {
      var percentComplete = (xhr.loaded / xhr.total) * 100;
      console.log("model " + percentComplete + "% downloaded");
    }
  }

  function onError() {}

  {
    //GLTF Loader
    var loader = new GLTFLoader(manager).setPath("./assets/models/");
    loader.load(
      "gainomax.glb",
      function(gltf) {
        gltf.scene.traverse(function(o) {
          if (o.isMesh) o.material = Material();
        });
        scene.add(gltf.scene);
      },
      onProgress,
      onError
    );
  }

  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const pixelRatio = window.devicePixelRatio;
    const width = (canvas.clientWidth * pixelRatio) | 0;
    const height = (canvas.clientHeight * pixelRatio) | 0;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

  function render() {
    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }
    renderer.render(scene, camera);
    controls.update();
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}
init();
