function UUID(a) {
    return a ? (a ^ Math.random() * 16 >> a / 4).toString(16) : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, UUID);
};

module.exports.UUID = UUID;

module.exports.xyInFrontOfPos = function(pos, heading, dist) {
    heading *= Math.PI / 180;
    pos.x += (dist * Math.sin(-heading));
    pos.y += (dist * Math.cos(-heading));
    return pos;
};

module.exports.getRandomArbitrary = function(min, max) {
    return Math.random() * (max - min) + min;
};

module.exports.getRandomInt = function(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
};

module.exports.distanceVector = function(v1, v2) {
    const dx = v1.x - v2.x;
    const dy = v1.y - v2.y;
    const dz = v1.z - v2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
};