
"use strict";

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer";
import gsap from "gsap";


const cameraHeight = 1.8;


function createCamera() {
    const camera = new THREE.PerspectiveCamera(
        60, 
        window.innerWidth / window.innerHeight, 
        0.1, 
        1000,
    );
    camera.position.set(2, cameraHeight, 0);

    return camera;
}


class Controls {
    constructor(camera, canvas) {
        this.camera = camera;
        this.canvas = canvas;

        this.sensitivity = 0.005;

        this.maxPolarAngle = Math.PI;
        this.minPolarAngle = 0;

        this.newPos = new THREE.Vector3(0, cameraHeight, 0);

        //A circle incdicating the new position camera will move to when double clicked
        this.posIndicator = new THREE.Mesh(new THREE.SphereGeometry(0.2), 
                                           new THREE.MeshBasicMaterial({color: "white"}));
        this.raycaster = new THREE.Raycaster();
        this.raycaster.far = 10;

        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseDoubleClick = this.onMouseDoubleClick.bind(this);

        this.canvas.addEventListener('mousedown', this.onMouseDown, false);
        this.canvas.addEventListener('mouseup', this.onMouseUp, false);
        this.canvas.addEventListener('mousemove', this.onMouseMove, false);
        this.canvas.addEventListener('dblclick', this.onMouseDoubleClick, false);

        this.mouseDown = false;
        this.mousePos = new THREE.Vector2();

    }

    getPosIndicator(){
        return this.posIndicator;
    }

    onMouseDown() {
        this.mouseDown = true;
    }

    onMouseUp() {
        this.mouseDown = false;
    }


    //return a intersection point with the floor, or null
    getFloorIntersection() {

        this.raycaster.setFromCamera(this.mousePos, this.camera);
        const intersectPoints = this.raycaster.intersectObject(gallery, true);

        //No intersect
        if (intersectPoints.length == 0) return null;

        let name;
        for (let i=0; i<intersectPoints.length; i++) {
            name = intersectPoints[i].object.name;

            if (name == "floor") {
                //set new Position and lerp to it in update
                return intersectPoints[i].point;
            }
            //Hit other objects
            else {
                return null;
            }

        }
    }

    //update posIndicator's position
    updatePosIndicator() {
        let pos = this.getFloorIntersection();
        if (pos == null) {
            //hide the indicator
            this.posIndicator.visible = false;
        }
        //update the indicator position
        else {
            //update its position and make it visible
            this.posIndicator.position.copy(pos);
            this.posIndicator.visible = true;
        }
    }

    rotateCamera(event) {
        if (!this.mouseDown) {
            return;
        }

        const deltaX = event.movementX || 0;
        const deltaY = event.movementY || 0;

        let euler = new THREE.Euler(0, 0, 0, 'YXZ');
        euler.setFromQuaternion(this.camera.quaternion);

        // Rotate the camera based on mouse movement
        euler.y -= deltaX * this.sensitivity;
        euler.x -= deltaY * this.sensitivity;
        const halfPi = Math.PI / 2;
        euler.x = Math.max(halfPi - this.maxPolarAngle, 
                            Math.min(halfPi - this.minPolarAngle, euler.x));

        this.camera.quaternion.setFromEuler(euler);
    }

    onMouseMove(event) {
        //update mouse position
        this.mouseMoving = true;
        this.mousePos.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mousePos.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        this.rotateCamera(event);
    }

    onMouseDoubleClick(event) {
        let mousePoint = new THREE.Vector2();
        mousePoint.x = (event.clientX / window.innerWidth) * 2 - 1;
        mousePoint.y = -(event.clientY / window.innerHeight) * 2 + 1;

        let pos = this.getFloorIntersection(mousePoint);
        if (pos != null){
            pos.y = cameraHeight;

            //Smooth camera movement with gsap
            gsap.to(camera.position, {
                x: pos.x, y: pos.y, z: pos.z, duration: 3, ease: "power1.inOut"
            });
        }
    }

    update(delta) {
        this.updatePosIndicator();
    }

    dispose() {
        this.domElement.removeEventListener('mousedown', this.onMouseDown, false);
        this.domElement.removeEventListener('mouseup', this.onMouseUp, false);
        this.domElement.removeEventListener('mousemove', this.onMouseMove, false);
        this.domElement.removeEventListener('dbclick', this.onMouseDoubleClick, false);
    }
}



function createLoadingManager() {
    const loadingManager = new THREE.LoadingManager();

    const progressBar = document.getElementById("progress-bar");
    const progressBarContainer = document.querySelector(".progress-bar-container");

    loadingManager.onProgress = function (url, loaded, total) {
        progressBar.value = (loaded / total) * 100;
    }
    loadingManager.onLoad = function () {
        progressBarContainer.style.display = "none";
    }
    return loadingManager;
}

async function loadGallery() {

    const loader = new GLTFLoader(createLoadingManager());
    const galleryData = await loader.loadAsync("assets/gallery_fixed.glb");
    const gallery = galleryData.scene;

    
    //const animation = galleryData.animations[0];
    //const mixer = new THREE.AnimationMixer(gallery);
    //const action = mixer.clipAction(animation);
    //action.play();
    //gallery.update = (delta) => mixer.update(delta);

    
    const hotspots = new THREE.Group();
    hotspots.name = "hotspots";
    gallery.traverse((object) => {
        //Apply anisotropic filtering 
        const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
        if (object.isMesh && object.material.map !== null) {
            object.material.map.anisotropy = maxAnisotropy;
        }
        //Create hotspot
        if (object.name.includes("Point")) {
            const hotspotObject = createHotspot(object.position);
            hotspotObject.name = object.name;
            hotspots.add(hotspotObject);
        }
    });

    hotspots.update = () => {
        hotspots.children.forEach((hotspot) => {
            hotspot.update();
        });
    }
    gallery.add(hotspots);

    gallery.update = () => {
        gallery.getObjectByName("hotspots").update();
    }

    gallery.position.set(0,0,0);
    
    return gallery;
}

function createCube(pos) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({color:'white'});
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(pos.x, pos.y, pos.z);
    return cube;
}


function createUI() {
    const settingContainer = document.createElement('div');
    settingContainer.style.position = 'absolute';
    settingContainer.style.top = '0';
    settingContainer.style.left = '0';
    document.body.appendChild(settingContainer);

    const settingElement = document.createElement('img');
    settingElement.src = 'assets/settings.png';
    settingElement.style.width = '80px'; 
    settingElement.style.height = '80px'; 
    settingElement.style.position = 'absolute';
    settingContainer.appendChild(settingElement);

    settingElement.addEventListener('click', () => {
        console.log('Setting:');
      });
}

function createHotspot(position) {
    // Create a 2D hotspot container
    const hotspotContainer = document.createElement('div');
    hotspotContainer.style.position = 'absolute';
    hotspotContainer.style.top = '0';
    hotspotContainer.style.left = '0';
    document.body.appendChild(hotspotContainer);
  
    // Create a 2D hotspot element with an image
    const hotspotElement = document.createElement('img');
    hotspotElement.src = 'assets/info.jpg'; 
    hotspotElement.style.width = '20px'; 
    hotspotElement.style.height = '20px'; 
    hotspotElement.style.position = 'absolute';
    hotspotContainer.appendChild(hotspotElement);
    

    // Handle click event on the hotspot
    hotspotElement.addEventListener('click', () => {
        // Perform actions when the hotspot is clicked
        //console.log('Hotspot clicked at position:', position);
        //createInfoPopup("assets/TEST.pdf");
        //createWebpagePopup("https://www.google.com/search?igu=1");
        //createWebpagePopup("https://player.vimeo.com/video/898267263?h=f959a63df0&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479");
        createInfoPopup("assets/big_buck_bunny.mp4");
        //createInfoPopup("https://player.vimeo.com/video/898267263?h=f959a63df0&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479");
    });

    const hotspotObject = new CSS2DObject(hotspotContainer);
    hotspotObject.position.set(position.x, position.y, position.z);

    hotspotObject.update = () => {
        const raycaster = new THREE.Raycaster();
        const d = camera.position.distanceTo(position);
        if (d > 15) {
            hotspotObject.visible = false;
            return;
        }
        const dir = new THREE.Vector3();
        dir.copy(position).sub(camera.position).normalize();
        raycaster.set(camera.position, dir);
        const intersects = raycaster.intersectObjects(scene.children, true);
        
        if (intersects.length > 0 && intersects[0].distance - d > 0) {
            hotspotObject.visible = true;
        }
        else {
            hotspotObject.visible = false;
        }
    }
  
    return hotspotObject;
}

function createInfoPopup(url) {
    const infoPopup = document.createElement('div');
    infoPopup.id = 'info-popup';
    infoPopup.style.position = 'absolute';
    //infoPopup.style.paddingBottom = '56.25%';
    infoPopup.style.maxWidth = '100%';
    infoPopup.style.height = 'auto';
    infoPopup.style.top = '50%';
    infoPopup.style.left = '50%';
    infoPopup.style.transform = 'translate(-50%, -50%)'; // Center horizontally and vertically
    infoPopup.style.width = '66.67vw'; 
    infoPopup.style.height = '37.5vw';
    infoPopup.style.overflow = 'hidden';
    infoPopup.style.transition = 'opacity 0.3s ease-in-out';
    infoPopup.style.opacity = '0'; // Start with opacity 0
    infoPopup.style.zIndex = '1000';

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none'; 
    iframe.src = url;
    iframe.allow = 'autoplay; fullscreen; picture-in-picture';

    const closeBtn = document.createElement('span');
    closeBtn.id = 'close-button';
    closeBtn.textContent = 'X';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '10px';
    closeBtn.style.right = '10px'; 
    closeBtn.style.fontSize = '25px';
    closeBtn.style.color = 'grey';
    closeBtn.style.zIndex = '1001';  
    closeBtn.style.cursor = 'pointer';
    closeBtn.addEventListener('click', closeInfoPopup);


    infoPopup.appendChild(closeBtn);
    infoPopup.appendChild(iframe);
    document.body.appendChild(infoPopup);

    // Triggering reflow to enable transition on initial render
    infoPopup.offsetHeight;

    // Set the timeout to allow for CSS transitions
    setTimeout(() => {
        infoPopup.style.opacity = '1'; // Fade in
    }, 10);
}
function closeInfoPopup() {
    const infoPopup = document.getElementById('info-popup');

    // Slide out
    infoPopup.style.opacity = '0';

    // Remove the info popup after the transition ends
    infoPopup.addEventListener('transitionend', () => {
        infoPopup.parentNode.removeChild(infoPopup);
    }, { once: true });
}


  

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();


    cssRenderer.setSize(window.innerWidth, window.innerHeight);
    cssRenderer.render(scene, camera);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.render(scene, camera);

    
}


function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    //camera.update(delta);
    controls.update(delta);
    gallery.update(delta);

    //hotspots.update();
    renderer.render(scene, camera);
    cssRenderer.render(scene, camera);
    
    
    clock.start();
}




const clock = new THREE.Clock();
clock.start();

const scene = new THREE.Scene();
scene.background = new THREE.Color("skyblue");

const camera = createCamera();

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);

const cssRenderer = new CSS2DRenderer();
cssRenderer.setSize(window.innerWidth, window.innerHeight);
cssRenderer.domElement.style.position = 'absolute';
cssRenderer.domElement.style.top = '0';
document.body.appendChild(cssRenderer.domElement);

const controls = new Controls(camera, cssRenderer.domElement);
scene.add(controls.posIndicator);




const gallery = await loadGallery();
scene.add(gallery);


//const UI = createUI();
//scene.add(UI);

const ambientLight = new THREE.AmbientLight('white', 3.0);
scene.add(ambientLight);

window.addEventListener('resize', onWindowResize, false);

animate();


