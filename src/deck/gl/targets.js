/* Particle target shapes for the six scenes. Ported from the artifact prototype: each scene is a
   function that returns one particle per call as [x, y, z, tag]; the shader decides colour and
   motion from the tag (0 ice, 1 support, 2 brand, 3 water, 4 wave field, 5/6.x Berlin markers,
   7 globe atmosphere, 8 tool icons, 9/10 helix + planet bands, 12 dust, 13 brand accents, 14 smoke). */
import LAND_B64 from './landmask';

export const LAT_B = 52.52 * Math.PI / 180;
export const LON_B = 13.40 * Math.PI / 180;

/** Where the "group" scenes (about, planet, globe) sit, and how big they are. */
export function layout(W, VH) { return { cx: W * .235, cy: -VH * .02, size: Math.min(W * .46, VH * .84) }; }

const LAND = (function () {
  const s = atob(LAND_B64), a = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i);
  return function (x, y) { const i = y * 240 + x; return (a[i >> 3] >> (7 - (i & 7))) & 1; };
})();

/* The name is two lines of display type. Measured on the glyphs: the first line's capitals start
   NAME_TOP_EM below the block's origin, the second line's baseline sits NAME_HEIGHT_EM below it. */
const NAME_TOP_EM = 0.14, NAME_HEIGHT_EM = 1.79, NAME_MIN_PX = 36, NAME_GAP_PX = 20;

/**
 * Size and place the particle name so it can never run into the hero text: it must fit between the
 * role line above it and the description block below it, whatever the viewport's shape.
 *
 * @param {number} W    viewport width, px
 * @param {number} VH   viewport height, px
 * @param {{top:number,bottom:number}|null} box  free vertical band in viewport px (null = use proportions only)
 * @returns {{fs:number, yTop:number}}  font size and the y of the text block's origin
 */
export function fitName(W, VH, box) {
  let fs = Math.min(W * 0.12, VH * 0.235), yTop = VH * 0.2;
  if (box && box.bottom - box.top > 0) {
    const top = box.top + NAME_GAP_PX, avail = box.bottom - NAME_GAP_PX - top;
    fs = Math.max(NAME_MIN_PX, Math.min(fs, avail / NAME_HEIGHT_EM));
    yTop = top + Math.max(0, (avail - NAME_HEIGHT_EM * fs) / 2) - NAME_TOP_EM * fs;
  }
  return { fs, yTop };
}

/** Build all six targets for a viewport of W x VH with N particles. `nameBox` is the free band for the name (see fitName). */
export function buildAll(W, VH, N, nameBox) {
  var PLANET_R = 100, GLOBE_R = 150, HELIX_H = 200, WORK_C = [];
function rnd(a,b){return a+Math.random()*(b-a)}
function gauss(){var u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
function makeTarget(fn){
  var pos=new Float32Array(N*3), tag=new Float32Array(N);
  for(var i=0;i<N;i++){var r=fn(); pos[i*3]=r[0]; pos[i*3+1]=r[1]; pos[i*3+2]=r[2]||0; tag[i]=r[3]||0}
  return {pos:pos,tag:tag};
}
function pickTag(pv,pa){var r=Math.random(); return r<pa?2:(r<pa+pv?1:0)}
var DUST_TAG=12;
function dust(){return [rnd(-W*.62,W*.62),rnd(-VH*.62,VH*.62),rnd(-420,260),DUST_TAG]}
function raster(w,h,draw){w=Math.max(1,w|0);h=Math.max(1,h|0);var c=document.createElement('canvas');c.width=w;c.height=h;var g=c.getContext('2d');draw(g);return g.getImageData(0,0,w,h).data}
function pixPts(d,w,h,step,keep){var o=[];for(var y=0;y<h;y+=step)for(var x=0;x<w;x+=step){if(d[(y*w+x)*4+3]>128&&(!keep||keep(x,y)))o.push([x,y])}return o}
function layerFn(layers,cw,ch,cx,cy,k,dustP){
  var tot=0; layers.forEach(function(l){tot+=l.wgt});
  return function(){
    if(Math.random()<dustP) return dust();
    var r=Math.random()*tot, l=layers[0];
    for(var i=0;i<layers.length;i++){ if(r<layers[i].wgt){l=layers[i];break} r-=layers[i].wgt }
    var p=l.p[(Math.random()*l.p.length)|0];
    return [cx+(p[0]-cw/2)*k+rnd(-1.1,1.1), cy-(p[1]-ch/2)*k+rnd(-1.1,1.1), rnd(-8,8), typeof l.tag==='function'?l.tag():l.tag];
  };
}
var lay=function(){ return layout(W,VH) };

function sampleText(lines,fs,x0,yTop,lh){
  var cw=Math.ceil(W/2), ch=Math.ceil(VH/2);
  var d=raster(cw,ch,function(g){g.fillStyle='#fff'; g.font='800 '+(fs/2)+'px Unbounded, Arial Black, sans-serif'; g.textBaseline='alphabetic';
    lines.forEach(function(t,i){g.fillText(t,x0/2,(yTop+fs*(.86+i*lh))/2)})});
  var pts=[]; for(var y=0;y<ch;y++)for(var x=0;x<cw;x++){ if(d[(y*cw+x)*4+3]>128) pts.push([x*2-W/2,VH/2-y*2]) }
  return pts;
}

/* about: a double helix built from genuinely hollow tubes — identity at the structural
   level, not a portrait. Each strand is a ring of points around the helix curve (a
   torus cross-section, empty in the middle) rather than a filled blob, so it reads as
   a tube, not a solid vine — no rungs crossing it. Top/bottom glow-fade in the shader
   so it reads as an endless column. A small, exactly-counted set of points (tag 13,
   ~3 expected across the whole shape — not a per-frame probability over thousands of
   points, which is what made an earlier version glow as one solid block) get a bright
   brand pulse. Loose dust is scattered in a halo around the tube using the ordinary
   DUST_TAG particles — the same idle-jitter motion already proven working on every
   other scene — instead of inventing new per-particle physics that couldn't be
   confirmed working. */
function helixFn(S){
  var H=S*1.2, RAD=S*.09, TUBE_R=S*.034, TURNS=1.9, ACC_P=3/Math.max(1,N);
  HELIX_H=H;
  return function(){
    var q=Math.random();
    if(q<ACC_P){
      var afy=Math.random(), ay=(afy-.5)*H, ath=afy*TURNS*6.2832+(Math.random()<.5?3.14159:0), ar=RAD*(1+rnd(-.1,.1));
      return [Math.cos(ath)*ar,ay,Math.sin(ath)*ar,13];
    }
    if(q<.05) return dust();
    if(q<.34){
      // smoke: spawned near the tube surface (jittered, not a clean line) so it puffs
      // out from random spots rather than reading as one thin uniform stream (tag 14)
      var sy=rnd(-H/2,H/2), sfy=sy/H+.5, sth=sfy*TURNS*6.2832+(Math.random()<.5?3.14159:0);
      var sr=RAD*(1+rnd(-.5,.5));
      return [Math.cos(sth)*sr,sy+rnd(-H*.03,H*.03),Math.sin(sth)*sr,14];
    }
    // strand: a hollow ring cross-section riding the helix curve — a tube, not a blob
    var y=rnd(-H/2,H/2), fy=y/H+.5, side=Math.random()<.5;
    var th=fy*TURNS*6.2832+(side?3.14159:0);
    var cx=Math.cos(th)*RAD, cz=Math.sin(th)*RAD;
    var ang=Math.random()*6.2832, rr=TUBE_R*(.86+Math.random()*.14);
    var ox=Math.cos(th)*Math.cos(ang)*rr, oz=Math.sin(th)*Math.cos(ang)*rr, oy=Math.sin(ang)*rr;
    return [cx+ox,y+oy,cz+oz,side?10:9];
  };
}

/* experience: a career skyline and the maritime ship, four landmarks the domain tabs glow */
function workLayers(){
  var cw=700, ch=520, base=400, rr=Math.random;
  var C=[[75,335],[195,275],[330,235],[560,420]];
  var ice=raster(cw,ch,function(g){
    g.fillStyle='#fff'; g.strokeStyle='#fff'; g.lineWidth=4;
    [[30,90,130],[140,110,250],[270,120,330]].forEach(function(b){
      g.strokeRect(b[0],base-b[2],b[1],b[2]);
      for(var y=base-b[2]+10;y<base-4;y+=9) g.fillRect(b[0]+4,y,b[1]-8,2);
    });
    g.fillRect(324,base-330-46,3,46);
    g.beginPath(); g.moveTo(20,base); g.lineTo(700,base); g.lineWidth=3; g.stroke();
    g.beginPath(); g.moveTo(430,base-6); g.lineTo(690,base-6); g.lineTo(660,base+50); g.lineTo(456,base+50); g.closePath(); g.lineWidth=5; g.stroke();
    g.fillRect(452,base+8,206,3);
    g.strokeRect(628,base-84,52,78); g.fillRect(636,base-104,20,20);
    g.fillRect(668,base-120,3,36);
  });
  var vio=raster(cw,ch,function(g){
    g.fillStyle='#fff'; for(var r=0;r<3;r++)for(var c=0;c<8;c++){ if(r===2&&c>5) continue; g.fillRect(452+c*22,base-32-r*24,19,20) }
  });
  var amb=raster(cw,ch,function(g){
    g.fillStyle='#fff';
    [[30,90,130],[140,110,250],[270,120,330]].forEach(function(b){
      for(var y=base-b[2]+18;y<base-16;y+=24)for(var x=b[0]+12;x<b[0]+b[1]-14;x+=20){ if(rr()<.42) g.fillRect(x,y,9,12) }
    });
    g.fillRect(640,base-70,8,10); g.fillRect(656,base-70,8,10); g.fillRect(640,base-50,8,10);
    g.beginPath(); g.arc(669,base-124,7,0,6.2832); g.fill();
    g.beginPath(); g.arc(325,base-380,6,0,6.2832); g.fill();
  });
  var wat=raster(cw,ch,function(g){
    g.strokeStyle='#fff'; g.lineWidth=3;
    for(var r=0;r<4;r++){ g.beginPath(); for(var x=0;x<=cw;x+=8){ var y=base+58+r*17+Math.sin(x*.045+r)*4; if(x===0) g.moveTo(x,y); else g.lineTo(x,y) } g.stroke() }
  });
  return {w:cw,h:ch,C:C,layers:[{p:pixPts(ice,cw,ch,2),tag:0,wgt:50},{p:pixPts(vio,cw,ch,2),tag:1,wgt:14},{p:pixPts(amb,cw,ch,1),tag:2,wgt:12},{p:pixPts(wat,cw,ch,3),tag:3,wgt:24}]};
}

/* toolkit: a banded planet with a ringed system (tags 9/10 planet, 8 ring; spun in the shader) */
/* six small, recognisable tool glyphs — not the ring, six tiny icons riding it. Each
   occupies its own slice of the orbit and spins around the planet with the same
   animation the ring used to use, so "revolve" comes for free from the existing shader. */
function toolIcons(){
  var K=64;
  function ic(draw){ return pixPts(raster(K,K,draw),K,K,1) }
  var glyphs=[
    ic(function(g){ g.fillStyle='#fff'; g.font='900 30px Unbounded, Arial Black, sans-serif'; g.textBaseline='middle'; g.textAlign='center'; g.fillText('</>',32,34) }),
    ic(function(g){ g.strokeStyle='#fff'; g.lineWidth=3; g.beginPath(); g.ellipse(32,18,20,8,0,0,6.2832); g.stroke(); g.beginPath(); g.moveTo(12,18); g.lineTo(12,46); g.ellipse(32,46,20,8,0,3.1416,6.2832); g.lineTo(52,18); g.stroke() }),
    ic(function(g){ g.strokeStyle='#fff'; g.lineWidth=3; g.strokeRect(14,14,36,36); g.strokeRect(22,22,20,20) }),
    ic(function(g){ g.strokeStyle='#fff'; g.fillStyle='#fff'; g.lineWidth=3; var p=[[32,12],[14,48],[50,48]]; g.beginPath(); g.moveTo(p[0][0],p[0][1]); g.lineTo(p[1][0],p[1][1]); g.lineTo(p[2][0],p[2][1]); g.closePath(); g.stroke(); p.forEach(function(n){g.beginPath(); g.arc(n[0],n[1],5,0,6.2832); g.fill()}) }),
    ic(function(g){ g.strokeStyle='#fff'; g.lineWidth=3; g.strokeRect(18,18,28,28); [24,32,40].forEach(function(v){ g.beginPath(); g.moveTo(v,18); g.lineTo(v,10); g.stroke(); g.beginPath(); g.moveTo(v,46); g.lineTo(v,54); g.stroke(); g.beginPath(); g.moveTo(18,v); g.lineTo(10,v); g.stroke(); g.beginPath(); g.moveTo(46,v); g.lineTo(54,v); g.stroke() }) }),
    ic(function(g){ g.fillStyle='#fff'; g.beginPath(); g.arc(24,34,13,0,6.2832); g.arc(38,30,15,0,6.2832); g.arc(48,36,10,0,6.2832); g.fill(); g.fillRect(16,34,38,12) }),
  ];
  return glyphs;
}
function planetFn(R){
  var icons=toolIcons(), N_ICONS=icons.length, SLOTS=18, wedge=6.2832/SLOTS*.4;
  var ringR=R*1.82, TILT_H=R*.6;
  return function(){
    var q=Math.random();
    if(q<.03) return dust();
    if(q<.34){
      var slot=(Math.random()*SLOTS)|0, idx=slot%N_ICONS, pts=icons[idx], p=pts[(Math.random()*pts.length)|0];
      var baseA=slot/SLOTS*6.2832;
      var da=(p[0]/64-.5)*wedge, dy=(p[1]/64-.5)*26;
      var a=baseA+da;
      return [Math.cos(a)*ringR,dy+Math.cos(a)*TILT_H,Math.sin(a)*ringR,8];
    }
    var u=Math.random()*2-1, lon=Math.random()*6.2832, cl=Math.sqrt(1-u*u), rr=R*(1+rnd(-.006,.006));
    var band=Math.floor((u+1)*5);
    if(Math.random()<.014) return [rr*cl*Math.cos(lon),rr*u,rr*cl*Math.sin(lon),2];
    return [rr*cl*Math.cos(lon),rr*u,rr*cl*Math.sin(lon),(band%2)?10:9];
  };
}

/* contact: Earth from real land data, Berlin blinking */
function globeFn(R){
  var pB=[R*Math.cos(LAT_B)*Math.sin(LON_B),R*Math.sin(LAT_B),R*Math.cos(LAT_B)*Math.cos(LON_B)];
  var eE=[Math.cos(LON_B),0,-Math.sin(LON_B)], nN=[-Math.sin(LAT_B)*Math.sin(LON_B),Math.cos(LAT_B),-Math.sin(LAT_B)*Math.cos(LON_B)];
  return function(){
    var q=Math.random();
    if(q<.016) return [pB[0]*1.014+gauss()*3.2,pB[1]*1.014+gauss()*3.2,pB[2]*1.014+gauss()*3.2,5];
    if(q<.035){
      var i=(Math.random()*4)|0, r=R*.03*(i+1), th=Math.random()*6.2832, ox=Math.cos(th)*r, oy=Math.sin(th)*r;
      var x=pB[0]+eE[0]*ox+nN[0]*oy, y=pB[1]+eE[1]*ox+nN[1]*oy, z=pB[2]+eE[2]*ox+nN[2]*oy, l=Math.hypot(x,y,z)||1;
      return [x/l*R*1.008,y/l*R*1.008,z/l*R*1.008,6+i/10];
    }
    // ranges below are checked in order with an early return, so they must stay
    // non-overlapping — the old q<.08 dust check sat after this q<.13 atmosphere
    // check and could never fire at all, which is why land density looked unchanged
    if(q<.09){ var rr=R*.88*Math.cbrt(Math.random()), a=Math.random()*6.2832, b=Math.acos(2*Math.random()-1); return [rr*Math.sin(b)*Math.cos(a),rr*Math.cos(b),rr*Math.sin(b)*Math.sin(a),7] }
    if(q<.12) return dust();
    for(var k=0;k<14;k++){
      var u=Math.random()*2-1, lon=Math.random()*6.2832-3.14159, lat=Math.asin(u);
      var gx=Math.min(239,Math.floor((lon+3.14159)/6.2832*240)), gy=Math.min(119,Math.floor((1.5708-lat)/3.14159*120));
      var land=LAND(gx,gy);
      if(land||Math.random()<.02){ var cl=Math.sqrt(1-u*u), rad=R*(1+rnd(-.004,.004)); return [rad*cl*Math.sin(lon),rad*u,rad*cl*Math.cos(lon),land?pickTag(.1,0):1] }
    }
    return dust();
  };
}

function buildTargets(){
  var L=lay(), t=[];
  // 0 hello: the name
  var fit=fitName(W,VH,nameBox), fs=fit.fs, pts=sampleText(['NISHAN','POOJARY'],fs,W*.05,fit.yTop,1.02);
  t.push(makeTarget(function(){
    if(Math.random()<.84&&pts.length){var p=pts[(Math.random()*pts.length)|0]; return [p[0]+rnd(-1.3,1.3),p[1]+rnd(-1.3,1.3),rnd(-7,7),pickTag(.13,.025)]}
    return dust();
  }));
  // 1 about: centred on the origin like the planet/globe, moved into place by the group
  t.push(makeTarget(helixFn(L.size)));
  // 2 experience
  var K=workLayers(), kk=Math.min(W*.47,VH*.8)/K.w;
  t.push(makeTarget(layerFn(K.layers,K.w,K.h,L.cx,L.cy,kk,.05)));
  WORK_C=K.C.map(function(c){return [L.cx+(c[0]-K.w/2)*kk, L.cy-(c[1]-K.h/2)*kk, 96*kk]});
  // 3 projects: a dense data grid covering the whole background, waving continuously (tag 4)
  t.push(makeTarget(function(){
    if(Math.random()<.05) return dust();
    var gx=Math.floor(Math.random()*64), gz=Math.floor(Math.random()*22);
    var x=(gx/64-.5)*W*1.5+rnd(-10,10), z=(gz/22-.5)*640+rnd(-8,8);
    var y=(Math.random()-.5)*VH*.5+Math.sin(x*.017+z*.014)*30;
    return [x,y,z,4];
  }));
  // 4 toolkit + 5 contact: centred on the origin, moved into place by the group
  PLANET_R=L.size*.2; GLOBE_R=L.size*.4;
  t.push(makeTarget(planetFn(PLANET_R)));
  t.push(makeTarget(globeFn(GLOBE_R)));
  return t;
}
  var targets = buildTargets();
  return { targets: targets, WORK_C: WORK_C, PLANET_R: PLANET_R, GLOBE_R: GLOBE_R, HELIX_H: HELIX_H };
}
