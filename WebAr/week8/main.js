import * as THREE from 'three';
import {MindARThree} from 'mindar-face-three';



document.addEventListener("DOMContentLoaded", () => {

    const start = async() => {
        
        const mindarThree = new MindARThree({
            container: document.body,
            uiScanning: "yes",
            uiLoading: "yes",
        });

        const {scene, camera, renderer} = mindarThree;
        const geometry = new THREE.SphereGeometry(0.01, 24, 8);
        const material = new THREE.MeshBasicMaterial({color: 0x78a8f5,
        transparent: true, opacity: 0.5});
        
        const spheres = [];
        
        for(let i = 0; i < 468; i++) {
            spheres.push(new THREE.Mesh(geometry, material));
        }
        
        const anchors = [];

        for(let i = 0; i < 468; i++) {
            anchors.push(mindarThree.addAnchor(i));
        }
        
        for(let i = 0; i < 468; i++) {
            anchors[i].group.add(spheres[i]);
        }
        
        await mindarThree.start();

        renderer.setAnimationLoop(( time ) => {
            renderer.render(scene, camera);
        });
    }

    window.flipflop = () => {
        const video = document.querySelector("video");
        const button = document.querySelector("#flipflop");

        if (video.style.visibility === "hidden") {
            video.style.visibility = "visible";
            button.innerHTML = "VR";
        } else {
            video.style.visibility = "hidden";
            button.innerHTML = "AR";
        }
    }
    start();
});