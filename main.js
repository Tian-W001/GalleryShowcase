

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
        new THREE.Vector3(13.513441527048132,1.7319486038646488,1.5609441186616786), 
       
        new THREE.Vector3(12.402700211922294,1.3427433576046865,0.051598471844235404), 
        new THREE.Vector3(7.7504818869033265,1.5208559306691156,-0.5817642808084571), 
        new THREE.Vector3(8.09415338881827,1.5207307160466332,-0.009439751220533438), 
        new THREE.Vector3(6.128644558235766,1.5269575257584769,0.21949957922414454), 
        new THREE.Vector3(5.327707810364042,1.6126501989409774,-0.19161221709228515), 
        new THREE.Vector3(3.4809098952822133,1.621650596505995,0.6265284481116027), 
        new THREE.Vector3(1.3299010941190725,1.670211652351096,0.28104838508218466), 
        new THREE.Vector3(0.25703420558614626,1.619512935902752,-0.359944870682531), 
        new THREE.Vector3(-1.7695903876242467,1.6623463942477203,1.1152272564124783), 
        new THREE.Vector3(-2.400346288729153,1.6215590227685064,-0.7054219049881338), 
    
        new THREE.Vector3(-3.6722166704724226,1.5347427890751901,-0.07963193874000676), 
        new THREE.Vector3(-7.130665267892541,1.6303632499870877,-0.9677469798728857), 
        new THREE.Vector3(-8.736640208225285,1.669574119557619,0.47865025887157486), 
        new THREE.Vector3(-9.541309475106424,1.6678479249933231,1.3893816764257265), 
        new THREE.Vector3(-9.909654901934935,1.6622876552014836,0.12109333063394181), 


    ];
    const rotations = [
        new THREE.Quaternion(-0.02851451576759945,0.9684017199967849,0.11669640262690059,0.21855658469089476),
        new THREE.Quaternion(-0.02126025156204034,0.8349585695759327,0.028380106969510065,0.5491691527422403),
        new THREE.Quaternion(0.001705435887772891,-0.9987398311069736,-0.009496665953388767,0.04925093486033023),
        new THREE.Quaternion(-0.009631134934015823,-0.9434159063533261,-0.03412726194647887,0.3297104773455821),
        
        new THREE.Quaternion(-0.04318610516143407,0.28261269889122165,0.010480133645193292,0.9582041481569491),
        new THREE.Quaternion(0.0021436372046537877,-0.9999569887043273,-0.0084082453675843,0.003275205451162639),
        new THREE.Quaternion(0.03155969468954677,0.014150966645937402,-0.0026152293640347183,0.9993982671535215),
        new THREE.Quaternion(-0.005410054649313727,0.004078095521808908,-0.002149255123018253,0.9999747402549839),
        new THREE.Quaternion(0.0019200371200363078,-0.9997467613563475,-0.016431768889748902,0.015255280597417865),
        new THREE.Quaternion(-0.003427246198659558,0.01208212646353856,-0.0021301044083778813,0.9999188661380595),
        new THREE.Quaternion(-0.028426891794126632,0.015021555703471674,-0.0017417751695898718,0.9994814810222505),
        new THREE.Quaternion(0.0020789976613294295,-0.9997596291248654,-0.021408697725771,0.004246104393740246),
        new THREE.Quaternion(-0.015439251216092598,0.019053001215666644,-0.0018767638755086543,0.9996974994586703),
        new THREE.Quaternion(0.002104800978174635,-0.9999076361789635,-0.005427504190211407,0.012281332261004044),
    
        new THREE.Quaternion(-0.0337271717802858,0.7039658173171385,0.03044719636292062,0.7087789318019787),
        new THREE.Quaternion(-0.030910534834909565,-0.43557994776889386,-0.01737721509048741,0.8994513218254596),
        new THREE.Quaternion(-0.026500056768423524,-0.8521157684544015,-0.047529070797785546,0.5205165238219958), 
        new THREE.Quaternion(-0.014106235764381792,0.9825834837500226,0.06793003991132442,0.17238393559689588), 
        new THREE.Quaternion(-0.04042725893609807,0.7232388143064458,0.03934529126217019,0.6882900567863923), 
    ];


    //the index of the current artwork
    let index = 0;
    let isTransiting = false;

    camera.position.copy(positions[0]);
    camera.setRotationFromQuaternion(rotations[0]);

    window.addEventListener("keypress", (e)=>{
        if (e.code == 'KeyN' && !isTransiting) {
            if (index < positions.length - 1) {
                index += 1;
            }
            else {
                index = 0;
            }
            isTransiting = true;
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
        if (camera.position.distanceTo(positions[index]) < 0.1) {
            isTransiting = false;
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
renderer.setPixelRatio(1);
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







