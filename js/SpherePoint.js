class SpherePoint {
    constructor(sphere) {
        this.phi = Math.random()*Math.PI*2;
        this.theta = Math.random()*Math.PI; // Because phi allows us to access the other hemisphere of the sphere 
        this.sphere = sphere; // Three.js sphere object (not relevant for math)
    }
    
    getCartesian() {
        return [Math.sin(this.theta)*Math.cos(this.phi), Math.sin(this.theta)*Math.sin(this.phi), Math.cos(this.theta)];
    }
    getDeg(radAngle) {
        return radAngle/Math.PI*180;
    }
    setPosition(theta, phi) {
        this.theta = theta;
        this.phi = phi;
    }
    updateRender() {
        let pos = this.getCartesian();
        this.sphere.position.set(pos[0], pos[1], pos[2]);
    }
}

export default SpherePoint;