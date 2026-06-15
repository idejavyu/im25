import * as THREE from 'three';

document.addEventListener("DOMContentLoaded", () => {
    const scene = new THREE.Scene();

    const geometry = new THREE.BoxGeometry(2, 0.5, 1);
    const material = new THREE.MeshBasicMaterial({color: "#bb58cc"});
    const cube = new THREE.Mesh(geometry, material);

    cube.position.set(0, 2, -3);
    cube.rotation.set(0, Math.PI/2, 0);
    scene.add(cube);
    
    const camera = new THREE.PerspectiveCamera();
    camera.position.set(1, 3, 5);

    const renderer = new THREE.WebGLRenderer({alpha: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.render(scene, camera);

    const video = document.createElement("video");

    navigator.mediaDevices.getUserMedia({video:true})
        .then((stream) => {
            video.srcObject = stream;
            video.play();
        });

    video.style.position = "absolute";
    video.style.width = renderer.domElement.width;
    video.style.height = renderer.domElement.height;
    renderer.domElement.style.position = "absolute";

    document.body.appendChild(video);

    function animate( time ) {
        cube.rotation.x = time / 2000;
        cube.rotation.y = time / 1000;
        renderer.render( scene, camera );
    }
    renderer.setAnimationLoop( animate );

    document.body.appendChild(renderer.domElement);
});