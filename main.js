

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";


function createCamera() {
    const camera = new THREE.PerspectiveCamera(
        40, 
        window.innerWidth / window.innerHeight, 
        0.1, 
        10000,
    );

    //hardcoded camera positions and rotations
    const positions = [
        new THREE.Vector3(11.611884971474453,1.3727284997851807,-0.026261992950112414), 
        new THREE.Vector3(10.43195522977472,1.6861324782133806,1.0781648947053117), 
        new THREE.Vector3(12.621292281783422,1.6825220754993153,2.25690021947915), 
    
    ];
    const rotations = [
        new THREE.Quaternion(-0.02851451576759945,0.9684017199967849,0.11669640262690059,0.21855658469089476),
        new THREE.Quaternion(-0.02126025156204034,0.8349585695759327,0.028380106969510065,0.5491691527422403),
        new THREE.Quaternion(0.001705435887772891,-0.9987398311069736,-0.009496665953388767,0.04925093486033023)
    ];


    //the index of the current artwork
    let index = 0;

    camera.position.copy(positions[0]);
    camera.setRotationFromQuaternion(rotations[0]);

    window.addEventListener("keydown", (e)=>{
        if (e.code == 'KeyN') {
            if (index < positions.length - 1) {
                index += 1;
                console.log("Index: " + index);
            }
            else {
                index = 0;
            }

        }
        //Print current position and roatation for testing
        else if (e.code == 'KeyC') {
            console.log("new THREE.Vector3(" + 
                camera.position.x + "," + 
                camera.position.y + "," + 
                camera.position.z + "), " + 
                "\nnew THREE.Quaternion(" + 
                camera.quaternion.x + "," + 
                camera.quaternion.y + "," + 
                camera.quaternion.z + "," + 
                camera.quaternion.w + ")"
            );
        }
    });

    //update each frame
    camera.update = (delta) => {
        //Check if current position and rotation are inplace
        if (camera.position == positions[index] && camera.rotation == rotations[index]){
            return;
        }

        //lerp to desired transform
        camera.position.lerp(positions[index], delta * 2);
        camera.quaternion.slerp(rotations[index], delta * 2);
    }


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

const clock = new THREE.Clock();
clock.start();

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


    const delta = clock.getDelta();


    camera.update(delta);
    controls.update(delta);

    renderer.render(scene, camera);

    clock.start();
}

animate();







