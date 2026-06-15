import * as THREE from 'three';
import {MindARThree} from 'mindar-image-three';



document.addEventListener("DOMContentLoaded", () => {

    const mindarThree = new MindARThree({
	    container: document.body,
	    imageTargetSrc: "../assets/acc.mind",
      });

    const {renderer, scene, camera} = mindarThree;

    const anchor = mindarThree.addAnchor(0);
    const cube = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.5, 0.5), 
        new THREE.MeshBasicMaterial({ color: "#2862ea" })
    );
    cube.position.set(-0.5, 0, 0);

    const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.3), 
        new THREE.MeshBasicMaterial({ color: "#ff0000" })
    );
    sphere.position.set(0.5, 0, 0);

    const torus = new THREE.Mesh(
        new THREE.TorusGeometry(0.2, 0.1, 16, 100), 
        new THREE.MeshBasicMaterial({ color: "#00ff00" })
    );
    torus.position.set(0, 0.5, 0);

    anchor.group.add(cube);
    anchor.group.add(sphere);
    anchor.group.add(torus);


    const start = async() => {
        await mindarThree.start();
            renderer.setAnimationLoop(( time ) => {

            cube.rotation.x = time / 1000;
            sphere.rotation.y = time / 1000;
            torus.rotation.x = time / 1000;

                renderer.render(scene, camera);
        });
    }
    
    start();
});