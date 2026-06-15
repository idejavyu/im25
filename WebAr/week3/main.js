import * as THREE from 'three';
import {MindARThree} from 'mindar-image-three';



document.addEventListener("DOMContentLoaded", () => {

    const mindarThree = new MindARThree({
	    container: document.body,
	    imageTargetSrc: "../assets/acc.mind",
      });

    const { renderer, scene, camera } = mindarThree;
    const anchor = mindarThree.addAnchor(0);
    const textureLoader = new THREE.TextureLoader();

    const materials = [
        new THREE.MeshBasicMaterial({ map: textureLoader.load("../assets/cube1.png") }),
        new THREE.MeshBasicMaterial({ map: textureLoader.load("../assets/cube2.png") }),
        new THREE.MeshBasicMaterial({ map: textureLoader.load("../assets/cube3.png") }),
        new THREE.MeshBasicMaterial({ map: textureLoader.load("../assets/cube4.jpg") }),
        new THREE.MeshBasicMaterial({ map: textureLoader.load("../assets/cube5.jpg") }),
        new THREE.MeshBasicMaterial({ map: textureLoader.load("../assets/cube6.png") })
    ];
    const cube = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), materials);

    cube.position.set(-0.5, 0, 0);
    const githubTexture = textureLoader.load("https://raw.githubusercontent.com/HybridShivam/Pokemon/refs/heads/master/assets/images/0003.png");
    const capsule = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.2, 0.5, 4, 8),
        new THREE.MeshBasicMaterial({ map: githubTexture })
    );
    capsule.position.set(0.5, 0, 0);

    const externalTexture = textureLoader.load("https://i.imgur.com/uy3jkz4.jpeg");
    const circle = new THREE.Mesh(
        new THREE.CircleGeometry(0.4, 32),
        new THREE.MeshBasicMaterial({ map: externalTexture, side: THREE.DoubleSide })
    );
    circle.position.set(0, 0.5, 0);

    anchor.group.add(cube);
    anchor.group.add(capsule);
    anchor.group.add(circle);


    const start = async () => {
        await mindarThree.start();
        renderer.setAnimationLoop((time) => {

            cube.rotation.x = time / 1000;
            cube.rotation.y = time / 1000;

            const scale = 0.5 + 0.5 * Math.sin(time / 500);
            capsule.scale.set(scale, scale, scale);

            circle.position.z = Math.sin(time / 500) * 0.5;

            renderer.render(scene, camera);
        });
    };
    start();
});