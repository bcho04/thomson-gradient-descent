import { OrbitControls } from "../lib/OrbitControls.js";
import Stats from "../lib/stats.module.js";

var clock, scene, camera, renderer, controls;
var stats;
var num_bodies = 3;
var grad_updates_per_frame = 5;
var bodies = [];
var current_frame = 0;
var equal_threshold = 0.01;
var oneAngleExpression = "acos(cos(t1) * cos(t2) + sin(t1) * sin(t2) * cos(p1 - p2))"; // placeholder
var twoAngleExpression = "acos(cos(t1) * cos(ts) + sin(t1) * sin(ts) * cos(p1 - ps)) + acos(cos(ts) * cos(t2) + sin(t) * sin(t2) * cos(ps - p2))";

var oneAngleCost = math.parse(oneAngleExpression);
var twoAngleCost = math.parse(twoAngleExpression);

var oneAngleDeriv = {
    "t1": math.derivative(oneAngleCost, "t1"),
    "t2": math.derivative(oneAngleCost, "t2"),
    "p1": math.derivative(oneAngleCost, "p1"),
    "p2": math.derivative(oneAngleCost, "p2")
};

var twoAngleDeriv = {
    "t1": math.derivative(oneAngleCost, "t1"),
    "t2": math.derivative(oneAngleCost, "t2"),
    "p1": math.derivative(oneAngleCost, "p1"),
    "p2": math.derivative(oneAngleCost, "p2"),
    "ts": math.derivative(oneAngleCost, "ts"),
    "ps": math.derivative(oneAngleCost, "ps")
};

var points = {};
var angles = [];

//variable declaration
//initialize.
start();

class SpherePoint {
    constructor(sphere) {
        this.phi = Math.random()*Math.PI*2;
        this.theta = Math.random()*Math.PI; // Because phi allows us to access the other hemisphere of the sphere 
        this.sphere = sphere; // Three.js sphere object (not relevant for math)
    }

    constructor(theta, phi, sphere) {
        this.theta = theta;
        this.phi = phi;
        this.sphere = sphere;
    }
    
    getCartesian() {
        return [Math.sin(theta)*Math.cos(phi), Math.sin(theta)*Math.sin(phi), Math.cos(theta)];
    }
    getDeg(radAngle) {
        return radAngle/Math.PI*180;
    }
    setPosition(theta, phi) {
        this.theta = theta;
        this.phi = phi;
    }
}

class Angle {
    constructor(point1, point2) {
        this.point1 = point1;
        this.point2 = point2;
        this.angle = null;
    }

    centralAngleRadians() {
        return Math.acos(Math.cos(points[this.point1].theta)*
        Math.cos(points[this.point2].theta) + Math.sin(points[this.point1].theta)*Math.sin(points[this.point2].theta)*
        Math.cos(points[this.point1].phi-points[this.point2].phi));
    }
}

function start() {
    init();
    for(var i=0;i<num_bodies;i++) {
        points[i] = generateParticle();
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

    for (let i=1;i<num_bodies+1;i++) {
        points[i.toString()] = generateParticle();
    }
    for (let i=1;i<num_bodies+1;i++) {
        for (let j=2; j<num_bodies;j++) {
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
    let spherePoint = new SpherePoint(Math.random() * Math.PI, Math.random() * 2 * Math.PI, particle);  

    let pos = spherePoint.getCartesian();
    spherePoint.sphere.position.set(pos[0], pos[1], pos[2]);

    spherePoint.sphere.castShadow = true;
    spherePoint.sphere.receiveShadow = true;

    scene.add(spherePoint.sphere);

    return spherePoint; 
}
function compareAngles(a,b) {
    let comparison = 0;
    if (a.centralAngleRadians() > b.centralAngleRadians()) {
        comparison = 1;
    } else if (a.centralAngleRadians() < b.centralAngleRadians()) {
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
    angleRad = angles.slice();
    angleRad.sort(compareAngles);

    if (angleRad[1].centralAngleRadians() - angleRad[0].centralAngleRadians() < equal_threshold) {
        twoAngleCalculate(angleRad[0], angleRad[1]);
    } else {
        oneAngleCalculate(angleRad[0]);
    }
}

function twoAngleCalculate(angle1,angle2) {
    // find shared point
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
    points[unique1].theta += oneAngleDeriv["t1"].evaluate(tp);
    points[unique1].phi += oneAngleDeriv["p1"].evaluate(tp);
    points[unique2].theta += oneAngleDeriv["t2"].evaluate(tp);
    points[unique2].phi += oneAngleDeriv["p2"].evaluate(tp);
    points[commonPoint].theta += oneAngleDeriv["ts"].evaluate(tp);
    points[commonPoint].phi += oneAngleDeriv["ps"].evaluate(tp);
}

function oneAngleCalculate(angle) {
    // we want to maximize oneAngleExpression
    let tp = {
        "t1": points[angle.point1].theta,
        "p1": points[angle.point1].phi,
        "t2": points[angle.point2].theta,
        "p2": points[angle.point2].phi
    };
    points[angle.point1].theta += oneAngleDeriv["t1"].evaluate(tp);
    points[angle.point1].phi += oneAngleDeriv["p1"].evaluate(tp);
    points[angle.point2].theta += oneAngleDeriv["t2"].evaluate(tp);
    points[angle.point2].phi += oneAngleDeriv["p2"].evaluate(tp);
}