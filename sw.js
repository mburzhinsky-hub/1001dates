const CACHE="1001-dates-reference-ui-v22";
const CORE=[
  "./",
  "./index.html",
  "./styles-final.css?v=oct1&invite=3&prep=1",
  "./motion-final.css?v=motion2",
  "./october-reference.css?v=ref2&rollback=2&portrait=1",
  "./app-final.js?v=oct5&rollback=2&portrait=1&invite=3&prep=2",
  "./engine-v14.js?v=duration5",
  "./scenario-visuals.js?v=1",
  "./preparation.js?v=1",
  "./engine.js?base=duration5",
  "./data/seed.js",
  "./data/scenarios.js",
  "./manifest.webmanifest?v=portrait1",
  "./assets/icon.svg?v=2"
];
const SNAPSHOT_PATH="/data/kudago.generated.js";

async function networkFirst(request, fallback=null) {
  try {
    const response=await fetch(request);
    if(response&&response.ok){
      const cache=await caches.open(CACHE);
      await cache.put(request,response.clone());
    }
    return response;
  } catch {
    return (await caches.match(request)) || (fallback ? await caches.match(fallback,{ignoreSearch:true}) : undefined);
  }
}

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;

  if(url.pathname.endsWith(SNAPSHOT_PATH)){
    event.respondWith(networkFirst(event.request));
    return;
  }

  const nav=event.request.mode==="navigate"||url.pathname.endsWith("/index.html")||url.pathname.endsWith("/");
  if(nav){
    event.respondWith(networkFirst(event.request,"./index.html"));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached=>cached||fetch(event.request).then(async response=>{
      if(response&&response.ok){
        const cache=await caches.open(CACHE);
        await cache.put(event.request,response.clone());
      }
      return response;
    }))
  );
});
