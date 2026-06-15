import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000);
camera.position.set(0, 20, 300);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 2);
pointLight.position.set(500, 0, 0);
scene.add(pointLight);

const tiltContainer = new THREE.Group();
tiltContainer.rotation.z = THREE.MathUtils.degToRad(27);
scene.add(tiltContainer);

const rotationContainer = new THREE.Group();
tiltContainer.add(rotationContainer);

const saturnGeom = new THREE.SphereGeometry(60, 128, 64);
const saturnMat = new THREE.MeshStandardMaterial({ 
    map: new THREE.TextureLoader().load('../images/2k_saturn.jpg') 
});
const saturnMesh = new THREE.Mesh(saturnGeom, saturnMat);
rotationContainer.add(saturnMesh);

const ringGeom = new THREE.RingGeometry(74.5, 137, 64);
const ringMat = new THREE.MeshStandardMaterial({ 
    map: new THREE.TextureLoader().load('../images/2k_saturn_ring_alpha.png'),
    transparent: true,
    side: THREE.DoubleSide
});
const ringMesh = new THREE.Mesh(ringGeom, ringMat);

ringMesh.rotation.x = -Math.PI / 2; 
rotationContainer.add(ringMesh);

function animate() {
    requestAnimationFrame(animate);
    
    rotationContainer.rotation.y += 0.01;
    
    renderer.render(scene, camera);
}

animate();