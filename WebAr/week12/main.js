import * as THREE from 'three';
import { UARButton } from 'webxr/UARButton';

document.addEventListener("DOMContentLoaded", () => {
    const initialize = async () => {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera();

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.xr.enabled = true;
        document.body.appendChild(renderer.domElement);

        document.body.appendChild(UARButton.createButton(renderer, {
            optionalFeatures: ["dom-overlay"],
            domOverlay: { root: document.body }
        }));

        const spinningObjects = [];

        const createTorus = (position) => {
            const geometry = new THREE.TorusGeometry(0.05, 0.02, 16, 100);
            const material = new THREE.MeshBasicMaterial({ color: 0xff00ff });
            const torus = new THREE.Mesh(geometry, material);
            torus.position.copy(position);
            scene.add(torus);
            
            spinningObjects.push(torus);
        };

        renderer.xr.addEventListener("sessionstart", async () => {
            const session = renderer.xr.getSession();
            
            session.addEventListener("select", (event) => {
                const position = new THREE.Vector3(0, 0, -0.3);
                position.applyMatrix4(camera.matrixWorld);
                createTorus(position);
            });
        });

        renderer.setAnimationLoop((timestamp, frame) => {
            spinningObjects.forEach(torus => {
                torus.rotation.x += 0.02;
                torus.rotation.y += 0.03;
            });
            
            renderer.render(scene, camera);
        });
    };
    initialize();
});