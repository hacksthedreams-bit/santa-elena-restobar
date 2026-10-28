import assert from 'node:assert/strict';import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import {localBucket} from './local-bucket.mjs';
const worker=(await import('../dist/server/index.js')).default;const dir=await fs.mkdtemp(path.join(os.tmpdir(),'se-api-test-'));const admin='admin@example.test',env={BUCKET:localBucket(dir),ADMIN_EMAILS:admin};
const call=(route,body,email=admin,origin='https://private.test')=>worker.fetch(new Request('https://private.test'+route,{method:body===undefined?'GET':'POST',headers:{...(email?{'oai-authenticated-user-email':email}:{}),...(body===undefined?{}:{'content-type':'application/json',origin})},...(body===undefined?{}:{body:JSON.stringify(body)})}),env);
assert.equal((await call('/api/admin/stock',{id:221,state:'unavailable'},null)).status,403);assert.equal((await call('/api/admin/stock',{id:221,state:'unavailable'},'visitor@example.test')).status,403);assert.equal((await call('/api/admin/stock',{id:221,state:'unavailable'},admin,'https://evil.test')).status,403);
assert.equal((await call('/api/admin/stock',{id:999999,state:'unavailable'})).status,400);assert.equal((await call('/api/admin/stock',{id:221,state:'invalid'})).status,400);
let r=await call('/api/admin/stock',{id:221,state:'unavailable',duration:'today'});assert.equal(r.status,200);let d=await r.json();const today=d.stock.find(x=>x.id===221);assert.equal(today.state,'unavailable');assert.ok(Date.parse(today.expiresAt)>Date.now());assert.ok(Date.parse(today.expiresAt)-Date.now()<=26*3600000);
const secondEnv={...env,BUCKET:localBucket(dir)};const second=await worker.fetch(new Request('https://private.test/api/state'),secondEnv);assert.equal((await second.json()).stock.find(x=>x.id===221).state,'unavailable');
r=await call('/api/admin/stock',{id:221,state:'available',duration:'permanent'});assert.equal((await r.json()).stock.find(x=>x.id===221).state,'available');await call('/api/admin/stock',{id:221,state:'source'});assert.equal((await (await call('/api/state')).json()).stock.length,0);
assert.equal((await call('/api/admin/settings',{featured:[99999]})).status,400);assert.equal((await call('/api/admin/settings',{hours:[{open:'24:99',close:'02:00'}]})).status,400);r=await call('/api/admin/settings',{featured:[472,426]});assert.deepEqual((await r.json()).featured,[472,426]);
const hours=Array.from({length:7},()=>({open:'18:00',close:'02:00',closed:false}));r=await call('/api/admin/settings',{hours});assert.equal((await r.json()).hours.length,7);await call('/api/admin/settings',{hours:null});assert.equal((await (await call('/api/state')).json()).hours,null);
const anonymousSession=await (await call('/api/session',undefined,null)).json();assert.equal(anonymousSession.canManage,false);assert.equal((await (await call('/api/session')).json()).canManage,true);

// --- Seguridad: cabeceras, origen estricto y rutas anómalas ---
const raw=(route,init={},e=env)=>worker.fetch(new Request('https://private.test'+route,init),e);
const adminHeaders={'oai-authenticated-user-email':admin,'content-type':'application/json'};
const stockBody=JSON.stringify({id:221,state:'source'});
for(const [route,init] of [['/',{}],['/menu.json',{}],['/api/state',{}],['/api/session',{}],['/no-existe',{}],['/media/product-221',{}]]){
  const res=await raw(route,init),h=res.headers;
  assert.match(h.get('content-security-policy')||'',/frame-ancestors 'none'/,route+' sin frame-ancestors');
  assert.equal(h.get('x-frame-options'),'DENY',route+' sin X-Frame-Options');
  assert.equal(h.get('x-content-type-options'),'nosniff');
  assert.ok((h.get('permissions-policy')||'').includes('camera=()'),route+' sin Permissions-Policy');
  assert.equal(h.get('cross-origin-opener-policy'),'same-origin');
}
const home=await raw('/');assert.match(home.headers.get('content-security-policy'),/script-src 'self'/);assert.ok(home.headers.get('content-security-policy').includes('frame-src https://maps.google.com'));
assert.equal((await raw('/constructor')).status,404);assert.equal((await raw('/__proto__')).status,404);assert.equal((await raw('/toString')).status,404);
assert.equal((await raw('/%E0%A4%A')).status,400);assert.equal((await raw('/menu.json')).status,200);
assert.equal((await raw('/api/admin/stock',{method:'POST',headers:adminHeaders,body:stockBody})).status,403,'POST sin Origin debe rechazarse');
assert.equal((await raw('/api/admin/stock',{method:'POST',headers:{...adminHeaders,'sec-fetch-site':'cross-site'},body:stockBody})).status,403);
assert.equal((await raw('/api/admin/stock',{method:'POST',headers:{...adminHeaders,'sec-fetch-site':'same-origin'},body:stockBody})).status,200);
assert.equal((await raw('/api/admin/stock',{method:'POST',headers:{...adminHeaders,origin:'https://santa-elena-carta-digital.bombvstic.chatgpt.site'},body:stockBody})).status,200,'el origen del alojamiento actual debe seguir permitido');
assert.equal((await raw('/api/admin/stock',{method:'POST',headers:{...adminHeaders,origin:'https://nuevo.example.test'},body:stockBody})).status,403);
assert.equal((await raw('/api/admin/stock',{method:'POST',headers:{...adminHeaders,origin:'https://nuevo.example.test'},body:stockBody},{...env,ALLOWED_ORIGINS:'https://otro.example.test, https://nuevo.example.test'})).status,200,'ALLOWED_ORIGINS debe ampliar los orígenes');
await fs.rm(dir,{recursive:true,force:true});console.log('API verificada: autorización, origen estricto, cabeceras de seguridad, rutas anómalas, IDs, stock por hoy, persistencia entre sesiones, restauración, favoritos y horarios.');
