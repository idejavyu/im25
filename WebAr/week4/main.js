import * as THREE from 'three';
import {MindARThree} from 'mindar-image-three';
import { GLTFLoader } from 'https://unpkg.com/three@0.153.0/examples/jsm/loaders/GLTFLoader.js';



document.addEventListener("DOMContentLoaded", () => {

    const mindarThree = new MindARThree({
	    container: document.body,
	    imageTargetSrc: "./targets.mind",
      });

    const { renderer, scene, camera } = mindarThree;

    const loader = new GLTFLoader();

    const anchor1 = mindarThree.addAnchor(0); 
    const anchor2 = mindarThree.addAnchor(1); 

    function loadModelToAnchor(url, anchor, options = {}) {
      loader.load(url, (gltf) => {
        const model = gltf.scene;
        if (options.scale) model.scale.setScalar(options.scale);
        if (options.position) model.position.set(...options.position);
        if (options.rotation) model.rotation.set(...options.rotation);
        model.traverse((n) => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; } });
        anchor.group.add(model);
      }, undefined, (err) => { console.error('GLTF load error', url, err); });
    }

    loadModelToAnchor('../assets/model1.glb', anchor1, { scale: 0.1, position: [0,0,0] });
    loadModelToAnchor('../assets/model2.glb', anchor2, { scale: 0.001, position: [0,0,0] });

    const start = async () => {
        await mindarThree.start();
        renderer.setAnimationLoop(() => {
          renderer.render(scene, camera);
        });
    };
    start();
});