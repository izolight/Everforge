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
  colors:{main:"#159b9b",sleeve:"#168186",trim:"#174e6c",belt:"#754631",buckle:"#ffd38b",buckleDeep:"#bb955b",skin:"#c69a7d",stitch:"#efc47a"},
  build(ctx){
    const{dims}=ctx,inf=ctx.body.inflate,c=n=>ctx.col(n);
    // bodice: the inflated torso rings down to the hips; the skirt flares below them, over the legs
    const legs=[...dims.rings.leg.L,...dims.rings.leg.R],reachX=Math.max(...legs.map(r=>Math.abs(r.cx)+r.rx)),reachZ=Math.max(...legs.map(r=>r.rz));
    const bodice=inf(dims.rings.torso,0.015).filter(r=>r.y>=dims.hips.y-1e-6);
    const skirt=[{y:0.6,rx:reachX+0.02,rz:reachZ+0.03,e:2.8},{y:0.5,rx:reachX+0.045,rz:reachZ+0.045,e:2.8},{y:0.44,rx:reachX+0.06,rz:reachZ+0.06,e:2.6}];
    const hemY=skirt[skirt.length-1].y;
    const tunic=G.loft([...bodice,...skirt],{seg:18,steps:2,mat:"cloth",
      pal:[{c:c("main")},{c:c("skin"),mat:"skin"},{c:c("trim"),line:false},{c:c("stitch"),line:false}],
      paint:p=>{
        // V-neck: bare skin in the V, a trim edge along it (front only)
        if(p[2]>0.03&&p[1]>1.13&&p[1]<1.32){const half=(p[1]-1.13)*0.5,d=Math.abs(Math.abs(p[0])-half);
          if(d<0.007)return 2;if(Math.abs(p[0])<half)return 1}
        // stitched hem: a trim band and a row of stitches above it
        if(p[1]<hemY+0.02)return p[1]<hemY+0.006?2:(p[1]<hemY+0.014&&stitch(p,0.2,60)?3:0);
        // Quiet woven borders and a small embroidered compass at the breast.
        if(p[2]>0.08){
          const dx=p[0]+0.095,dy=p[1]-1.08;
          if(Math.abs(Math.abs(dx)+Math.abs(dy)-0.023)<0.002)return 3;
          if(Math.abs(dx)<0.0018&&Math.abs(dy)<0.03)return 3;
          if(Math.abs(dy)<0.0018&&Math.abs(dx)<0.03)return 3;
        }
        if(p[1]<hemY+0.043&&p[1]>hemY+0.037)return 3;
        return 0}});

    // Shallow radial folds gather under the belt and fan into the skirt.
    for(const p of tunic.v){
      const a=Math.atan2(p[0],p[2]),y=p[1];
      const gather=Math.exp(-(((y-0.79)/0.13)**2))*0.004;
      const hem=Math.max(0,Math.min(1,(0.82-y)/0.38))*0.007;
      const fold=(gather+hem)*Math.sin(a*10+y*3)+0.002*Math.sin(y*70+a*3);
      p[0]+=Math.sin(a)*fold;p[2]+=Math.cos(a)*fold;
    }
    // sleeves: the inflated arm rings down to the forearm (0.76 m), with a stitched trim cuff
    const sleeve=s=>{const keys=inf(dims.rings.arm[s].filter(r=>r.y>=0.76-1e-6),0.02);
      return G.loft(keys,{seg:12,steps:2,mat:"cloth",pal:[{c:c("sleeve")},{c:c("trim"),line:false},{c:c("stitch"),line:false}],
        paint:p=>p[1]<0.772?(p[1]<0.762?1:(p[1]<0.77&&stitch(p,0.05,70)?2:0)):0})};
    const meshes=[tunic,sleeve("L"),sleeve("R")];

    // A fitted leather shoulder guard, layered over one sleeve.
    const capKeys=inf(dims.rings.arm.L.filter(r=>r.y>=1.13),0.03);
    const cap=G.loft(capKeys,{seg:28,steps:5,mat:"leather",
      pal:[{c:c("belt")},{c:c("stitch"),line:false}],
      paint:p=>p[1]<1.142&&p[1]>1.135?1:0,bind:{from:["arm.L","torso"]}});
    meshes.push(cap);
    for(const x of[0.206,0.234,0.262]){
      const y=1.23-(x-0.206)*1.45;
      meshes.push(G.xform(G.ball(0.004,0.004,0.003,{seg:8,rings:5,mat:"gold",color:c("buckleDeep"),bind:{from:["arm.L"]}}),{t:[x,y,0.104]}));
    }
    // belt at the waist, with a gold buckle on the front (bias pulls it toward the camera over the belt)
    const w=dims.waist,beltRx=w.rx+0.03,beltRz=w.rz+0.03;
    const belt=G.loft([{y:w.y-0.026,rx:beltRx,rz:beltRz,e:2.8},{y:w.y+0.026,rx:beltRx,rz:beltRz,e:2.8}],{seg:48,steps:1,mat:"leather",color:c("belt")});
    const frontZ=beltRz+0.004;
    const buckle=G.xform(G.box(0.054,0.048,0.012,{mat:"gold",pal:[{c:c("buckleDeep")}]}),{t:[0,w.y,frontZ+0.006]});
    buckle.bind={from:["torso"]};buckle.bias=0.004;
    const tongue=G.xform(G.box(0.032,0.026,0.01,{mat:"gold",color:c("buckle")}),{t:[0,w.y,frontZ+0.016]});
    tongue.bind={from:["torso"]};tongue.bias=0.008;
    // A diagonal leather baldric adds a clear secondary line across the torso.
    const baldric=G.sheet((u,v)=>{
      const y=1.235-v*0.36,x=0.145-v*0.255+(u-0.5)*0.032;
      const rings=dims.rings.torso;let j=0;while(j<rings.length-2&&rings[j+1].y>y)j++;
      const a=rings[j],b=rings[j+1],t=Math.max(0,Math.min(1,(a.y-y)/(a.y-b.y)));
      const rx=a.rx+(b.rx-a.rx)*t+0.019,rz=a.rz+(b.rz-a.rz)*t+0.019;
      return[x,y,rz*Math.pow(Math.max(0,1-Math.pow(Math.abs(x/rx),2.8)),1/2.8)+0.009];
    },4,28,{mat:"leather",pal:[{c:c("belt")},{c:c("stitch"),line:false}],paint:p=>Math.abs(p[0]-(0.145-(1.235-p[1])/0.36*0.255))>0.011&&(p[1]*85)%1<0.42?1:0});
    baldric.bias=0.003;meshes.push(baldric);
    const shoulderBuckle=G.xform(G.box(0.043,0.034,0.009,{mat:"gold",color:c("buckleDeep")}),{rz:-0.57,t:[0.108,1.182,0.164]});
    meshes.push(shoulderBuckle);
    // Raised seams, belt stitching, rivets and a small leather utility pouch.
    for(const side of[-1,1]){
      const seam=G.tube([{p:[side*0.08,1.25,0.117],r:0.0025},{p:[side*0.055,1.18,0.147],r:0.0025},
        {p:[side*0.015,1.135,0.153],r:0.0025}],{seg:6,steps:4,mat:"cloth",color:c("stitch")});
      meshes.push(seam);
      for(let i=0;i<4;i++){
        const rivet=G.xform(G.ball(0.003,0.003,0.002,{seg:8,rings:4,mat:"gold",color:c("buckleDeep")}),{t:[side*(0.055+i*0.022),w.y,frontZ-0.002]});
        meshes.push(rivet);
      }
    }
    const pouch=G.loft([{y:0.86,rx:0.045,rz:0.019,cx:0.135,cz:0.132,e:3},
      {y:0.8,rx:0.052,rz:0.03,cx:0.14,cz:0.14,e:3},{y:0.755,rx:0.042,rz:0.024,cx:0.14,cz:0.14,e:3}],
      {seg:20,steps:3,mat:"leather",color:c("trim")});
    const flap=G.xform(G.box(0.084,0.035,0.012,{mat:"leather",color:c("belt")}),{t:[0.14,0.841,0.167]});
    const stud=G.xform(G.ball(0.006,0.006,0.003,{seg:10,rings:5,mat:"gold",color:c("buckle")}),{t:[0.14,0.833,0.176]});
    meshes.push(belt,buckle,tongue,pouch,flap,stud);
    return{meshes};
  }});

// ---------- cape (back slot): a wide dark cape from the shoulders to the calves, hung from spring bones ----------
// mechanism: spring bones (bones + mesh.bind), with a gold clasp and two straps over the shoulders
const CAPE_X=[-0.2,-0.1,0,0.1,0.2];
H3.gear.register({id:"cape",slot:"back",name:"Cape",
  colors:{main:"#565492",lining:"#aa7393",fold:"#3c3f7e",hem:"#353666",clasp:"#d5ad68",strap:"#3a2f25"},
  build(ctx){
    const{dims}=ctx,c=n=>ctx.col(n),rz=dims.chest.rz;
    // spring chains: heads just behind the back, tails hanging 0.3 m down; each chain hangs from the chest
    const zH=-(rz+0.03),zT=-(rz+0.05),bones=[];
    CAPE_X.forEach((x,ci)=>{let par="chest";for(let k=0;k<3;k++){const y0=1.22-k*0.3,n="cape"+ci+"_"+k;
      bones.push({name:n,parent:par,head:[x,y0,zH],tail:[x,y0-0.3,zT],spring:{stiff:[34,18,10][k],drag:0.14,grav:9,wind:[0.7,1,1.2][k],r:0.03}});par=n}});   // softer toward the hem, so the cloth curls
    // the cloth: u across (flaring toward the hem), v from the shoulders (0) to the scalloped hem (1)
    const topY=x=>1.25-0.05*(x/0.26)**2,hemY=x=>0.29+0.14*Math.abs(x/0.33)+0.04*x;
    const cloth=G.sheet((u,v)=>{
      const x=(u*2-1)*(0.26+0.07*v),yt=topY(x),yb=hemY(x);
      return[x,yt+(yb-yt)*v,-(rz+0.035)-0.03*v+0.028*Math.sin(x*25+0.4)*(0.4+0.6*v)-0.09*v*v];
    },16,12,{mat:"cloth",back:c("lining"),
      pal:[{c:c("main")},{c:c("fold"),line:false},{c:c("hem"),line:false},{c:c("lining"),line:false}],
      // fold valleys in a deeper tone, and a darker band at the hem
      paint:p=>{
        const v=Math.max(0,Math.min(1,(1.25-p[1])/0.96)),edge=0.26+0.07*v-Math.abs(p[0]);
        const hem=p[1]-hemY(p[0]);
        if(hem<0.018||edge<0.012)return 2;
        if((hem>0.027&&hem<0.032)||(edge>0.019&&edge<0.023&&(p[1]*80)%1<0.48))return 3;
        // A restrained compass emblem between the shoulder blades.
        const dx=p[0],dy=p[1]-1.06,d=Math.abs(dx)+Math.abs(dy);
        if(Math.abs(d-0.041)<0.0025||Math.abs(dx)<0.002&&Math.abs(dy)<0.052)return 3;
        return Math.sin(p[0]*38+0.4)<-0.7?1:0;
      }});
    cloth.bind={bones:["chest",...bones.map(b=>b.name)],power:3};
    // the clasp on the chest and a strap over each shoulder to the top of the cape
    const clasp=G.ball(0.024,0.024,0.009,{mat:"gold",color:c("clasp")});G.xform(clasp,{t:[0,1.2,rz+0.03]});clasp.bias=0.004;
    const strap=s=>G.tube([[0.035,1.205,rz+0.03],[0.13,1.25,rz],[0.2,1.275,0.02],[0.23,1.26,-0.08],[0.2,1.25,-(rz+0.035)]]
      .map(q=>({p:[s*q[0],q[1],q[2]],r:0.009})),{seg:8,steps:3,mat:"leather",color:c("strap")});
    return{meshes:[cloth,clasp,strap(1),strap(-1)],bones};
  }});
})();
