
"use strict";

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";

//import studio from "@theatre/studio";

const cameraHeight = 1.65;


function createCamera() {
    const camera = new THREE.PerspectiveCamera(
        60, 
        window.innerWidth / window.innerHeight, 
        0.1, 
        10000,
    );
    camera.position.set(0, cameraHeight, 0);

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
        this.raycaster.far = 5;

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
        let regex = new RegExp("^Object\\d+_Material_#49_0$");//"Objectxxx_Material_#49_0" are the volume lights
        for (let i=0; i<intersectPoints.length; i++) {
            name = intersectPoints[i].object.name;
            //ignore volumn light and check for the next intersect point
            if (regex.test(name)) {
                continue;
            }
            //"0" is the floor name
            else if (name == "0") {
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
            this.newPos = pos;
        }
    }

    update(delta) {
        this.updatePosIndicator();
        this.camera.position.lerp(this.newPos, delta);
    }

    dispose() {
        this.domElement.removeEventListener('mousedown', this.onMouseDown, false);
        this.domElement.removeEventListener('mouseup', this.onMouseUp, false);
        this.domElement.removeEventListener('mousemove', this.onMouseMove, false);
        this.domElement.removeEventListener('dbclick', this.onMouseDoubleClick, false);
    }
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
    const galleryData = await loader.loadAsync("/assets/richard_art_gallery.glb");
    const gallery =  galleryData.scene;
    gallery.position.set(0,0,0);
    gallery.scale.set(1,1,1);
    return gallery;
}





function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.render(scene, camera);
}


function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    //camera.update(delta);
    controls.update(delta);

    renderer.render(scene, camera);

    clock.start();
}




const clock = new THREE.Clock();
clock.start();





const scene = new THREE.Scene();
scene.background = new THREE.Color("skyblue");
const camera = createCamera();
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setPixelRatio(1);
renderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);


const controls = new Controls(camera, renderer.domElement);
scene.add(controls.posIndicator);
const gallery = await loadGallery();
scene.add(gallery);


window.addEventListener('resize', onWindowResize, false);

animate();







