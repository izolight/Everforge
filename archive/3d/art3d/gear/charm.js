// ================= ART 3D GEAR: charm (example item: pendant) =================
// A gold amulet with a gem on a leather cord, worn on the chest. Mechanisms shown here:
//   - a cord bound to the torso and neck (bind:{from:[...]}), so it moves with the shirt
//   - a spring bone (bones:[...] with spring:{...}) that the amulet hangs from: it swings with the
//     body and settles under gravity, and its parts are rigidly bound to that bone (bind:"name")
//   - bias: a small pull toward the camera so the amulet sits on top of the cloth it touches
(function(){
"use strict";
const G=H3.G;
const BIAS=0.004;
const chest={from:["torso","neck"]};
// the cord leaves one side of the neck, crosses the chest on the shirt and returns to the other side
const cord=r=>[{p:[0.06,1.25,0.1],r},{p:[0.05,1.2,0.12],r},{p:[0,1.17,0.13],r},{p:[-0.05,1.2,0.12],r},{p:[-0.06,1.25,0.1],r}];
// the amulet's spring bone: its head is the cord's lowest point (parented to the chest, so it moves
// with the torso); its tail is where the amulet hangs, and the spring pulls that tail back down
const amuletBone={name:"pendant.amulet",parent:"chest",head:[0,1.17,0.13],tail:[0,1.105,0.145],
  spring:{stiff:30,drag:0.12,grav:8,r:0.012}};
H3.gear.register({id:"pendant",slot:"charm",name:"Gold amulet on a cord",
  colors:{cord:"#6b4a2e",gold:"#d5ad68",gem:"#3e7a64"},kind:"pendant",
  build(ctx){
    const c=ctx.col;
    // the bail and coin hang from the bone's head, so they are rigid to the bone
    const coin=G.xform(G.ball(0.034,0.034,0.009,{mat:"gold",color:c("gold"),name:"pendant.coin"}),{t:[0,1.131,0.139]});
    const gem=G.xform(G.ball(0.012,0.014,0.007,{mat:"gem",color:c("gem"),name:"pendant.gem"}),{t:[0,1.131,0.151]});
    const bail=G.tube([{p:[0,1.172,0.13],r:0.0035},{p:[0,1.16,0.136],r:0.0035}],{seg:6,steps:2,mat:"gold",color:c("gold"),name:"pendant.bail"});
    const cordMesh=G.tube(cord(0.0045),{seg:8,steps:3,mat:"leather",color:c("cord"),name:"pendant.cord"});
    cordMesh.bind=chest;
    for(const m of[coin,gem,bail]){m.bind="pendant.amulet";m.bias=BIAS}
    cordMesh.bias=BIAS;
    return{meshes:[cordMesh,coin,gem,bail],bones:[amuletBone]};
  }});
})();
