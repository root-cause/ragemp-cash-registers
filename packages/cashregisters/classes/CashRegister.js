const { cashRegisterCooldown, createBlips } = require("../json/config");
const { xyInFrontOfPos } = require("../util");

const cashRegisterState = {
    none: 0,
    normal: 1,
    shot: 2,
    emptied: 3
};

class CashRegister {
    constructor(UUID, position, heading) {
        this._position = new mp.Vector3(position.x, position.y, position.z);
        this._rotation = new mp.Vector3(0.0, 0.0, heading);
        this._heading = heading;
        this._state = cashRegisterState.normal;
        this._timer = null;
        this._label = null;

        // Create entities
        this._prop = mp.objects.new("prop_till_01", this._position, {
            rotation: this._rotation
        });

        this._prop.setVariables({
            cashRegisterId: UUID,
            cashRegisterState: this._state
        });

        if (createBlips) {
            this._blip = mp.blips.new(628, this._position, {
                shortRange: true
            });
        }

        const colshapePos = xyInFrontOfPos(position, heading, -0.75);
        this._colshape = mp.colshapes.newSphere(colshapePos.x, colshapePos.y, colshapePos.z, 0.35);
        this._colshape.cashRegisterId = UUID;
    }

    // Getters
    get position() {
        return this._position;
    }

    get state() {
        return this._state;
    }

    // Functions
    _stopTimer() {
        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }
    }

    _destroyLabel() {
        if (this._label && mp.labels.exists(this._label)) {
            this._label.destroy();
            this._label = null;
        }
    }

    setState(newState) {
        if (this._state === newState) {
            return;
        }

        if (newState < cashRegisterState.normal || newState > cashRegisterState.emptied) {
            throw new RangeError("Invalid state");
        }

        this._stopTimer();
        this._destroyLabel();
        this._state = newState;

        if (this._prop && mp.objects.exists(this._prop)) {
            this._prop.setVariable("cashRegisterState", newState);
        }

        if (newState == cashRegisterState.shot || newState == cashRegisterState.emptied) {
            this._label = mp.labels.new("Robbed", this._position.add(new mp.Vector3(0.0, 0.0, 0.25)), {
                los: false,
                font: 0,
                drawDistance: 15.0,
                color: [224, 50, 50, 255]
            });

            this._timer = setTimeout(() => {
                this.setState(cashRegisterState.normal);
            }, cashRegisterCooldown);
        }
    }
}

module.exports = {
    cashRegisterState,
    CashRegister
};