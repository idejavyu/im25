import * as THREE from 'three';

document.addEventListener("DOMContentLoaded", () => {
    const initialize = async () => {
        const arButton = document.querySelector("#ar-button");
        const supported = navigator.xr && await navigator.xr.isSessionSupported("immersive-ar");

        if (!supported) {
            arButton.textContent = "WebXR не підтримується";
            arButton.disabled = true;
            return;
        }

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera();
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(renderer.domElement);

        const light = new THREE.PointLight(0xffffff, 2, 10);
        scene.add(light);

        const textureLoader = new THREE.TextureLoader();
        const spaceObjects = [
            { name: 'Sun', radius: 0.15, pos: 0, texture: './images/sun.jpg' },
            { name: 'Mercury', radius: 0.02, pos: 0.25, texture: './images/mercury.jpg' },
            { name: 'Venus', radius: 0.035, pos: 0.35, texture: './images/venus.jpg' },
            { name: 'Earth', radius: 0.04, pos: 0.45, texture: './images/earth.jpg' },
            { name: 'Mars', radius: 0.025, pos: 0.55, texture: './images/mars.jpg' },
            { name: 'Jupiter', radius: 0.09, pos: 0.75, texture: './images/jupiter.jpg' },
            { name: 'Saturn', radius: 0.075, pos: 0.95, texture: './images/saturn.jpg' },
            { name: 'Uranus', radius: 0.05, pos: 1.15, texture: './images/uranus.jpg' },
            { name: 'Neptune', radius: 0.05, pos: 1.35, texture: './images/neptune.jpg' }
        ];

        const objects = [];

        spaceObjects.forEach(obj => {
            const geometry = new THREE.SphereGeometry(obj.radius, 64, 64);
            const material = new THREE.MeshStandardMaterial({
                map: textureLoader.load(obj.texture),
                emissive: obj.name === 'Sun' ? 0xffaa00 : 0x000000,
                emissiveIntensity: obj.name === 'Sun' ? 1 : 0
            });
            const mesh = new THREE.Mesh(geometry, material);
            
            if (obj.name !== 'Sun') {
                const orbitGroup = new THREE.Group();
                scene.add(orbitGroup);
                
                mesh.position.set(obj.pos, 0, 0); 
                orbitGroup.add(mesh);
                
                objects.push({ 
                    mesh: mesh, 
                    orbitGroup: orbitGroup, 
                    orbitSpeed: 0.005 / (obj.pos * 2),
                    rotationSpeed: 0.01 
                });
            } else {
                mesh.position.set(0, 0, -1);
                scene.add(mesh);
                objects.push({ mesh: mesh, orbitGroup: null, orbitSpeed: 0, rotationSpeed: 0.002 });
            }
        });

        let currentSession = null;

        const start = async() => {
            currentSession = await navigator.xr.requestSession(
                "immersive-ar", {
                    optionalFeatures: ["dom-overlay"],
                domOverlay: {root: document.body}
                }
            );

            renderer.xr.enabled = true;
            renderer.xr.setReferenceSpaceType("local");

            await renderer.xr.setSession(currentSession);
            
            arButton.textContent = "Завершити сесiю WebXR";
            renderer.setAnimationLoop((timestamp, frame) => {
                if (!currentSession) return;

                objects.forEach(o => {
                    o.mesh.rotation.y += o.rotationSpeed;
                    if (o.orbitGroup) {
                        o.orbitGroup.rotation.y += o.orbitSpeed;
                    }
                });

                renderer.render(scene, camera);
            });

        }
         const end = async() => {
            await currentSession.end();
            renderer.setAnimationLoop(null);
            renderer.clear();
            currentSession = null;
            renderer.xr.enabled = false;
            arButton.textContent = "Увiйти до WebXR";
        }

        arButton.addEventListener("click", () => {
            if (currentSession) {
                end();
            } else {
                start();
            }
        });
    };

    initialize();
});