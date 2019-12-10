import { OrbitControls } from "../lib/OrbitControls.js";
import Stats from "../lib/stats.module.js";

var clock, scene, camera, renderer, controls;
var stats;
var num_bodies = 3;
var grad_updates_per_frame = 5;
var bodies = [];
var dt = 5 * Math.pow(10, -3);
var current_frame = 0;
var expression = "x1+x2+x3+y1+y2+y3+z1+z2+z3"; // placeholder

var cost = math.parse(expression);
var derivatives = {};

for(let i=1;i<num_bodies+1;i++) {
    derivatives["x"+i.toString()] = math.derivative(cost, "x"+i.toString())
    derivatives["y"+i.toString()] = math.derivative(cost, "y"+i.toString())
    derivatives["z"+i.toString()] = math.derivative(cost, "z"+i.toString())
}

//variable declaration
//initialize.
start();

function start() {
    init();
    for(var i=0;i<num_bodies;i++) {
        generateParticle();
    }
    renderFrame();
}

function init() {
    clock = new THREE.Clock();
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xcfcfcf);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.2, 5000);
    camera.position.set(3,3,3);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    //Add hemisphere light
    let hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.1);
    hemiLight.color.setHSL(0.6, 0.6, 0.6);
    hemiLight.groundColor.setHSL(0.1, 1, 0.4);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    //Add directional light
    let dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.color.setHSL(0.1, 1, 0.95);
    dirLight.position.set(-1, 1.75, 1);
    dirLight.position.multiplyScalar(100);
    scene.add(dirLight);

    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    let d = 50;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.camera.far = 13500;

    let axesHelper = new THREE.AxesHelper(500);
    scene.add(axesHelper);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor(0xcfcfcf);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Add translucent blue unit sphere
    var sphereGeom =  new THREE.SphereGeometry( 1, 32, 32 );
    var blueMaterial = new THREE.MeshBasicMaterial( { color: 0x0000ff, transparent: true, opacity: 0.1 } );
    var sphere = new THREE.Mesh( sphereGeom, blueMaterial );
    scene.add(sphere);
    
    
    stats = new Stats();
    document.body.appendChild(stats.dom);

    renderer.gammaInput = true;
    renderer.gammaOutput = true;

    renderer.shadowMap.enabled = true;

    window.addEventListener('resize', onWindowResize, false);
    controls = new OrbitControls(camera, renderer.domElement);
}

function renderFrame(){
    current_frame += 1;
    console.log("Frame: ", current_frame);
    for(let i=0;i<grad_updates_per_frame;i++) {
        updatePhysics();
    }
    renderer.render(scene, camera);
    requestAnimationFrame(renderFrame);
    stats.update();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function generateParticle() {
    let pos = {x: Math.random()*4 - 2, y: Math.random()*4 - 2, z: Math.random()*4 - 2};
    let radius = 0.1;

    //threeJS Section
    let particle = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32), new THREE.MeshPhongMaterial({color: 0xffffff}));

    particle.position.set(pos.x, pos.y, pos.z);

    particle.castShadow = true;
    particle.receiveShadow = true;
    particle.theta = Math.random() * 180;
    particle.phi = Math.random() * 360;

    scene.add(particle);

    bodies.push(particle);
}

function updatePhysics(){
    // Step world
    // Update rigid bodies
    for (let i = 0; i < bodies.length; i++) {
        let theta = bodies[i].theta;
        let phi = bodies[i].phi;

        bodies[i].position.set(Math.sin(theta)*Math.cos(phi), Math.sin(theta)*Math.sin(phi), Math.cos(theta));
        console.log(centralAngleDegrees(bodies[i].theta, bodies[i].phi, bodies[(i+1)%3].theta, bodies[(i+1)%3].phi));
    }
}

/* Calculates the value of the gradient at a point (x,y,z) */
function calculateGradient(n, x) {
    let dx = derivatives["x"+n.toString()].evaluate(x);
    let dy = derivatives["y"+n.toString()].evaluate(x);
    let dz = derivatives["z"+n.toString()].evaluate(x);
    return [dx, dy, dz];
}

function centralAngleRadians(t1, p1, t2, p2) {
    return Math.acos(Math.cos(t1)*Math.cos(p1)*Math.cos(t2)*Math.cos(p2) + Math.cos(t1)*Math.sin(p1)*Math.cos(t2)*Math.sin(p2) + Math.sin(t1)*Math.sin(t2));
}

function centralAngleDegrees(t1, p1, t2, p2) {
    return centralAngleRadians(t1, p1, t2, p2) * (180/Math.PI);
}
    