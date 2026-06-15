import * as THREE from "three";
import * as MINDAR from "mindar_face";
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js"


document.addEventListener("DOMContentLoaded", () => {

	const start = async() => {
		const mindarThree = new MINDAR.MindARThree({
			container: document.body,
			uiLoading: "yes", uiScanning: "yes", uiError: "no",
		      });

		const {renderer, scene, camera} = mindarThree;

		const anchor_s1 = mindarThree.addAnchor(175);

		var planegeometry=new THREE.PlaneGeometry(0.1, 0.1);
		var planematerial=new THREE.MeshBasicMaterial( {color: 0x00ffff, transparent: true, opacity: 0.5} );
		var planemesh=new THREE.Mesh(planegeometry, planematerial);
		planemesh.position.x = 1.5;

		anchor_s1.group.add(planemesh);


		var light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 2.5);
		scene.add(light);

		const anchor_s2 = mindarThree.addAnchor(203);

		const loader = new GLTFLoader();

		var mixer = false, model1  = false, model2  = false, model3  = false;

		loader.load("../images/owl.glb",
			(model) => { 
				console.log("Успішна завантажена модель 1", model); 
				model.scene.scale.set(0.1, 0.1, 0.1);
				model.scene.position.set(-1, 0, 0);
				model1 = model;
				anchor_s2.group.add(model.scene);
			},		
			(xhr) => { console.log( ( xhr.loaded / xhr.total * 100 ) + "% моделі 1 завантажено"); },		
			(error) => { console.log("Помилка завантаження моделі 1"); },		
		);

		loader.load("./3d-metal-mask.glb",
			(model) => { 
				console.log("Успішна завантажена модель 2", model); 
				model.scene.scale.set(0.1, 0.1, 0.1);
				model.scene.position.set(+1, 0, 0);
				model2 = model;
				anchor_s2.group.add(model.scene);
			},		
			(xhr) => { console.log( ( xhr.loaded / xhr.total * 100 ) + "% моделі 2 завантажено"); },		
			(error) => { console.log("Помилка завантаження моделі 2"); },		
		);


		const faceMesh = mindarThree.addFaceMesh();

		const texture = new THREE.TextureLoader().load('../images/mask2.png' ); 
		faceMesh.material.map = texture;
		faceMesh.material.transparent = true;
		scene.add(faceMesh);

		const clock = new THREE.Clock();

		await mindarThree.start();
		renderer.setAnimationLoop(() => {
			const delta = clock.getDelta();
			const totaltime = clock.getElapsedTime();
			if(mixer)
				mixer.update(delta);
			if(model1)
				model1.scene.rotation.y += delta;
			if(model2)
				model2.scene.scale.set(0.1*Math.sin(totaltime/10), 0.1*Math.sin(totaltime/10), 0.1*Math.sin(totaltime/10));
	  		renderer.render(scene, camera);
		});

	}

	start();
});
