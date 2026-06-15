import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xCBEFFF);
document.body.appendChild(renderer.domElement);

const geom1 = new THREE.IcosahedronGeometry(0.8);
const mat1 = new THREE.MeshStandardMaterial({ color: 0xff4444 });
const obj1 = new THREE.Mesh(geom1, mat1);
obj1.position.x = -2;
scene.add(obj1);

const geom2 = new THREE.TorusGeometry(0.6, 0.2, 16, 100);
const mat2 = new THREE.MeshStandardMaterial({ color: 0x4444ff });
const obj2 = new THREE.Mesh(geom2, mat2);
obj2.position.x = 0;
scene.add(obj2);

const geom3 = new THREE.SphereGeometry(0.7, 32, 32);
const mat3 = new THREE.MeshStandardMaterial({ color: 0x44ff44 });
const obj3 = new THREE.Mesh(geom3, mat3);
obj3.position.x = 2;
scene.add(obj3);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 50);
pointLight.position.set(0, 3, 3);
scene.add(pointLight);

camera.position.z = 5;

function animate() {
    obj1.rotation.x += 0.02;
    obj1.rotation.y += 0.01;
    
    obj2.rotation.x += 0.01;
    obj2.rotation.y += 0.02;
    
    obj3.rotation.y += 0.02;
    
    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);