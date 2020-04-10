const Natives = {
    GET_FOLLOW_PED_CAM_VIEW_MODE: "0x8D4D46230B2C353A",
    GET_GAMEPLAY_CAM_COORD: "0x14D6F5678D8F1B37",
    GET_SAFE_PICKUP_COORDS: "0x6E16BC2503FF1FF0"
};

const cashRegisterState = {
    none: 0,
    normal: 1,
    shot: 2,
    emptied: 3
};

const cashRegisterModel = mp.game.joaat("prop_till_01");
let renderEvent = null;

// Functions
function destroyRender() {
    if (renderEvent) {
        renderEvent.destroy();
        renderEvent = null;
    }
}

// Script setup
mp.game.entity.createModelHide(0.0, 0.0, 0.0, 10000.0, cashRegisterModel, true);
mp.game.streaming.requestNamedPtfxAsset("scr_ornate_heist");

// RAGEMP Events
mp.events.add("playerWeaponShot", (targetPosition, targetEntity) => {
    if (targetEntity) {
        return;
    }

    let hitEntity = null;
    if (mp.game.invoke(Natives.GET_FOLLOW_PED_CAM_VIEW_MODE) === 4 && !mp.game.player.isFreeAiming()) {
        const raycast = mp.raycasting.testPointToPoint(mp.game.invokeVector3(Natives.GET_GAMEPLAY_CAM_COORD), targetPosition, mp.players.local, [1, 16]);
        if (raycast) {
            hitEntity = raycast.entity;
        }
    } else {
        hitEntity = mp.game.player.getEntityIsFreeAimingAt();
    }

    if (!hitEntity || !mp.objects.exists(hitEntity) || hitEntity.model !== cashRegisterModel) {
        return;
    }

    if (hitEntity.hasVariable("cashRegisterId") && hitEntity.getVariable("cashRegisterState") === cashRegisterState.normal) {
        mp.events.callRemote(
            "cashRegisters::shot",
            hitEntity.getVariable("cashRegisterId"),
            JSON.stringify(mp.game.invokeVector3(Natives.GET_SAFE_PICKUP_COORDS, targetPosition.x, targetPosition.y, targetPosition.z, 0.85, 1.35))
        );
    }
});

mp.events.addDataHandler("cashRegisterState", (entity, value) => {
    if (entity.handle && value === cashRegisterState.shot) {
        mp.game.graphics.setPtfxAssetNextCall("scr_ornate_heist");
        mp.game.graphics.startParticleFxNonLoopedOnEntity("scr_heist_ornate_banknotes", entity.handle, 0.0, -0.25, 0.1, 0.0, 0.0, 0.0, 1.0, false, false, false);
    }
});

mp.events.addDataHandler("nearCashRegisterId", (entity, value) => {
    destroyRender();

    if (value) {
        renderEvent = new mp.Event("render", () => {
            mp.game.ui.setTextComponentFormat("SHR_ROBTILL");
            mp.game.ui.displayHelpTextFromStringLabel(0, false, true, -1);

            if (mp.game.controls.isControlJustPressed(0, 51)) {
                destroyRender();
                mp.events.callRemote("cashRegisters::empty");
            }
        });
    }
});