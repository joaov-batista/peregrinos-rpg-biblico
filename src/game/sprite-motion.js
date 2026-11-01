// Visual interpolation only. Combat timers, movement and collision stay authoritative.
import { getPersonPose } from './character-art.js';
const people=new WeakMap();
const damp=(from,to,rate,dt)=>from+(to-from)*(1-Math.exp(-rate*dt));
const angleDamp=(from,to,rate,dt)=>from+Math.atan2(Math.sin(to-from),Math.cos(to-from))*(1-Math.exp(-rate*dt));

export function personMotion(actor,look,st){
  let a=people.get(actor);const time=st.t||0;
  if(!a){a={time,blend:0,phase:st.walk||0,fx:st.fx||0,fy:st.fy??1};people.set(actor,a);}
  const dt=Math.max(0,Math.min(.06,time-a.time));a.time=time;
  a.blend=damp(a.blend,st.moving?1:0,st.moving?10:7,dt);
  a.phase+=dt*a.blend;
  a.fx=damp(a.fx,st.fx||0,15,dt);a.fy=damp(a.fy,st.fy??1,15,dt);
  const next={...st,fx:a.fx,fy:a.fy,moveBlend:a.blend,walk:a.phase};
  const target=getPersonPose(look,next);
  if(!a.pose)a.pose=target;
  const rate=st.atkT>0||st.spin>0?27:13;
  const hand={x:damp(a.pose.hand.x,target.hand.x,rate,dt),y:damp(a.pose.hand.y,target.hand.y,rate,dt)};
  const shoulder={x:damp(a.pose.shoulder.x,target.shoulder.x,16,dt),y:target.shoulder.y};
  const elbow={x:shoulder.x*.45+hand.x*.55+target.side*1.2,y:(shoulder.y+hand.y)/2+2.2};
  a.pose={...target,hand,shoulder,elbow,angle:angleDamp(a.pose.angle,target.angle,rate,dt)};
  return {...next,pose:a.pose};
}

export { creatureMotion } from './creature-motion.js';
