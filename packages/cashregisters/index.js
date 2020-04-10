const { minShotReward, maxShotReward, minEmptyReward, maxEmptyReward, cashLife } = require("./json/config");
const { cashRegisterState, CashRegister } = require("./classes/CashRegister");
const { UUID, getRandomArbitrary, getRandomInt, distanceVector } = require("./util");
const cashRegisterData = require("./json/cashRegisters");
const cashRegisters = {};

// Create cash registers
for (const item of cashRegisterData) {
    const uuid = UUID();
    cashRegisters[uuid] = new CashRegister(uuid, item.position, item.heading);
}

// RAGEMP Events
mp.events.add("playerEnterColshape", (player, colshape) => {
    if (colshape.cashAmount) {
        player.changeCurrency("cash", colshape.cashAmount);
        player.outputChatBox(`Got $${colshape.cashAmount} from the cash register. (shot)`);

        if (colshape.timer) {
            clearTimeout(colshape.timer);
            colshape.timer = null;
        }

        if (colshape.cashProp && mp.objects.exists(colshape.cashProp)) {
            colshape.cashProp.destroy();
            colshape.cashProp = null;
        }

        if (colshape.cashLabel && mp.labels.exists(colshape.cashLabel)) {
            colshape.cashLabel.destroy();
            colshape.cashLabel = null;
        }

        colshape.destroy();
        return;
    }

    if (colshape.cashRegisterId && cashRegisters[colshape.cashRegisterId] && cashRegisters[colshape.cashRegisterId].state === cashRegisterState.normal) {
        player.setOwnVariable("nearCashRegisterId", colshape.cashRegisterId);
    }
});

mp.events.add("playerExitColshape", (player, colshape) => {
    if (colshape.cashRegisterId) {
        player.setOwnVariable("nearCashRegisterId", null);
    }
});

// Script events
mp.events.add("cashRegisters::shot", (player, cashRegisterId, dropPos) => {
    const cashRegister = cashRegisters[cashRegisterId];
    if (!cashRegister || cashRegister.state !== cashRegisterState.normal) {
        return;
    }

    dropPos = JSON.parse(dropPos);
    if (distanceVector(cashRegister.position, dropPos) >= 3.0) {
        return;
    }

    cashRegister.setState(cashRegisterState.shot);

    // Create cash "pickup"
    const cashArea = mp.colshapes.newSphere(dropPos.x, dropPos.y, dropPos.z, 1.0);
    cashArea.cashAmount = getRandomInt(minShotReward, maxShotReward);

    cashArea.cashProp = mp.objects.new("prop_cash_pile_01", new mp.Vector3(dropPos.x, dropPos.y, dropPos.z - 0.2), {
        rotation: new mp.Vector3(0.0, 0.0, getRandomArbitrary(-360.0, 360.0))
    });

    cashArea.cashLabel = mp.labels.new(`$${cashArea.cashAmount}`, dropPos, {
        los: false,
        font: 0,
        drawDistance: 10.0,
        color: [114, 204, 114, 255]
    });

    cashArea.timer = setTimeout(() => {
        cashArea.timer = null;

        if (cashArea.cashProp && mp.objects.exists(cashArea.cashProp)) {
            cashArea.cashProp.destroy();
            cashArea.cashProp = null;
        }

        if (cashArea.cashLabel && mp.labels.exists(cashArea.cashLabel)) {
            cashArea.cashLabel.destroy();
            cashArea.cashLabel = null;
        }

        if (mp.colshapes.exists(cashArea)) {
            cashArea.destroy();
        }
    }, cashLife);
});

mp.events.add("cashRegisters::empty", (player) => {
    const cashRegister = cashRegisters[ player.getOwnVariable("nearCashRegisterId") ];
    if (!cashRegister || cashRegister.state !== cashRegisterState.normal) {
        return;
    }

    cashRegister.setState(cashRegisterState.emptied);

    const amount = getRandomInt(minEmptyReward, maxEmptyReward);
    player.changeCurrency("cash", amount);
    player.outputChatBox(`Got $${amount} from the cash register. (emptied)`);
});