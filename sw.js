/* Self-destruct. An earlier build registered a service worker that cached the
   old device-local app; this replaces it, clears those caches and unregisters,
   so anyone still holding it gets the real app on the next load. */
self.addEventListener('install', function(){ self.skipWaiting(); });
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys()
      .then(function(keys){ return Promise.all(keys.map(function(k){ return caches.delete(k); })); })
      .then(function(){ return self.registration.unregister(); })
      .then(function(){ return self.clients.matchAll({type:'window'}); })
      .then(function(cs){ cs.forEach(function(c){ c.navigate(c.url); }); })
  );
});
