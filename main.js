

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";




function createCamera() {
    const camera = new THREE.PerspectiveCamera(
        35, 
        window.innerWidth / window.innerHeight, 
        0.1, 
        10000,
    );

    return camera;
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
scene.background = "purple";
const camera = createCamera();
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);

const gallery = await loadGallery();
scene.add(gallery);




function animate() {
    requestAnimationFrame(animate);

    renderer.render(scene, camera);
}

animate();







