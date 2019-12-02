import { OrbitControls } from "../lib/OrbitControls.js/index.js";
import Stats from "../lib/stats.module.js/index.js";

var clock, scene, camera, renderer, controls;
var stats;
var num_bodies = 10;
var grad_updates_per_frame = 5;
var bodies = [];
var dt = 5 * Math.pow(10, -3);
var current_frame = 0;
var expression = "1/((-x1+x2)^2+(-y1+y2)^2+(-z1+z2)^2)^6-1/((-x1+x2)^2+(-y1+y2)^2+(-z1+z2)^2)^3+1/((-x1+x3)^2+(-y1+y3)^2+(-z1+z3)^2)^6-1/((-x1+x3)^2+(-y1+y3)^2+(-z1+z3)^2)^3+1/((-x2+x3)^2+(-y2+y3)^2+(-z2+z3)^2)^6-1/((-x2+x3)^2+(-y2+y3)^2+(-z2+z3)^2)^3+1/((-x1+x4)^2+(-y1+y4)^2+(-z1+z4)^2)^6-1/((-x1+x4)^2+(-y1+y4)^2+(-z1+z4)^2)^3+1/((-x2+x4)^2+(-y2+y4)^2+(-z2+z4)^2)^6-1/((-x2+x4)^2+(-y2+y4)^2+(-z2+z4)^2)^3+1/((-x3+x4)^2+(-y3+y4)^2+(-z3+z4)^2)^6-1/((-x3+x4)^2+(-y3+y4)^2+(-z3+z4)^2)^3+1/((-x1+x5)^2+(-y1+y5)^2+(-z1+z5)^2)^6-1/((-x1+x5)^2+(-y1+y5)^2+(-z1+z5)^2)^3+1/((-x2+x5)^2+(-y2+y5)^2+(-z2+z5)^2)^6-1/((-x2+x5)^2+(-y2+y5)^2+(-z2+z5)^2)^3+1/((-x3+x5)^2+(-y3+y5)^2+(-z3+z5)^2)^6-1/((-x3+x5)^2+(-y3+y5)^2+(-z3+z5)^2)^3+1/((-x4+x5)^2+(-y4+y5)^2+(-z4+z5)^2)^6-1/((-x4+x5)^2+(-y4+y5)^2+(-z4+z5)^2)^3+1/((-x1+x6)^2+(-y1+y6)^2+(-z1+z6)^2)^6-1/((-x1+x6)^2+(-y1+y6)^2+(-z1+z6)^2)^3+1/((-x2+x6)^2+(-y2+y6)^2+(-z2+z6)^2)^6-1/((-x2+x6)^2+(-y2+y6)^2+(-z2+z6)^2)^3+1/((-x3+x6)^2+(-y3+y6)^2+(-z3+z6)^2)^6-1/((-x3+x6)^2+(-y3+y6)^2+(-z3+z6)^2)^3+1/((-x4+x6)^2+(-y4+y6)^2+(-z4+z6)^2)^6-1/((-x4+x6)^2+(-y4+y6)^2+(-z4+z6)^2)^3+1/((-x5+x6)^2+(-y5+y6)^2+(-z5+z6)^2)^6-1/((-x5+x6)^2+(-y5+y6)^2+(-z5+z6)^2)^3+1/((-x1+x7)^2+(-y1+y7)^2+(-z1+z7)^2)^6-1/((-x1+x7)^2+(-y1+y7)^2+(-z1+z7)^2)^3+1/((-x2+x7)^2+(-y2+y7)^2+(-z2+z7)^2)^6-1/((-x2+x7)^2+(-y2+y7)^2+(-z2+z7)^2)^3+1/((-x3+x7)^2+(-y3+y7)^2+(-z3+z7)^2)^6-1/((-x3+x7)^2+(-y3+y7)^2+(-z3+z7)^2)^3+1/((-x4+x7)^2+(-y4+y7)^2+(-z4+z7)^2)^6-1/((-x4+x7)^2+(-y4+y7)^2+(-z4+z7)^2)^3+1/((-x5+x7)^2+(-y5+y7)^2+(-z5+z7)^2)^6-1/((-x5+x7)^2+(-y5+y7)^2+(-z5+z7)^2)^3+1/((-x6+x7)^2+(-y6+y7)^2+(-z6+z7)^2)^6-1/((-x6+x7)^2+(-y6+y7)^2+(-z6+z7)^2)^3+1/((-x1+x8)^2+(-y1+y8)^2+(-z1+z8)^2)^6-1/((-x1+x8)^2+(-y1+y8)^2+(-z1+z8)^2)^3+1/((-x2+x8)^2+(-y2+y8)^2+(-z2+z8)^2)^6-1/((-x2+x8)^2+(-y2+y8)^2+(-z2+z8)^2)^3+1/((-x3+x8)^2+(-y3+y8)^2+(-z3+z8)^2)^6-1/((-x3+x8)^2+(-y3+y8)^2+(-z3+z8)^2)^3+1/((-x4+x8)^2+(-y4+y8)^2+(-z4+z8)^2)^6-1/((-x4+x8)^2+(-y4+y8)^2+(-z4+z8)^2)^3+1/((-x5+x8)^2+(-y5+y8)^2+(-z5+z8)^2)^6-1/((-x5+x8)^2+(-y5+y8)^2+(-z5+z8)^2)^3+1/((-x6+x8)^2+(-y6+y8)^2+(-z6+z8)^2)^6-1/((-x6+x8)^2+(-y6+y8)^2+(-z6+z8)^2)^3+1/((-x7+x8)^2+(-y7+y8)^2+(-z7+z8)^2)^6-1/((-x7+x8)^2+(-y7+y8)^2+(-z7+z8)^2)^3+1/((-x1+x9)^2+(-y1+y9)^2+(-z1+z9)^2)^6-1/((-x1+x9)^2+(-y1+y9)^2+(-z1+z9)^2)^3+1/((-x2+x9)^2+(-y2+y9)^2+(-z2+z9)^2)^6-1/((-x2+x9)^2+(-y2+y9)^2+(-z2+z9)^2)^3+1/((-x3+x9)^2+(-y3+y9)^2+(-z3+z9)^2)^6-1/((-x3+x9)^2+(-y3+y9)^2+(-z3+z9)^2)^3+1/((-x4+x9)^2+(-y4+y9)^2+(-z4+z9)^2)^6-1/((-x4+x9)^2+(-y4+y9)^2+(-z4+z9)^2)^3+1/((-x5+x9)^2+(-y5+y9)^2+(-z5+z9)^2)^6-1/((-x5+x9)^2+(-y5+y9)^2+(-z5+z9)^2)^3+1/((-x6+x9)^2+(-y6+y9)^2+(-z6+z9)^2)^6-1/((-x6+x9)^2+(-y6+y9)^2+(-z6+z9)^2)^3+1/((-x7+x9)^2+(-y7+y9)^2+(-z7+z9)^2)^6-1/((-x7+x9)^2+(-y7+y9)^2+(-z7+z9)^2)^3+1/((-x8+x9)^2+(-y8+y9)^2+(-z8+z9)^2)^6-1/((-x8+x9)^2+(-y8+y9)^2+(-z8+z9)^2)^3+1/((-x1+x10)^2+(-y1+y10)^2+(-z1+z10)^2)^6-1/((-x1+x10)^2+(-y1+y10)^2+(-z1+z10)^2)^3+1/((-x2+x10)^2+(-y2+y10)^2+(-z2+z10)^2)^6-1/((-x2+x10)^2+(-y2+y10)^2+(-z2+z10)^2)^3+1/((-x3+x10)^2+(-y3+y10)^2+(-z3+z10)^2)^6-1/((-x3+x10)^2+(-y3+y10)^2+(-z3+z10)^2)^3+1/((-x4+x10)^2+(-y4+y10)^2+(-z4+z10)^2)^6-1/((-x4+x10)^2+(-y4+y10)^2+(-z4+z10)^2)^3+1/((-x5+x10)^2+(-y5+y10)^2+(-z5+z10)^2)^6-1/((-x5+x10)^2+(-y5+y10)^2+(-z5+z10)^2)^3+1/((-x6+x10)^2+(-y6+y10)^2+(-z6+z10)^2)^6-1/((-x6+x10)^2+(-y6+y10)^2+(-z6+z10)^2)^3+1/((-x7+x10)^2+(-y7+y10)^2+(-z7+z10)^2)^6-1/((-x7+x10)^2+(-y7+y10)^2+(-z7+z10)^2)^3+1/((-x8+x10)^2+(-y8+y10)^2+(-z8+z10)^2)^6-1/((-x8+x10)^2+(-y8+y10)^2+(-z8+z10)^2)^3+1/((-x9+x10)^2+(-y9+y10)^2+(-z9+z10)^2)^6-1/((-x9+x10)^2+(-y9+y10)^2+(-z9+z10)^2)^3";

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
    let radius = 0.3;

    //threeJS Section
    let particle = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32), new THREE.MeshPhongMaterial({color: 0xffffff}));

    particle.position.set(pos.x, pos.y, pos.z);

    particle.castShadow = true;
    particle.receiveShadow = true;

    scene.add(particle);

    bodies.push(particle);
}

function updatePhysics(){
    // Step world
    let particle_positions = {};
    let particle_distances = {};
    for (let i = 0; i < bodies.length; i++) {
        particle_positions["x"+(i+1).toString()] = bodies[i].position.x;
        particle_positions["y"+(i+1).toString()] = bodies[i].position.y;
        particle_positions["z"+(i+1).toString()] = bodies[i].position.z;
    }
    for (let i = 0; i < bodies.length; i++) {
        for (let j = i+1; j < bodies.length; j++) {
            particle_distances[(i+1).toString()+"-"+(j+1).toString()] = Math.sqrt((bodies[j].position.x-bodies[i].position.x)**2 + (bodies[j].position.y-bodies[i].position.y)**2 + (bodies[j].position.z-bodies[i].position.z)**2);
        }
    }
    console.log(particle_distances);
    console.log(cost.evaluate(particle_positions));
    // Update rigid bodies
    for (let i = 0; i < bodies.length; i++) {
        let objThree = bodies[i];
        
        let p_0 = [particle_positions["x"+(i+1).toString()], particle_positions["y"+(i+1).toString()], particle_positions["z"+(i+1).toString()]];
        let grad = calculateGradient(i+1, particle_positions);
        
        let np = [p_0[0] - dt * grad[0], p_0[1] - dt * grad[1], p_0[2] - dt * grad[2]];

        objThree.position.set(np[0], np[1], np[2]);
    }
}

/* Calculates the value of the gradient at a point (x,y,z) */
function calculateGradient(n, x) {
    let dx = derivatives["x"+n.toString()].evaluate(x);
    let dy = derivatives["y"+n.toString()].evaluate(x);
    let dz = derivatives["z"+n.toString()].evaluate(x);
    return [dx, dy, dz];
}
    