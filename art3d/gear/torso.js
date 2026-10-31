// ================= ART 3D GEAR: torso =================
// Body slot and back slot. Two example items, kept as templates for other clothing:
//   tunic: built from the body's inflated torso rings (ctx.body.inflate), sized from ctx.dims at build time;
//          no `bind`, so the weights are copied from the body. Paint gives the V-neck, hems and stitches.
//   cape:  spring bones. Five chains of three bones hang down the back; the cloth is skinned to them
//          (auto binding, power 3), so it swings with the walk.
(function(){
"use strict";
const{G}=H3;

// Stitches: dashes along a ring of radius r (angle-based, so they run evenly round the body).
const stitch=(p,r,pitch)=>(Math.atan2(p[0],p[2])*r*pitch)%1<0.5;

// ---------- tunic: a tan tunic with a V-neck, forearm-length sleeves, a flared skirt and a belt ----------
// mechanism: inflated body rings (ctx.body.inflate) for the bodice and sleeves; leg reach from ctx.dims for the skirt
H3.gear.register({id:"tunic",slot:"body",name:"Tunic",hides:["torso.tie","torso.lace"],
  colors:{main:"#8b7353",sleeve:"#6d5940",trim:"#4a3a2b",belt:"#3c2a1d",buckle:"#d5ad68",buckleDeep:"#bb955b",skin:"#bd8e6d",stitch:"#a58b63"},
  build(ctx){
    const{dims}=ctx,inf=ctx.body.inflate,c=n=>ctx.col(n);
    // bodice: the inflated torso rings down to the hips; the skirt flares below them, over the legs
    const legs=[...dims.rings.leg.L,...dims.rings.leg.R],reachX=Math.max(...legs.map(r=>Math.abs(r.cx)+r.rx)),reachZ=Math.max(...legs.map(r=>r.rz));
    const bodice=inf(dims.rings.torso,0.015).filter(r=>r.y>=dims.hips.y-1e-6);
    const skirt=[{y:0.6,rx:reachX+0.02,rz:reachZ+0.03,e:2.8},{y:0.5,rx:reachX+0.045,rz:reachZ+0.045,e:2.8},{y:0.44,rx:reachX+0.06,rz:reachZ+0.06,e:2.6}];
    const hemY=skirt[skirt.length-1].y;
    const tunic=G.loft([...bodice,...skirt],{seg:48,steps:4,mat:"cloth",
      pal:[{c:c("main")},{c:c("skin"),mat:"skin"},{c:c("trim"),line:false},{c:c("stitch"),line:false}],
      paint:p=>{
        // V-neck: bare skin in the V, a trim edge along it (front only)
        if(p[2]>0.03&&p[1]>1.13&&p[1]<1.32){const half=(p[1]-1.13)*0.5,d=Math.abs(Math.abs(p[0])-half);
          if(d<0.007)return 2;if(Math.abs(p[0])<half)return 1}
        // stitched hem: a trim band and a row of stitches above it
        if(p[1]<hemY+0.02)return p[1]<hemY+0.006?2:(p[1]<hemY+0.014&&stitch(p,0.2,60)?3:0);
        return 0}});

    // sleeves: the inflated arm rings down to the forearm (0.76 m), with a stitched trim cuff
    const sleeve=s=>{const keys=inf(dims.rings.arm[s].filter(r=>r.y>=0.76-1e-6),0.02);
      return G.loft(keys,{seg:30,steps:4,mat:"cloth",pal:[{c:c("sleeve")},{c:c("trim"),line:false},{c:c("stitch"),line:false}],
        paint:p=>p[1]<0.772?(p[1]<0.762?1:(p[1]<0.77&&stitch(p,0.05,70)?2:0)):0})};
    const meshes=[tunic,sleeve("L"),sleeve("R")];

    // belt at the waist, with a gold buckle on the front (bias pulls it toward the camera over the belt)
    const w=dims.waist,beltRx=w.rx+0.03,beltRz=w.rz+0.03;
    const belt=G.loft([{y:w.y-0.026,rx:beltRx,rz:beltRz,e:2.8},{y:w.y+0.026,rx:beltRx,rz:beltRz,e:2.8}],{seg:48,steps:1,mat:"leather",color:c("belt")});
    const frontZ=beltRz+0.004;
    const buckle=G.xform(G.box(0.054,0.048,0.012,{mat:"gold",pal:[{c:c("buckleDeep")}]}),{t:[0,w.y,frontZ+0.006]});
    buckle.bind={from:["torso"]};buckle.bias=0.004;
    const tongue=G.xform(G.box(0.032,0.026,0.01,{mat:"gold",color:c("buckle")}),{t:[0,w.y,frontZ+0.016]});
    tongue.bind={from:["torso"]};tongue.bias=0.008;
    meshes.push(belt,buckle,tongue);
    return{meshes};
  }});

// ---------- cape (back slot): a wide dark cape from the shoulders to the calves, hung from spring bones ----------
// mechanism: spring bones (bones + mesh.bind), with a gold clasp and two straps over the shoulders
const CAPE_X=[-0.2,-0.1,0,0.1,0.2];
H3.gear.register({id:"cape",slot:"back",name:"Cape",
  colors:{main:"#4f4536",lining:"#7d6d55",fold:"#3f3628",hem:"#3a2f25",clasp:"#d5ad68",strap:"#3a2f25"},
  build(ctx){
    const{dims}=ctx,c=n=>ctx.col(n),rz=dims.chest.rz;
    // spring chains: heads just behind the back, tails hanging 0.3 m down; each chain hangs from the chest
    const zH=-(rz+0.03),zT=-(rz+0.05),bones=[];
    CAPE_X.forEach((x,ci)=>{let par="chest";for(let k=0;k<3;k++){const y0=1.22-k*0.3,n="cape"+ci+"_"+k;
      bones.push({name:n,parent:par,head:[x,y0,zH],tail:[x,y0-0.3,zT],spring:{stiff:[34,18,10][k],drag:0.14,grav:9,wind:[0.7,1,1.2][k],r:0.03}});par=n}});   // softer toward the hem, so the cloth curls
    // the cloth: u across (flaring toward the hem), v from the shoulders (0) to the scalloped hem (1)
    const topY=x=>1.25-0.05*(x/0.26)**2,hemY=x=>0.31-0.035*Math.abs(Math.sin(Math.PI*x/0.11))**0.7;
    const cloth=G.sheet((u,v)=>{
      const x=(u*2-1)*(0.26+0.07*v),yt=topY(x),yb=hemY(x);
      return[x,yt+(yb-yt)*v,-(rz+0.035)-0.03*v+0.01*Math.sin(x*38+0.4)*(0.4+0.6*v)];
    },40,30,{mat:"cloth",back:c("lining"),
      pal:[{c:c("main")},{c:c("fold"),line:false},{c:c("hem"),line:false}],
      // fold valleys in a deeper tone, and a darker band at the hem
      paint:p=>p[1]<0.335?2:(Math.sin(p[0]*38+0.4)<-0.7?1:0)});
    cloth.bind={bones:["chest",...bones.map(b=>b.name)],power:3};
    // the clasp on the chest and a strap over each shoulder to the top of the cape
    const clasp=G.ball(0.024,0.024,0.009,{mat:"gold",color:c("clasp")});G.xform(clasp,{t:[0,1.2,rz+0.03]});clasp.bias=0.004;
    const strap=s=>G.tube([[0.035,1.205,rz+0.03],[0.13,1.25,rz],[0.2,1.275,0.02],[0.23,1.26,-0.08],[0.2,1.25,-(rz+0.035)]]
      .map(q=>({p:[s*q[0],q[1],q[2]],r:0.009})),{seg:8,steps:3,mat:"leather",color:c("strap")});
    return{meshes:[cloth,clasp,strap(1),strap(-1)],bones};
  }});
})();
