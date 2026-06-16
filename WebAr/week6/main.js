import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MindARThree} from 'mindar-image-three';

const loadVideo = (path) => {
    return new Promise((resolve, reject) => {
        const video = document.createElement("video");
        video.addEventListener("loadeddata", () => {
            video.setAttribute("playsinline", "");
            video.setAttribute("muted", "true");
            video.setAttribute("loop", "");
            video.muted = true;
            resolve(video);
        });
        video.src = path;
    });
}

document.addEventListener("DOMContentLoaded", () => {

    const start = async() => {

        const mindarThree = new MindARThree({
            container: document.body,
            imageTargetSrc: "./targets.mind",
            maxTrack: 2,
            uiScanning: "yes",
            uiLoading: "yes",
        });

        const {scene, camera, renderer} = mindarThree;

        var light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        scene.add(light);

        const anchor1 = mindarThree.addAnchor(0);

        const video = await loadVideo("../assets/sea.mp4");
        console.log("Video loaded", video);

        const texture = new THREE.VideoTexture(video);

        const geometry = new THREE.PlaneGeometry(1, 312/856);
        const material = new THREE.MeshBasicMaterial({map: texture});

        const plane = new THREE.Mesh(geometry, material);

        anchor1.group.add(plane);

        anchor1.onTargetFound = () => {
            video.play();
        }
        anchor1.onTargetLost = () => {
            video.pause();
        }

        const anchor2 = mindarThree.addAnchor(1);

        const gltfLoader = new GLTFLoader();

        let model = null;
                
        gltfLoader.load("../assets/sea_ship.glb", (gltf) => {
            model = gltf.scene;
            model.scale.set(0.1, 0.1, 0.1);
            model.position.set(0, 0, 0);
            model.rotation.set(0, -Math.PI / 2, 0);
            anchor2.group.add(model);
            console.log("Model loaded and added to anchor 2", gltf);
        });

        document.body.addEventListener("click", (e) => {
            if (!model) return;
            const mouseX = ( e.clientX / window.innerWidth ) * 2 - 1;
            const mouseY = - ( e.clientY / window.innerHeight ) * 2 + 1;
            const mouse = new THREE.Vector2(mouseX, mouseY);
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects([model], true);
            if (intersects.length > 0) {
                model.rotation.z += (Math.random() * 45 + 45) * Math.PI / 180;
                console.log("Model clicked, new z rotation:", model.rotation.z);
            }
        });

        await mindarThree.start();

        renderer.setAnimationLoop(( time ) => {
            renderer.render(scene, camera);
        });
    }

    const startButton = document.createElement("button");
    startButton.textContent = "Будь-ласка, дозвольте скористатись камерою";
    startButton.addEventListener("click", () => {
        start();
        startButton.style.display = "none";
    });
    document.body.appendChild(startButton);
});