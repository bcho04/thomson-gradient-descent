class Angle {
    constructor(point1, point2) {
        this.point1 = point1;
        this.point2 = point2;
        this.angle = null;
    }

    centralAngleRadians(points) {
        return Math.acos(Math.cos(points[this.point1].theta)*
        Math.cos(points[this.point2].theta) + Math.sin(points[this.point1].theta)*Math.sin(points[this.point2].theta)*
        Math.cos(points[this.point1].phi-points[this.point2].phi));
    }
}

export default Angle;