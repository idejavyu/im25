import * as THREE from 'https://unpkg.com/three@0.153.0/build/three.module.js';
import { ARButton } from 'https://unpkg.com/three@0.153.0/examples/jsm/webxr/ARButton.js';

// Глобальні змінні сцени та AR
let camera, scene, renderer; // камера, сцена та рендерер Three.js
let reticle, controller;     // маркер для розміщення та контролер вибору
let mazeRoot = null;         // кореневий об'єкт для всього лабіринту

// Параметри решітки лабіринту
const GRID_SIZE = 11; // розмір сітки
const CELL = 0.15;    // розмір однієї клітинки
let grid = [];        // матриця: 0 = прохід, 1 = стіна
let startCell = [0, 0], goalCell = [GRID_SIZE-1, GRID_SIZE-1]; // початкова та цільова клітинки

// Ініціалізація та запуск циклу анімації
init();
animate();

// Функція ініціалізації сцени, рендерера та UI
function init(){
  // Створюємо сцену та камеру
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.01, 20);

  // Налаштовуємо WebGL рендерер з прозорим фоном (alpha:true) для AR overlay
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha:true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true; // вмикаємо WebXR
  document.body.appendChild(renderer.domElement);

  // Додаємо AR-кнопку, яка запитує функцію hit-test (без маркерів)
  document.body.appendChild(ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] }));

  // Кільце, яке показує місце розміщення лабіринту на поверхні
  reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.06, 0.07, 32).rotateX(-Math.PI/2),
    new THREE.MeshBasicMaterial({color:0x00ff00})
  );
  reticle.matrixAutoUpdate = false; // позиція задається матрицею з hit-test
  reticle.visible = false;
  scene.add(reticle);

  // Контролер для обробки події 'select' (натиск на екран/вибір)
  controller = renderer.xr.getController(0);
  controller.addEventListener('select', onSelect);
  scene.add(controller);

  // Обробник зміни розміру вікна
  window.addEventListener('resize', onWindowResize);

  // Підключаємо кнопки UI до функцій
  document.getElementById('btn-place').onclick = () => setStatus('Tap a plane in AR to place the maze');
  document.getElementById('btn-a').onclick = () => runPathfinder('astar');
  document.getElementById('btn-d').onclick = () => runPathfinder('dijkstra');
  document.getElementById('btn-rl').onclick = async () => { await trainAndApplyRL(); };
}

// Допоміжна функція для відображення статусу у UI
function setStatus(t){ document.getElementById('status').innerText = t; }

// Налаштування hit-test після старту сесії WebXR
renderer.xr.addEventListener('sessionstart', async () => {
  // Отримуємо сесію, простір "viewer" та джерело hit-test для виявлення поверхонь
  const session = renderer.xr.getSession();
  const viewerSpace = await session.requestReferenceSpace('viewer');
  const hitTestSource = await session.requestHitTestSource({ space: viewerSpace });

  // Встановлюємо кастомний animation loop, щоб використовувати кадри з WebXR frame
  renderer.setAnimationLoop((time, frame) => {
    if (frame) {
      const referenceSpace = renderer.xr.getReferenceSpace();
      const hitTestResults = frame.getHitTestResults(hitTestSource);
      if (hitTestResults.length > 0) {
        const hit = hitTestResults[0];
        const pose = hit.getPose(referenceSpace);
        // Розміщуємо коло у позі поверхні
        reticle.visible = true;
        reticle.matrix.fromArray(pose.transform.matrix);
      } else {
        reticle.visible = false;
      }
    }
    // Рендеримо сцену
    renderer.render(scene, camera);
  });
});

// Обробник вибору (select): розміщує лабіринт у поточному положенні кола
function onSelect(){
  if (!reticle.visible) return; // нічого не робимо, якщо коло невидиме
  if (mazeRoot) { scene.remove(mazeRoot); mazeRoot = null; } // очистити попередній лабіринт
  mazeRoot = new THREE.Object3D();
  // Застосувати матрицю кола до кореня лабіринту, щоб лабіринт розташувався на поверхні
  mazeRoot.applyMatrix4(reticle.matrix);
  scene.add(mazeRoot);
  buildRandomMaze(); // створюємо випадковий лабіринт у матриці grid
  renderMaze();      // відмалювати лабіринт у сцені
  setStatus('Maze placed. Use buttons to run algorithms.');
}

// Генеруємо простий випадковий лабіринт у вигляді сітки
function buildRandomMaze(){
  // Ініціалізуємо матрицю GRID_SIZE x GRID_SIZE нулями
  grid = new Array(GRID_SIZE).fill(0).map(()=>new Array(GRID_SIZE).fill(0));
  // Робимо рамку стін по краях
  for(let i=0;i<GRID_SIZE;i++){
    grid[0][i]=1; grid[GRID_SIZE-1][i]=1;
    grid[i][0]=1; grid[i][GRID_SIZE-1]=1;
  }
  // Додаємо випадкові внутрішні стіни з ймовірністю 0.25
  for(let r=1;r<GRID_SIZE-1;r++){
    for(let c=1;c<GRID_SIZE-1;c++){
      if (Math.random() < 0.25) grid[r][c] = 1;
    }
  }
  // Встановлюємо старт і ціль в кутку (звільняємо їх від стін)
  startCell = [1,1];
  goalCell = [GRID_SIZE-2, GRID_SIZE-2];
  grid[startCell[0]][startCell[1]] = 0;
  grid[goalCell[0]][goalCell[1]] = 0;
}

// Візуалізація лабіринту у Three.js
function renderMaze(path){
  // Очищаємо дочірні об'єкти попереднього mazeRoot
  while(mazeRoot.children.length) mazeRoot.remove(mazeRoot.children[0]);

  const g = new THREE.Group();
  // Проходимо по всіх клітинках і створюємо або кубик (стіну) або плитку (прохід)
  for(let r=0;r<GRID_SIZE;r++){
    for(let c=0;c<GRID_SIZE;c++){
      const x = (c - (GRID_SIZE-1)/2) * CELL;
      const z = (r - (GRID_SIZE-1)/2) * CELL;
      if (grid[r][c] === 1){
        // Стіна — невеликий куб
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(CELL*0.9, CELL*0.9, CELL*0.9),
          new THREE.MeshPhongMaterial({color:0x3333aa})
        );
        box.position.set(x, CELL*0.45, z);
        g.add(box);
      } else {
        // Прохід — плоска плитка на підлозі
        const plane = new THREE.Mesh(
          new THREE.PlaneGeometry(CELL*0.95, CELL*0.95),
          new THREE.MeshBasicMaterial({color:0xeeeeee})
        );
        plane.rotateX(-Math.PI/2);
        plane.position.set(x, 0.001, z);
        g.add(plane);
      }
    }
  }

  // Маркери старту (зелений) та цілі (червоний) — пласкі циліндри
  const s = new THREE.Mesh(new THREE.CylinderGeometry(CELL*0.2, CELL*0.0, 0.02, 12),
    new THREE.MeshBasicMaterial({color:0x00ff00}));
  s.rotateX(-Math.PI/2);
  s.position.set((startCell[1]-(GRID_SIZE-1)/2)*CELL, 0.02, (startCell[0]-(GRID_SIZE-1)/2)*CELL);
  g.add(s);

  const gg = new THREE.Mesh(new THREE.CylinderGeometry(CELL*0.2, CELL*0.0, 0.02, 12),
    new THREE.MeshBasicMaterial({color:0xff0000}));
  gg.rotateX(-Math.PI/2);
  gg.position.set((goalCell[1]-(GRID_SIZE-1)/2)*CELL, 0.02, (goalCell[0]-(GRID_SIZE-1)/2)*CELL);
  g.add(gg);

  // Якщо передали шлях, то накреслимо лінію по центрах клітин шляху
  if (path){
    const mat = new THREE.LineBasicMaterial({color:0xffff00, linewidth:4});
    const pts = path.map(([r,c]) => new THREE.Vector3((c-(GRID_SIZE-1)/2)*CELL, 0.03, (r-(GRID_SIZE-1)/2)*CELL));
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const line = new THREE.Line(geo, mat);
    g.add(line);
  }

  // Додаємо просте освітлення до групи
  const light = new THREE.DirectionalLight(0xffffff, 0.8);
  light.position.set(1,2,1);
  g.add(light);

  // Додаємо сформовану групу до кореня лабіринту
  mazeRoot.add(g);
}

// Функція повертає список допустимих 4-напрямкових сусідів для клітинки (р,с)
function neighbors(r,c){
  const out = [];
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]]; // вниз, вгору, вправо, вліво
  for(const [dr,dc] of dirs){
    const nr=r+dr, nc=c+dc;
    // Перевіряємо межі матриці та чи не є сусід стіною
    if (nr>=0 && nr<GRID_SIZE && nc>=0 && nc<GRID_SIZE && grid[nr][nc]===0) out.push([nr,nc]);
  }
  return out;
}

// Манхеттенська евристика для A* (підходить для 4-напрямкового руху)
function heuristic(a,b){
  return Math.abs(a[0]-b[0]) + Math.abs(a[1]-b[1]);
}

// Запуск алгоритмів пошуку (A* або Dijkstra) та відображення результату
function runPathfinder(mode){
  if (!mazeRoot){ setStatus('Place maze first'); return; }
  let path = null;
  if (mode==='astar') path = astar(startCell, goalCell);
  else path = dijkstra(startCell, goalCell);
  if (path){ renderMaze(path); setStatus(mode + ' found path length=' + path.length); }
  else setStatus(mode + ' found no path');
}

// Реалізація A* пошуку на гріду
function astar(start, goal){
  const startKey = key(start);
  const open = new TinyPQ((a,b)=>a.f - b.f); // пріоритетна черга за f = g + h
  const came = new Map();                   // для відновлення шляху: came[childKey] = parentCell
  const gscore = new Map();                 // gscore[key] = найкращий відомий g (вартість від старту)
  gscore.set(startKey, 0);
  // Пушимо початкову позицію з оцінкою f = heuristic (g=0)
  open.push({pos:start, f:heuristic(start,goal)});
  const closed = new Set(); // множина оброблених вузлів
  while(open.size()){
    const cur = open.pop().pos;
    const ck = key(cur);
    if (closed.has(ck)) continue;
    // Якщо поточний вузол — ціль, реконструюємо шлях
    if (cur[0]===goal[0] && cur[1]===goal[1]) return reconstruct(came, cur);
    closed.add(ck);
    // Для кожного сусіда оновлюємо g та f при потребі
    for(const nb of neighbors(cur[0], cur[1])){
      const nk = key(nb);
      const tentative = gscore.get(ck) + 1; // вага ребра = 1
      if (!gscore.has(nk) || tentative < gscore.get(nk)){
        came.set(nk, cur);
        gscore.set(nk, tentative);
        const f = tentative + heuristic(nb, goal);
        open.push({pos:nb, f});
      }
    }
  }
  // якщо черга пуста і шлях не знайдено
  return null;
}

// Реалізація алгоритму Дейкстри 
function dijkstra(start, goal){
  const dist = new Map();  // найменша відома відстань від старту до ключа
  const prev = new Map();  // для відновлення шляху
  const pq = new TinyPQ((a,b)=>a.dist - b.dist);
  pq.push({pos:start, dist:0});
  dist.set(key(start), 0);
  const visited = new Set();
  while(pq.size()){
    const cur = pq.pop().pos;
    const ck = key(cur);
    if (visited.has(ck)) continue;
    visited.add(ck);
    if (cur[0]===goal[0] && cur[1]===goal[1]) return reconstruct(prev, cur);
    for(const nb of neighbors(cur[0], cur[1])){
      const nk = key(nb);
      const nd = dist.get(ck) + 1; // вага ребра = 1
      if (!dist.has(nk) || nd < dist.get(nk)){
        dist.set(nk, nd);
        prev.set(nk, cur);
        pq.push({pos:nb, dist:nd});
      }
    }
  }
  return null;
}

// Відновлення шляху з мапи came/prev: повертає масив координат від старту до цілі
function reconstruct(came, cur){
  const path = [cur.slice()];
  while(true){
    const k = key(cur);
    if (!came.has(k)) break;
    cur = came.get(k);
    path.push(cur.slice());
  }
  return path.reverse();
}

// Допоміжна функція для створення рядкового ключа для клітинки
function key([r,c]){ return `${r},${c}`; }

// Проста реалізація пріоритетної черги (бінарна купа)
function TinyPQ(cmp){
  const data=[];
  // Додавання елементу та просіювання вгору
  this.push = (v)=>{ data.push(v); siftUp(data.length-1); };
  // Видалення верхнього елементу (мінімального за cmp)
  this.pop = ()=>{ if(data.length===0) return null; const top=data[0]; const last=data.pop(); if(data.length) { data[0]=last; siftDown(0); } return top; };
  this.size = ()=>data.length;
  const parent = i=>((i-1)>>1);
  const left = i=>((i<<1)+1);
  const right = i=>((i<<1)+2);
  const siftUp = i=>{ while(i>0){ const p=parent(i); if(cmp(data[i], data[p])<0){ [data[i],data[p]]=[data[p],data[i]]; i=p; } else break; } };
  const siftDown = i=>{ while(true){ const l=left(i), r=right(i); let m=i; if(l<data.length && cmp(data[l], data[m])<0) m=l; if(r<data.length && cmp(data[r], data[m])<0) m=r; if(m!==i){ [data[i],data[m]]=[data[m],data[i]]; i=m; } else break; } };
}

// Q-learning: табличне навчання агента у симульованому лабіринті
// Мета: навчити політику, яка веде з startCell до goalCell, використовуючи простий табличний Q
async function trainAndApplyRL(){
  if (!mazeRoot){ setStatus('Place maze first'); return; }
  setStatus('Training RL...');
  // Створюємо список усіх прохідних станів та їх індексацію
  const states = [];
  const sIndex = {};
  for(let r=0;r<GRID_SIZE;r++) for(let c=0;c<GRID_SIZE;c++) if(grid[r][c]===0){
    const k = key([r,c]); sIndex[k]=states.length; states.push([r,c]);
  }
  const n = states.length;
  // Доступні дії: вниз, вгору, вправо, вліво (чотири напрямки)
  const actions = [[1,0],[-1,0],[0,1],[0,-1]];
  // Гіперпараметри Q-learning (можна налаштувати)
  const alpha=0.6, gamma=0.95, epsStart=0.9, epsEnd=0.1, episodes=800;
  const Q = Array.from({length:n}, ()=> new Array(actions.length).fill(0)); // таблиця Q[stateIdx][actionIdx]

  // Епсилон-жадібний вибір дії
  function choose(sIdx, eps){
    if (Math.random() < eps) return Math.floor(Math.random()*actions.length);
    const row = Q[sIdx];
    let best = 0, bi=0;
    for(let i=0;i<row.length;i++) if(row[i]>best){ best=row[i]; bi=i; }
    return bi;
  }

  // Основний цикл навчання: епізоди з початку в startCell
  for(let ep=0; ep<episodes; ep++){
    // Лінійне зниження eps від epsStart до epsEnd
    let eps = epsStart - (epsStart-epsEnd)*(ep/episodes);
    let s = startCell.slice();
    let sIdx = sIndex[key(s)];
    for(let step=0; step<500; step++){
      const a = choose(sIdx, eps);
      const npos = [s[0]+actions[a][0], s[1]+actions[a][1]];
      let reward = -0.01; // невелика штрафна за крок (щоб заохотити короткі шляхи)
      // Якщо дія веде за межі або в стіну — караємо і залишаємося в тій самій позиції
      if(!(npos[0]>=0 && npos[0]<GRID_SIZE && npos[1]>=0 && npos[1]<GRID_SIZE) || grid[npos[0]][npos[1]]===1){
        reward = -0.2;
        var s2 = s;
      } else {
        var s2 = npos;
        if (s2[0]===goalCell[0] && s2[1]===goalCell[1]) reward = 1.0; // велика винагорода за досягнення цілі
      }
      const s2k = key(s2);
      const s2Idx = sIndex[s2k];
      const qsa = Q[sIdx][a];
      const maxq = s2Idx!==undefined ? Math.max(...Q[s2Idx]) : 0;
      // Оновлення Q за формулою Беллмана
      Q[sIdx][a] = qsa + alpha*(reward + gamma*maxq - qsa);
      // Якщо досягли цілі — завершуємо епізод
      if (s2[0]===goalCell[0] && s2[1]===goalCell[1]) break;
      s = s2; sIdx = s2Idx;
    }
  }

  // Після навчання дістаємо жадібну політику та будуємо шлях від старту
  const path = [];
  let cur = startCell.slice();
  const seen = new Set();
  for(let steps=0; steps<500; steps++){
    path.push(cur.slice());
    if (cur[0]===goalCell[0] && cur[1]===goalCell[1]) break;
    const idx = sIndex[key(cur)];
    if (idx===undefined) break;
    const row = Q[idx];
    let best = 0, bi=0;
    for(let i=0;i<row.length;i++) if(row[i]>best){ best=row[i]; bi=i; }
    const acts = [[1,0],[-1,0],[0,1],[0,-1]];
    const nxt = [cur[0]+acts[bi][0], cur[1]+acts[bi][1]];
    const k = key(nxt);
    // Якщо політика зациклилась — переривати
    if (seen.has(k)) break;
    seen.add(k);
    cur = nxt;
  }
  // Візуалізуємо отриманий шлях
  renderMaze(path);
  setStatus('RL applied, path length ~' + path.length);
}

// Обробник зміни розміру вікна: оновлюємо камеру та розмір рендерера
function onWindowResize(){ camera.aspect = window.innerWidth/window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); }

// Запускаємо анімаційний цикл рендерера (за замовчуванням для non-AR fallback)
// В AR режимі ми замінюємо animation loop при sessionstart, але ця функція корисна коли AR немає
function animate(){ renderer.setAnimationLoop(()=> renderer.render(scene, camera)); }