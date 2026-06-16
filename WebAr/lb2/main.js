import * as THREE from 'three';
import { MindARThree } from 'mindar-face-three';
import { loadGLTF } from '../lib/mylib/loader.js';

document.addEventListener("DOMContentLoaded", () => {
    const start = async () => {
        const mindarThree = new MindARThree({
            container: document.querySelector("#container"),
        });
        const { renderer, scene, camera } = mindarThree;

        // Освітлення
        scene.add(new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1));


        // Конфігурація аксесуарів
        const accessories = [
            { id: 'glasses1', name: 'Окуляри 1', url: './assets/glasses/glasses1.glb', anchor: 168, scale: 0.6, pos: [0.1, -0.2, 0], category: 'glasses' },
            { id: 'glasses2', name: 'Окуляри 2', url: './assets/glasses/glasses2.glb', anchor: 168, scale: 6, pos: [0.1, -0.2, 0], category: 'glasses' },
            { id: 'glasses3', name: 'Окуляри 3', url: './assets/glasses/glasses3.glb', anchor: 168, scale: 6, pos: [0.1, -0.2, 0], category: 'glasses' },
            { id: 'glasses4', name: 'Окуляри 4', url: './assets/glasses/glasses4.glb', anchor: 168, scale: 0.2, pos: [0, 0, 0], category: 'glasses' },
            { id: 'glasses5', name: 'Окуляри 5', url: './assets/glasses/glasses5.glb', anchor: 168, scale: 0.7, pos: [0.1, -0.2, 0], category: 'glasses' },
            { id: 'hat1', name: 'Капелюх 1', url: './assets/hats/hat1.glb', anchor: 10, scale: 3, pos: [-2, -2, 0], category: 'hat' },
            { id: 'hat2', name: 'Капелюх 2', url: './assets/hats/hat2.glb', anchor: 10, scale: 3, pos: [-1, -2, 0], category: 'hat' },
            { id: 'hat3', name: 'Капелюх 3', url: './assets/hats/hat3.glb', anchor: 10, scale: 1, pos: [-1.8, -1.2, 0], category: 'hat' },
            { id: 'hat4', name: 'Капелюх 4', url: './assets/hats/hat4.glb', anchor: 10, scale: 2, pos: [-2, -0.5, 0], category: 'hat' },
            { id: 'hat5', name: 'Капелюх 5', url: './assets/hats/hat5.glb', anchor: 10, scale: 1, pos: [0, -0.3, 0], category: 'hat' },
            { id: 'hat6', name: 'Капелюх 6', url: './assets/hats/hat6.glb', anchor: 10, scale: 1, pos: [0, -0.3, 0], category: 'hat' }
        ];

        const models = {};
        const activeModels = { glasses: null, hat: null };

        // 1. Завантаження аксесуарів
        for (const item of accessories) {
            try {
                console.log(`Починаю завантаження: ${item.name} (${item.url})`);

                const gltf = await loadGLTF(item.url);
                const model = gltf.scene;

                model.scale.set(item.scale, item.scale, item.scale);
                model.position.set(...item.pos);
                model.visible = false;

                model.traverse((o) => {
                    if (o.isMesh) {
                        o.renderOrder = 2;
                    }
                });

                const anchor = mindarThree.addAnchor(item.anchor);
                anchor.group.add(model);
                models[item.id] = model;

                console.log(`✅ Успішно завантажено: ${item.id}`);
            } catch (error) {
                console.error(`❌ Помилка при завантаженні ${item.id} за адресою ${item.url}:`, error);
            }
        }

        console.groupEnd(); // Закриваємо групу
        console.log("Всі доступні моделі:", models);

        // 2. Оклюдер (для реалістичності)
        const occluder = await loadGLTF('../mind-ar-js-master/examples/face-tracking/assets/sparkar/headOccluder.glb');
        occluder.scene.scale.set(0.07, 0.07, 0.07);
        occluder.scene.position.set(0, -0.2, 0.15);
        occluder.scene.traverse(o => {
            if (o.isMesh) {
                o.material = new THREE.MeshBasicMaterial({ colorWrite: false });
                o.renderOrder = 0; // Оклюдер малюється першим
            }
        });
        mindarThree.addAnchor(168).group.add(occluder.scene);

        await mindarThree.start();

        // 3. Логіка вибору моделей
        window.selectModel = (category, id) => {
            if (activeModels[category]) activeModels[category].visible = false;
            if (id && models[id]) {
                models[id].visible = true;
                activeModels[category] = models[id];
            } else {
                activeModels[category] = null;
            }
        };

        // Заповнення списків
        const glassesSelect = document.querySelector("#glasses-select");
        const hatSelect = document.querySelector("#hat-select");
        accessories.forEach(item => {
            const opt = document.createElement('option');
            opt.value = item.id;
            opt.textContent = item.name;

            if (item.category === 'glasses') {
                glassesSelect.appendChild(opt);
            } else if (item.category === 'hat') {
                hatSelect.appendChild(opt);
            }
        });

        // 4. Web Share API
        document.querySelector("#share-btn").addEventListener("click", async () => {
            renderer.render(scene, camera);
            const dataUrl = renderer.domElement.toDataURL("image/png");
            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], "tryon.png", { type: "image/png" });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({ files: [file], title: 'Примірка', text: 'Оціни мій образ!' });
            } else {
                alert("Ваш браузер не підтримує Web Share.");
            }
        });

        renderer.setAnimationLoop(() => renderer.render(scene, camera));
    };
    start();
});