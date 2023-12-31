
"use strict";

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer";
import gsap from "gsap";


const cameraHeight = 1.65;


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
        //let regex = new RegExp("^Object\\d+_Material_#49_0$");//"Objectxxx_Material_#49_0" are the volume lights
        for (let i=0; i<intersectPoints.length; i++) {
            name = intersectPoints[i].object.name;

            //"0" is the floor name
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
    const galleryData = await loader.loadAsync("assets/scene_v2_1.glb");
    

    const gallery = galleryData.scene;
    //const animation = galleryData.animations[0];
    //const mixer = new THREE.AnimationMixer(gallery);
    //const action = mixer.clipAction(animation);
    //action.play();
    //gallery.update = (delta) => mixer.update(delta);

    
    //Apply anisotropic filtering 
    gallery.traverse((object) => {
        const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

        if (object.isMesh && object.material.map !== null) {
            object.material.map.anisotropy = maxAnisotropy;
        }
    
    });

    //console.log(gallery.children[1]);
    gallery.children[1].intensity = 100;
    

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



function loadFBX() {
    
    const loader = new FBXLoader();
    const hotspots = new THREE.Group();
    loader.load(
        'assets/gallery/gallery_fbx_with_dummy.fbx',
        (object) => {
            if (object.name == '') { //hotspots
                object.children.forEach((child) => {
                    if (child.name.includes("Point")) {
                        const hotspotObject = createHotspot(child.position);
                        hotspotObject.name = child.name;
                        hotspots.add(hotspotObject);
                    }
                });
            }
        },
    );

    hotspots.update = () => {
        hotspots.children.forEach((hotspot) => {
            //console.log("update hotspot at", hotspot.position);
            hotspot.update();
        });
    }

    return hotspots;
}

function createUI() {
    const settingContainer = document.createElement('div');
    settingContainer.style.position = 'absolute';
    settingContainer.style.top = '0';
    settingContainer.style.left = '0';
    document.body.appendChild(settingContainer);

    const settingElement = document.createElement('img');
    settingElement.src = 'assets/settings.png';
    settingElement.style.width = '100px'; 
    settingElement.style.height = '100px'; 
    settingElement.style.position = 'absolute';
    settingContainer.appendChild(settingElement);

    settingElement.addEventListener('click', () => {
        // Perform actions when the hotspot is clicked
        console.log('Setting:');
        // Add your logic here, e.g., show information or navigate to another scene
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
      console.log('Hotspot clicked at position:', position);
      // Add your logic here, e.g., show information or navigate to another scene
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
    //gallery.update(delta);

    hotspots.update();
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
//renderer.useLegacyLights = true;

document.body.appendChild(renderer.domElement);

const cssRenderer = new CSS2DRenderer();
cssRenderer.setSize(window.innerWidth, window.innerHeight);
cssRenderer.domElement.style.position = 'absolute';
cssRenderer.domElement.style.top = '0';
document.body.appendChild(cssRenderer.domElement);

const controls = new Controls(camera, cssRenderer.domElement);
scene.add(controls.posIndicator);


const UI = createUI();
scene.add(UI);

const hotspots = loadFBX();
scene.add(hotspots);

const gallery = await loadGallery();
scene.add(gallery);


const ambientLight = new THREE.AmbientLight('white', 3.0);
scene.add(ambientLight);

window.addEventListener('resize', onWindowResize, false);

animate();


