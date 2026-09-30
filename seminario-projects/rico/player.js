(()=>{
  'use strict';
  // Same renderer is embedded in the offline export. All geometry comes from Python.
  function createPlayer(canvas,data,onFrame=()=>{}){
    if(!data || !Array.isArray(data.frames) || !data.frames.length || data.frames.length>480 || !Number.isFinite(data.fps) || data.fps<1 || data.fps>60)throw new Error('Paquete de cuadros inválido');
    const ctx=canvas.getContext('2d');let raf=null,start=0,index=0;
    function draw(n){
      const f=data.frames[n];
      if(!f || !Number.isFinite(f.width) || !Number.isFinite(f.height) || f.width<1 || f.width>1280 || f.height<1 || f.height>960 || !Array.isArray(f.shapes) || f.shapes.length>200)throw new Error('Cuadro inválido');
      if(canvas.width!==f.width)canvas.width=f.width;
      if(canvas.height!==f.height)canvas.height=f.height;
      ctx.globalAlpha=1;ctx.fillStyle=f.background;ctx.fillRect(0,0,f.width,f.height);
      for(const s of f.shapes){
        ctx.save();ctx.globalAlpha=Math.max(0,Math.min(1,s.alpha??1));ctx.fillStyle=s.color||'#fff';
        if(s.kind==='polygon'){
          ctx.beginPath();s.points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();
        }else if(s.kind==='circle'){
          ctx.beginPath();ctx.arc(s.x,s.y,Math.max(0,s.r),0,Math.PI*2);ctx.fill();
        }else if(s.kind==='text'){
          ctx.font=`${s.size||26}px Arial, sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(s.text),s.x,s.y,f.width*.9);
        }
        ctx.restore();
      }
      onFrame(n+1,data.frames.length);
    }
    function pause(){if(raf!==null)cancelAnimationFrame(raf);raf=null;}
    function play(){pause();index=0;start=performance.now();draw(0);const tick=now=>{index=Math.max(0,Math.min(data.frames.length-1,Math.floor((now-start)*data.fps/1000)));draw(index);if(index<data.frames.length-1)raf=requestAnimationFrame(tick);else raf=null;};raf=requestAnimationFrame(tick);}
    draw(0);return {play,pause,draw};
  }
  function standalone(data){
    const json=JSON.stringify(data).replace(/</g,'\\u003c');
    return '<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mi mensaje animado</title><style>body{margin:0;background:#14142b;color:white;font-family:Arial;text-align:center}main{max-width:960px;margin:30px auto}canvas{width:100%;height:auto}button{margin:10px;padding:12px 18px;font:inherit;cursor:pointer}</style><main><h1>Mi mensaje animado</h1><canvas id="canvas"></canvas><div><button id="play">Reproducir</button><button id="pause">Pausa</button></div><p>Creado con Python · reproducción offline</p></main><script>const createPlayer='+createPlayer.toString()+';const data='+json+';const player=createPlayer(document.getElementById("canvas"),data);document.getElementById("play").onclick=player.play;document.getElementById("pause").onclick=player.pause;player.play();<\/script></html>';
  }
  window.RICO_PLAYER={createPlayer,standalone};
})();
