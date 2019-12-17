import { OrbitControls } from "../lib/OrbitControls.js";
import Stats from "../lib/stats.module.js";
import Angle from "./Angle.js";
import SpherePoint from "./SpherePoint.js";

var clock, scene, camera, renderer, controls;
var stats;
var num_bodies = 3;
var grad_updates_per_frame = 1;
var dt = 5 * Math.pow(10, -3);
var current_frame = 0;
var equal_threshold = 0.01;
var oneAngleExpression = "acos(cos(t1) * cos(t2) + sin(t1) * sin(t2) * cos(p1 - p2))"; // placeholder
var twoAngleExpression = "acos(cos(t1) * cos(ts) + sin(t1) * sin(ts) * cos(p1 - ps)) + acos(cos(ts) * cos(t2) + sin(ts) * sin(t2) * cos(ps - p2))";

var oneAngleCost = math.parse(oneAngleExpression);
var twoAngleCost = math.parse(twoAngleExpression);

var oneAngleDeriv = {
    "t1": math.derivative(oneAngleCost, "t1"),
    "t2": math.derivative(oneAngleCost, "t2"),
    "p1": math.derivative(oneAngleCost, "p1"),
    "p2": math.derivative(oneAngleCost, "p2")
};

var twoAngleDeriv = {
    "t1": math.derivative(twoAngleCost, "t1"),
    "t2": math.derivative(twoAngleCost, "t2"),
    "p1": math.derivative(twoAngleCost, "p1"),
    "p2": math.derivative(twoAngleCost, "p2"),
    "ts": math.derivative(twoAngleCost, "ts"),
    "ps": math.derivative(twoAngleCost, "ps")
};

var points = {};
var angles = [];

//variable declaration
//initialize.
start();

function start() {
    init();
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

    for (let i=1;i<=num_bodies;i++) {
        points[i.toString()] = generateParticle();
    }

    for (let i=1;i<=num_bodies;i++) {
        for (let j=i+1;j<=num_bodies;j++) {
            angles.push(new Angle(i.toString(),j.toString()))
        }
    }
}

function renderFrame(){
    current_frame += 1;
    console.log("Frame: ", current_frame);
    for(let i=0;i<grad_updates_per_frame;i++) {
        iterateUpdate();
    }
    Object.keys(angles).forEach((angle) => {
        console.log(angles[angle].centralAngleRadians(points));
    })
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
    let radius = 0.1;

    //threeJS Section
    let particle = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32), new THREE.MeshPhongMaterial({color: 0xffffff}));
    let sp = new SpherePoint(particle);  

    let pos = sp.getCartesian();
    sp.sphere.position.set(pos[0], pos[1], pos[2]);

    sp.sphere.castShadow = true;
    sp.sphere.receiveShadow = true;

    scene.add(sp.sphere);

    return sp; 
}

function compareAngles(a,b) {
    let comparison = 0;
    if (a.centralAngleRadians(points) > b.centralAngleRadians(points)) {
        comparison = 1;
    } else if (a.centralAngleRadians(points) < b.centralAngleRadians(points)) {
        comparison = -1;
    }
    return comparison;
}
/* Calculates the value of the gradient at a point (x,y,z) */
// n is the index of the point that is being moved
// doesn't return anything, implicitly updates the points{} and angles[]
function iterateUpdate() {
    // find min angle / angles
    // pick random point if one angle, if two, pick to random
    let angleRad = angles.slice();
    angleRad.sort(compareAngles);

    if (angleRad[1].centralAngleRadians(points) - angleRad[0].centralAngleRadians(points) < equal_threshold) {
        twoAngleCalculate(angleRad[0], angleRad[1]);
    } else {
        oneAngleCalculate(angleRad[0]);
    }
}

function twoAngleCalculate(angle1,angle2) {
    // find shared point
    let commonPoint, unique1, unique2;
    if (angle1.point1 == angle2.point1) {
        commonPoint = angle1.point1;
        unique1 = angle1.point2;
        unique2 = angle2.point2;
    } else if (angle1.point2 == angle2.point2) {
        commonPoint = angle2.point2;
        unique1 = angle1.point1;
        unique2 = angle2.point1;
    } else if (angle1.point1 == angle2.point2) {
        commonPoint = angle1.point1;
        unique1 = angle1.point2;
        unique2 = angle2.point1;
    } else {
        commonPoint = angle1.point2;
        unique1 = angle1.point1;
        unique2 = angle2.point2;
    }
    // take derivative
    let tp = {
        "t1": points[unique1].theta,
        "p1": points[unique1].phi,
        "t2": points[unique2].theta,
        "p2": points[unique2].phi,
        "ts": points[commonPoint].theta,
        "ps": points[commonPoint].phi
    };
    points[unique1].theta += dt * twoAngleDeriv["t1"].evaluate(tp);
    points[unique1].phi += dt * twoAngleDeriv["p1"].evaluate(tp);
    points[unique2].theta += dt * twoAngleDeriv["t2"].evaluate(tp);
    points[unique2].phi += dt * twoAngleDeriv["p2"].evaluate(tp);
    points[commonPoint].theta += dt * twoAngleDeriv["ts"].evaluate(tp);
    points[commonPoint].phi += dt * twoAngleDeriv["ps"].evaluate(tp);
    points[unique1].updateRender();
    points[unique2].updateRender();
    points[commonPoint].updateRender();

}

function oneAngleCalculate(angle) {
    // we want to maximize oneAngleExpression
    let tp = {
        "t1": points[angle.point1].theta,
        "p1": points[angle.point1].phi,
        "t2": points[angle.point2].theta,
        "p2": points[angle.point2].phi
    };
    console.log(oneAngleDeriv["t1"].evaluate(tp), oneAngleDeriv["p1"].evaluate(tp), oneAngleDeriv["t2"].evaluate(tp), oneAngleDeriv["p2"].evaluate(tp));
    points[angle.point1].theta += dt * oneAngleDeriv["t1"].evaluate(tp);
    points[angle.point1].phi += dt * oneAngleDeriv["p1"].evaluate(tp);
    points[angle.point2].theta += dt * oneAngleDeriv["t2"].evaluate(tp);
    points[angle.point2].phi += dt * oneAngleDeriv["p2"].evaluate(tp);
    points[angle.point1].updateRender();
    points[angle.point2].updateRender();
}