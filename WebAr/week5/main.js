import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MindARThree} from 'mindar-image-three';

let isStarted = false;
let mindarThree = null;
let renderer = null;

document.addEventListener("DOMContentLoaded", () => {

    const container = document.querySelector("#win2");

    const start = async() => {
        const scanOverlay = document.createElement("div");
        scanOverlay.id = "scanOverlay";
        scanOverlay.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;display:flex;justify-content:center;align-items:center;gap:20px;z-index:10;pointer-events:none;";

        const createMarkerImg = (src) => {
            const img = document.createElement("img");
            img.src = src;
            img.style.cssText = "width:40%;max-width:200px;opacity:0.5;animation:markerFlip 3s ease-in-out infinite;";
            return img;
        };

        scanOverlay.appendChild(createMarkerImg("../assets/t1.jpg"));
        scanOverlay.appendChild(createMarkerImg("../assets/t2.jpg"));
        container.appendChild(scanOverlay);

        mindarThree = new MindARThree({
            container: container,
            imageTargetSrc: "./targets.mind",
            maxTrack: 2,
            uiScanning: "no",
            uiLoading: "yes",
        });

        const {scene, camera, renderer} = mindarThree;

        var light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        scene.add(light);

        const anchor1 = mindarThree.addAnchor(0);

        const gltfLoader = new GLTFLoader();

        let mixer1 = null, mixer2 = null;
        let model1 = null, model2 = null;
        let duration1 = null, duration2 = null;
                
        gltfLoader.load("../assets/model1.glb", (gltf) => {
            mixer1  = new THREE.AnimationMixer(gltf.scene);
            if(gltf.animations.length != 0) {
                const action = mixer1.clipAction(gltf.animations[0]);
                action.play();
            }
            model1 = gltf.scene;
            model1.scale.set(0.1, 0.1, 0.1);
            model1.position.set(0, 0, 0);
            anchor1.group.add(model1);
            console.log("Model 1 loaded and added to anchor 1", gltf);
            duration1 = gltf.animations[0].duration;
        });

        const anchor2 = mindarThree.addAnchor(1);

        gltfLoader.load("../assets/model2.glb", (gltf) => {
            mixer2  = new THREE.AnimationMixer(gltf.scene);
            if(gltf.animations.length != 0) {
                const action = mixer2.clipAction(gltf.animations[0]);
                action.play();
            }
            model2 = gltf.scene;
            model2.scale.set(0.001, 0.001, 0.001);
            model2.position.set(0, 0, 0);
            anchor2.group.add(model2);
            console.log("Model 2 loaded and added to anchor 2", gltf);
        });

        const removeScanOverlay = () => {
            if (scanOverlay.parentNode) scanOverlay.parentNode.removeChild(scanOverlay);
        };

        const listener = new THREE.AudioListener();
        camera.add(listener);

        const resumeAudio = () => {
            if (listener.context.state === 'suspended') {
                listener.context.resume();
            }
        };

        const audioLoader = new THREE.AudioLoader();

        audioLoader.load("../assets/sound1.mp3", (buffer) => {
            const sound1 = new THREE.PositionalAudio(listener);
            sound1.setBuffer(buffer);
            sound1.setRefDistance(0.5); 
            sound1.setLoop(true);
            sound1.setVolume(0.8);
            anchor1.group.add(sound1);
            anchor1.onTargetFound = () => {
                removeScanOverlay();
                resumeAudio();
                sound1.play();
            };
            anchor1.onTargetLost = () => {
                sound1.pause();
            };
        });

        audioLoader.load("../assets/sound2.mp3", (buffer) => {
            const sound2 = new THREE.PositionalAudio(listener);
            sound2.setBuffer(buffer);
            sound2.setRefDistance(0.3);
            sound2.setLoop(true);
            sound2.setVolume(0.6);
            anchor2.group.add(sound2);
            anchor2.onTargetFound = () => {
                removeScanOverlay();
                resumeAudio();
                sound2.play();
            };
            anchor2.onTargetLost = () => {
                sound2.pause();
            };
        });

        await mindarThree.start();

        const clock = new THREE.Clock();
        const speed1 = 3.3/8, speed2 = 1; 

        renderer.setAnimationLoop(( time ) => {
            const delta = clock.getDelta();
            model1 && (model1.position.x = 2*Math.sin(time/1000) +1); 
            
            mixer1 && mixer1.update(delta*speed1);
            mixer2 && mixer2.update(delta*speed2);
            renderer.render(scene, camera);
        });
    }

    const stop = () => {
        renderer.setAnimationLoop(null);
        mindarThree.stop();
        renderer.dispose();

        const video = container.querySelector("video");
        if (video && video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
        }

        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        document.querySelectorAll(".mindar-ui-overlay").forEach(el => el.remove());

        mindarThree = null;
        renderer = null;
    }

    const button = document.querySelector("#startButton");
    button.addEventListener("click", () => {
        if(!isStarted) {
            start();
            isStarted = true;
            button.textContent = "Зупинити WebAR";
        }
        else {
            stop();
            isStarted = false;
            button.textContent = "Запустити WebAR";
        }
    });
});