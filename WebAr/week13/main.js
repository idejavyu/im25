import * as THREE from 'three';
import { UARButton } from 'webxr/UARButton';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

document.addEventListener("DOMContentLoaded", () => {
    const initialize = async () => {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera();
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.xr.enabled = true;
        document.body.appendChild(renderer.domElement);

        const loader = new GLTFLoader();
        
        // Список ваших моделей
        const modelUrls = [
            '../assets/model1.glb',
            '../assets/model2.glb',
            '../assets/sea_ship.glb'
        ];

        document.body.appendChild(UARButton.createButton(renderer, {
            optionalFeatures: ["dom-overlay"],
            domOverlay: { root: document.body }
        }));

        const spinningObjects = [];

        // Функція завантаження та розміщення GLB моделі
        const createModel = (position) => {
            const url = modelUrls[Math.floor(Math.random() * modelUrls.length)];
            
            loader.load(url, (gltf) => {
                const model = gltf.scene;
                model.position.copy(position);
                model.scale.set(0.01, 0.01, 0.01);
                scene.add(model);
                spinningObjects.push(model);
            }, undefined, (error) => {
                console.error("Помилка завантаження моделі:", error);
            });
        };

        renderer.xr.addEventListener("sessionstart", async () => {
            const session = renderer.xr.getSession();
            session.addEventListener("select", () => {
                const position = new THREE.Vector3(0, 0, -0.4);
                position.applyMatrix4(camera.matrixWorld);
                createModel(position);
            });
        });

        renderer.setAnimationLoop(() => {
            spinningObjects.forEach(obj => {
                obj.rotation.y += 0.02; 
            });
            renderer.render(scene, camera);
        });
    };
    initialize();
});