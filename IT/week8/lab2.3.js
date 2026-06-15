import { MindARThree } from 'https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-three.prod.js';
import * as THREE from 'three';

const mindarThree = new MindARThree({
  container: document.body,
  imageTargetSrc: '../images/acc.mind'
});

const { renderer, scene, camera } = mindarThree;

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 2);
pointLight.position.set(500, 0, 0);
scene.add(pointLight);

const tiltContainer = new THREE.Group();
tiltContainer.rotation.z = THREE.MathUtils.degToRad(27);

const rotationContainer = new THREE.Group();
tiltContainer.add(rotationContainer);

const scale = 0.01;
const saturnGeom = new THREE.SphereGeometry(60 * scale, 128, 64);
const saturnMat = new THREE.MeshStandardMaterial({ 
    map: new THREE.TextureLoader().load('../images/2k_saturn.jpg') 
});
const saturnMesh = new THREE.Mesh(saturnGeom, saturnMat);
rotationContainer.add(saturnMesh);

const ringGeom = new THREE.RingGeometry(74.5 * scale, 137 * scale, 64);
const ringMat = new THREE.MeshStandardMaterial({ 
    map: new THREE.TextureLoader().load('../images/2k_saturn_ring_alpha.png'),
    transparent: true,
    side: THREE.DoubleSide
});
const ringMesh = new THREE.Mesh(ringGeom, ringMat);
ringMesh.rotation.x = -Math.PI / 2; 
rotationContainer.add(ringMesh);

const anchor = mindarThree.addAnchor(0);
anchor.group.add(tiltContainer);

async function start() {
  await mindarThree.start();
  renderer.setAnimationLoop(() => {
    rotationContainer.rotation.y += 0.01;
    renderer.render(scene, camera);
  });
}

start();