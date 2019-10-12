import { OrbitControls } from "./OrbitControls.js";
var dynamicsWorld, scene, camera, renderer, controls;
var clock;
var bodies = [];
var tmpTrans;

//variable declaration
//Ammojs Initialization
Ammo().then(start);

function start() {
    tmpTrans = new Ammo.btTransform();

    init();
    generateParticle();
    renderFrame();
}

function init() {
    let collisionConfiguration  = new Ammo.btDefaultCollisionConfiguration(),
        dispatcher              = new Ammo.btCollisionDispatcher(collisionConfiguration),
        overlappingPairCache    = new Ammo.btDbvtBroadphase(),
        solver                  = new Ammo.btSequentialImpulseConstraintSolver();
    dynamicsWorld           = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);

    dynamicsWorld.setGravity(new Ammo.btVector3(0, 0, 0));
    
    var groundShape = new Ammo.btBoxShape(new Ammo.btVector3(50, 50, 50)),
    groundTransform = new Ammo.btTransform();

    groundTransform.setIdentity();
    groundTransform.setOrigin(new Ammo.btVector3(0, -20, 0));

    clock = new THREE.Clock();
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xcfcfcf);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.2, 5000);
    camera.position.set(50,50,50);
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

    renderer.gammaInput = true;
    renderer.gammaOutput = true;

    renderer.shadowMap.enabled = true;

    window.addEventListener('resize', onWindowResize, false);
    controls = new OrbitControls(camera, renderer.domElement);
}

function renderFrame(){
    let deltaTime   = clock.getDelta();
    let elapsedTime = clock.getElapsedTime();
    updatePhysics(deltaTime, elapsedTime);
    renderer.render(scene, camera);
    requestAnimationFrame(renderFrame);

}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function generateParticle() {
    let pos = {x: 0, y: 20, z: 0};
    let radius = 1;
    let quat = {x: 0, y: 0, z: 0, w: 1};
    let mass = 1;

    //threeJS Section
    let particle = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32), new THREE.MeshPhongMaterial({color: 0xffffff}));

    particle.position.set(pos.x, pos.y, pos.z);

    particle.castShadow = true;
    particle.receiveShadow = true;

    scene.add(particle);

    let colShape        = new Ammo.btSphereShape(1),
        startTransform  = new Ammo.btTransform();
    
    startTransform.setIdentity();

    let isDynamic     = (mass !== 0),
        localInertia  = new Ammo.btVector3(0, 0, 0);
    
    if (isDynamic)
        colShape.calculateLocalInertia(mass,localInertia);

    startTransform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    startTransform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w))
    
    let myMotionState = new Ammo.btDefaultMotionState(startTransform),
        rbInfo        = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, colShape, localInertia),
        body          = new Ammo.btRigidBody(rbInfo);

    body.setLinearVelocity(new Ammo.btVector3(0,1,0));

    dynamicsWorld.addRigidBody(body);
    particle.userData.dynamicsBody = body;
    bodies.push(particle);
}

function updatePhysics(deltaTime, elapsedTime){
    // Step world
    dynamicsWorld.stepSimulation(deltaTime, 10);
    // Update rigid bodies
    for (let i = 0; i < bodies.length; i++) {
        let objThree = bodies[i];
        let objAmmo = objThree.userData.dynamicsBody;
        
        let magneticForceVector = magneticFieldForce(elapsedTime, objAmmo);
        let KE = getKineticEnergy(objAmmo);
        let vel = getVelocity(objAmmo);
        objAmmo.applyForce(magneticForceVector);
        console.log(KE);
        console.log(vel);


        let ms = objAmmo.getMotionState();
        if (ms) {
            ms.getWorldTransform(tmpTrans);
            let p = tmpTrans.getOrigin();
            let q = tmpTrans.getRotation();
            objThree.position.set(p.x(), p.y(), p.z());
            objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
        }
    }
}

// Physics definitions

function magneticVectorField(elapsedTime) {
    return [5*Math.sin(elapsedTime), 
            0, 
            5*Math.cos(elapsedTime)
        ];
}

function magneticFieldForce(elapsedTime, objAmmo) {
    let v = objAmmo.getLinearVelocity();
    let B = magneticVectorField(elapsedTime);
    let F = math.cross([v.x(), v.y(), v.z()], B);
    console.log(F);
    return new Ammo.btVector3(F[0], F[1], F[2]);
}

function getKineticEnergy(objAmmo) {
    let m0 = 1.67 * Math.pow(10,-27);
    let c = 3 * Math.pow(10,8);
    let v = objAmmo.getLinearVelocity();
    let v_mag = Math.sqrt(v.x()**2 + v.y()**2 + v.z()**2);
    return (m0 * c**2) * (1/Math.sqrt(1-(v_mag**2)/(c**2)));
}

function getVelocity(objAmmo) {
    let v = objAmmo.getLinearVelocity();
    let v_mag = Math.sqrt(v.x()**2 + v.y()**2 + v.z()**2);
    return v_mag;
}