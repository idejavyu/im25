import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';
import { GLTFLoader } from 'https://unpkg.com/three@0.153.0/examples/jsm/loaders/GLTFLoader.js';
import { CSS3DObject, CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js';

document.addEventListener("DOMContentLoaded", () => {
    const startButton = document.querySelector("#startButton");
    const loader = new GLTFLoader();
    const mixers = []; // Масив для керування анімаціями
    const clock = new THREE.Clock();

    const start = async () => {
        const mindarThree = new MindARThree({
            container: document.body,
            imageTargetSrc: "../assets/acc.mind",
            maxTrack: 1,
            uiScanning: "yes",
            uiLoading: "yes",
        });

        const { scene, camera, renderer } = mindarThree;
        const anchor = mindarThree.addAnchor(0);

        // Освітлення
        const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1);
        scene.add(ambientLight);

        // --- Галерея ---
        const textureLoader = new THREE.TextureLoader();
        const textures = [
            textureLoader.load('../assets/cube1.png'),
            textureLoader.load('../assets/cube2.png'),
            textureLoader.load('../assets/cube3.png'),
            textureLoader.load('../assets/cube4.jpg'),
            textureLoader.load('../assets/cube5.jpg'),
            textureLoader.load('../assets/cube6.png'),
        ];
        let currentTextureIndex = 0;

        const geometry = new THREE.PlaneGeometry(1, 1);
        const material = new THREE.MeshBasicMaterial({ map: textures[0], side: THREE.DoubleSide });
        const galleryMesh = new THREE.Mesh(geometry, material);
        galleryMesh.position.set(0, 0.5, 0);
        galleryMesh.scale.set(0.5, 0.5, 0.5);
        anchor.group.add(galleryMesh);

        const video = document.getElementById('videoElement');
        const videoTexture = new THREE.VideoTexture(video);

        const videoGeometry = new THREE.PlaneGeometry(0.5, 0.9);
        const videoMaterial = new THREE.MeshBasicMaterial({ map: videoTexture, side: THREE.DoubleSide });
        const videoMesh = new THREE.Mesh(videoGeometry, videoMaterial);

        videoMesh.position.set(0, -0.2, 0);
        videoMesh.userData = { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=RDdQw4w9WgXcQ" };
        anchor.group.add(videoMesh);

        anchor.onTargetFound = () => {
            video.play();
        };
        anchor.onTargetLost = () => {
            video.pause();
        };

        async function loadButtonModel(url, position) {
            return new Promise((resolve) => {
                loader.load(url, (gltf) => {
                    const model = gltf.scene;
                    model.scale.set(0.1, 0.1, 0.1);
                    model.position.set(...position);
                    anchor.group.add(model);

                    const mixer = new THREE.AnimationMixer(model);
                    if (gltf.animations.length > 0) {
                        const action = mixer.clipAction(gltf.animations[0]);
                        action.play();
                    }
                    mixers.push(mixer);
                    resolve(model);
                });
            });
        }

        const btnLeft = await loadButtonModel('../assets/model2.glb', [-0.4, 0.5, 0]);
        btnLeft.scale.set(0.001, 0.001, 0.001);
        const btnRight = await loadButtonModel('../assets/model2.glb', [0.4, 0.5, 0]);
        btnRight.scale.set(0.001, 0.001, 0.001);

        const cssRenderer = new CSS3DRenderer();
        cssRenderer.setSize(window.innerWidth, window.innerHeight);
        cssRenderer.domElement.style.position = 'absolute';
        cssRenderer.domElement.style.top = '0';
        document.body.appendChild(cssRenderer.domElement);

        // 2. Створення 3D об'єктів з HTML
        const leftObj = new CSS3DObject(document.getElementById('text-left'));
        const rightObj = new CSS3DObject(document.getElementById('text-right'));

        // Масштабування тексту (зробіть його меншим, бо CSS об'єкти за замовчуванням великі)
        leftObj.scale.set(0.002, 0.002, 0.002);
        rightObj.scale.set(0.002, 0.002, 0.002);

        // Розміщення
        leftObj.position.set(-0.3, 0, 0);
        rightObj.position.set(0.25, 0, 0);

        anchor.group.add(leftObj);
        anchor.group.add(rightObj);



        // --- Аудіо ---
        const listener = new THREE.AudioListener();
        camera.add(listener);
        const sound1 = new THREE.Audio(listener);
        const sound2 = new THREE.Audio(listener);
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load('../assets/sound1.mp3', (buffer) => sound1.setBuffer(buffer));
        audioLoader.load('../assets/sound2.mp3', (buffer) => sound2.setBuffer(buffer));

        // --- Взаємодія ---
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const onMouseClick = (event) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(anchor.group.children, true);

            if (intersects.length > 0) {
                let object = intersects[0].object;
                // Знаходимо кореневу групу моделі
                while (object.parent && object.parent !== anchor.group) {
                    object = object.parent;
                }

                if (object === galleryMesh) {
                    currentTextureIndex = (currentTextureIndex + 1) % textures.length;
                    galleryMesh.material.map = textures[currentTextureIndex];
                    galleryMesh.material.needsUpdate = true;
                } else if (object === btnLeft) {
                    sound1.play();
                } else if (object === btnRight) {
                    sound2.play();
                }
                else if (object === videoMesh) {
                    window.open(object.userData.url, '_blank');
                }
            }
        };

        window.addEventListener('click', onMouseClick);

        // --- Запуск ---
        await mindarThree.start();
        renderer.setAnimationLoop(() => {
            const delta = clock.getDelta();
            mixers.forEach(m => m.update(delta));
            if (btnLeft) btnLeft.rotation.y += 0.05;
            if (btnRight) btnRight.rotation.y -= 0.05;
            renderer.render(scene, camera);
            cssRenderer.render(scene, camera);
        });
    };

    startButton.addEventListener("click", () => {
        start();
        startButton.style.display = "none";
    });
});