

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";


function createCamera() {
    const camera = new THREE.PerspectiveCamera(
        35, 
        window.innerWidth / window.innerHeight, 
        0.1, 
        10000,
    );

    return camera;
}

//FPS control for testing
function createControls(camera, canvas) {

    const controls = new PointerLockControls(camera, canvas);

    const moveSpeed = 3;
    let forward = false;
    let backward = false;
    let left = false;
    let right = false;
    let up = false;
    let down = false;

    controls.update = (delta) => {
        if (forward)    {
            controls.moveForward(moveSpeed * delta);
        }
        if (backward)   {
            controls.moveForward(-moveSpeed * delta);
        }
        if (left)       {
            controls.moveRight(-moveSpeed * delta);
        }
        if (right)      {
            controls.moveRight(moveSpeed * delta);
        }
        if (up)         {
            controls.getObject().position.y += moveSpeed * delta;
        }
        if (down)       {
            controls.getObject().position.y -= moveSpeed * delta;
        }
    }

    window.addEventListener("click", ()=>{
        controls.lock();
    });


    window.addEventListener("keydown", (e) => {

        switch (e.code) {
            case "KeyW":
                forward = true;     
                break;
            case "KeyS":
                backward = true;    
                break;
            case "KeyA":
                left = true;
                break;
            case "KeyD":
                right = true;
                break;
            case "Space":
                up = true;
                break;
            case "ControlLeft":
                down = true;
                break;
        }

    });

    window.addEventListener("keyup", (e) => {
        switch (e.code) {
            case "KeyW":
                forward = false;     
                break;
            case "KeyS":
                backward = false;    
                break;
            case "KeyA":
                left = false;
                break;
            case "KeyD":
                right = false;
                break;
            case "Space":
                up = false;
                break;
            case "ControlLeft":
                down = false;
                break;
        }
    });

    return controls;
}


async function loadGallery() {
    const loader = new GLTFLoader();
    const galleryData = await loader.loadAsync("/assets/richard_art_gallery.glb");
    const gallery =  galleryData.scene;
    gallery.position.set(0,0,0);
    gallery.scale.set(1,1,1);
    return gallery;
}



const scene = new THREE.Scene();
scene.background = new THREE.Color("skyblue");
const camera = createCamera();
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);


const controls = createControls(camera, renderer.domElement);




const gallery = await loadGallery();
scene.add(gallery);


window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.render(scene, camera);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update(0.01);
    renderer.render(scene, camera);
}

animate();







