import * as THREE from 'three';
import { MindARThree } from 'mindar-face-three';
import { loadGLTF } from '../lib/mylib/loader.js';

document.addEventListener("DOMContentLoaded", () => {
    const start = async () => {
        const mindarThree = new MindARThree({
            container: document.querySelector("#container"),
        });

        const { renderer, scene, camera } = mindarThree;

        const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        scene.add(light);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight.position.set(-0.5, 1, 1);
        scene.add(directionalLight);

        const occluder = await loadGLTF('../mind-ar-js-master/examples/face-tracking/assets/sparkar/headOccluder.glb');
        occluder.scene.scale.set(0.07, 0.07, 0.07);
        occluder.scene.position.set(0, -0.2, 0.15);

        const occluderMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff, colorWrite: false });
        occluder.scene.traverse((o) => {
            if (o.isMesh) {
                o.material = occluderMaterial;
            }
        });

        occluder.scene.renderOrder = 0;

        const occluderAnchor = mindarThree.addAnchor(168);
        occluderAnchor.group.add(occluder.scene);

        const hat = await loadGLTF('../mind-ar-js-master/examples/face-tracking/assets/hat2/scene.gltf');
        hat.scene.scale.set(0.01, 0.01, 0.01);
        hat.scene.position.set(0, -0.3, -0.45);
        hat.scene.renderOrder = 1;

        const hatAnchor = mindarThree.addAnchor(10);
        hatAnchor.group.add(hat.scene);

        const faceMesh = mindarThree.addFaceMesh();
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load('../mind-ar-js-master/examples/face-tracking/assets/sparkar/face-mask.png', (texture) => {
            faceMesh.material.map = texture;
            faceMesh.material.transparent = true;
            faceMesh.material.needsUpdate = true;
        });

        let maskActive = false;
        faceMesh.visible = maskActive;
        scene.add(faceMesh);

        const glasses = await loadGLTF('../mind-ar-js-master/examples/face-tracking/assets/glasses/scene.gltf');
        glasses.scene.scale.set(0.01, 0.01, 0.01);
        glasses.scene.position.set(0, 0, 0); 
        glasses.scene.visible = false;

        const glassesAnchor = mindarThree.addAnchor(168);
        glassesAnchor.group.add(glasses.scene);

        await mindarThree.start();

        const toggleVideoBtn = document.querySelector("#toggle-video-btn");
        let videoVisible = true;
        toggleVideoBtn.addEventListener("click", () => {
            videoVisible = !videoVisible;
            const video = document.querySelector("#container video");
            if (video) {
                video.style.visibility = videoVisible ? "visible" : "hidden";
            }
            toggleVideoBtn.textContent = videoVisible ? "Приховати відео" : "Показати відео";
        });

        const toggleMaskBtn = document.querySelector("#toggle-mask-btn");
        toggleMaskBtn.addEventListener("click", () => {
            maskActive = !maskActive;
            toggleMaskBtn.textContent = maskActive ? "Приховати маску" : "Показати маску";
        });

        const toggleGlassesBtn = document.querySelector("#toggle-glasses-btn");
        let glassesVisible = false;

        toggleGlassesBtn.addEventListener("click", () => {
            glassesVisible = !glassesVisible;
            glasses.scene.visible = glassesVisible;
            toggleGlassesBtn.textContent = glassesVisible ? "Приховати окуляри" : "Показати окуляри";
        });

        const toggleOccluderBtn = document.querySelector("#toggle-occluder-btn");
        let occluderDebugVisible = false;
        toggleOccluderBtn.addEventListener("click", () => {
            occluderDebugVisible = !occluderDebugVisible;
            occluder.scene.traverse((o) => {
                if (o.isMesh) {
                    o.material.colorWrite = occluderDebugVisible;
                }
            });
            toggleOccluderBtn.textContent = occluderDebugVisible ? "Приховати оклюдер" : "Показати оклюдер";
        });

        const photoBtn = document.querySelector("#photo-btn");
        photoBtn.addEventListener("click", () => {

            const video = mindarThree.video;
            const renderCanvas = renderer.domElement;
            const canvas = document.createElement('canvas');
            canvas.width = renderCanvas.width;
            canvas.height = renderCanvas.height;
            const context = canvas.getContext('2d');
            const sx = (video.clientWidth - renderCanvas.clientWidth) / 2 * video.videoWidth / video.clientWidth;
            const sy = (video.clientHeight - renderCanvas.clientHeight) / 2 * video.videoHeight / video.clientHeight;
            const sw = video.videoWidth - sx * 2;
            const sh = video.videoHeight - sy * 2;
            context.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
            renderer.preserveDrawingBuffer = true;
            renderer.render(scene, camera);
            context.drawImage(renderCanvas, 0, 0, canvas.width, canvas.height);
            context.font = "16px Arial";
            context.fillStyle = "white";
            const timestamp = new Date().toLocaleString();
            context.fillText(timestamp, 10, canvas.height - 10);
            const data = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.href = data;
            link.download = 'photo.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            renderer.preserveDrawingBuffer = false;
        });

        document.querySelector("#switch").addEventListener("click", () => {
            mindarThree.switchCamera();
        });

        renderer.setAnimationLoop(() => {
            faceMesh.visible = maskActive;
            if (faceMesh.material) faceMesh.material.visible = maskActive;

            renderer.render(scene, camera);
        });
    }

    start();
});