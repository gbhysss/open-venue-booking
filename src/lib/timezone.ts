export function todayInZone(timeZone: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const part = (type: string) => parts.find(x=>x.type===type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function isFutureSlot(date:string,start:string,now=new Date(),timeZone=process.env.APP_TIME_ZONE||'Asia/Shanghai') {
  const today=todayInZone(timeZone,now);
  if(date<today) return false;
  if(date>today) return true;
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(now);
  return start.slice(0,5)>parts;
}
