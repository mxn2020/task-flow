if(!self.define){let e,s={};const i=(i,r)=>(i=new URL(i+".js",r).href,s[i]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=i,e.onload=s,document.head.appendChild(e)}else e=i,importScripts(i),s()})).then((()=>{let e=s[i];if(!e)throw new Error(`Module ${i} didn’t register its module`);return e})));self.define=(r,t)=>{const a=e||("document"in self?document.currentScript.src:"")||location.href;if(s[a])return;let n={};const c=e=>i(e,a),u={module:{uri:a},exports:n,require:c};s[a]=Promise.all(r.map((e=>u[e]||c(e)))).then((e=>(t(...e),n)))}}define(["./workbox-6a9ee36a"],(function(e){"use strict";importScripts(),self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"/_next/app-build-manifest.json",revision:"70d478ef68162af2a39e4b975c298452"},{url:"/_next/static/VRe13SwrwBg8o4rCuxGKq/_buildManifest.js",revision:"31c39d326a20c14789226431f2f8040c"},{url:"/_next/static/VRe13SwrwBg8o4rCuxGKq/_ssgManifest.js",revision:"b6652df95db52feb4daf4eca35380933"},{url:"/_next/static/chunks/1097-41cccf65e47d79ac.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/1823-5fcad929175a8c40.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/2151-67ed430fcb96715d.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/3011-fad78f6ac3eecb54.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/3451-60b670577f051c8a.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/4086-b4ff131e962f99b9.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/4137-f8ffc457b6b1aa88.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/4791-94d3d5e86a36affb.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/6039-26583767646b0eea.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/6892-831ffc21e5bdb19c.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/7895-98ce77d086af5620.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/7989-d069537f6f80963a.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/8151-e3b2d7c107684a3f.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/8223-a35f9179fee18414.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/8247-d7a267130e3df951.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/9224-28f6cca2a3abf235.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/9996.96e8f731eaa181df.js",revision:"96e8f731eaa181df"},{url:"/_next/static/chunks/app/_not-found/page-f70df40a182012da.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/app/admin/notifications/page-d100a7e2d260f2d7.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/app/admin/page-7c1d74e0e88543d6.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/app/api/admin/scheduled-notifications/%5Bid%5D/route-8ec9e07b5354468a.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/app/api/admin/scheduled-notifications/route-d35f50408ddd299a.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/app/api/admin/users/%5Bid%5D/role/route-35473964937b03c3.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/app/api/auth/%5B...nextauth%5D/route-ee54fe0764a6b962.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/app/api/cron/process-notifications/route-85ed3488a8a7c93b.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/app/api/keys/%5Bid%5D/route-cfaa012cea1ebd1d.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/app/api/keys/route-efde91d2c82a3375.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/app/api/keys/usage/route-7e54df35fbb16033.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/app/api/keys/verify/route-53e2deac228b48b9.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/app/api/notifications/history/route-b7813fb201ca514c.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/app/api/notifications/process/route-0ea03664144a8096.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/app/api/notifications/queue/route-5502a6b986d10a63.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/app/api/notifications/scheduled/route-5c32e8d016015a91.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/app/api/notifications/send/route-1db3e0ad079c041b.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/app/api/notifications/settings/route-4b6e820430da12d0.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/app/api/notifications/subscription/route-aa254149b3e2b914.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/app/auth/signin/page-d7e3bebd529e3ca3.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/app/auth/signup/page-89619bb3b17cac96.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/app/dashboard/layout-5b7a62598dc565a1.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/app/dashboard/page-11cb90e5faec371a.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/app/layout-752b21cc1a52d10b.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/app/not-found-0dd08cd2b03ed272.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/app/page-22c576809d70108b.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/app/profile/page-b44f675fad2ad1fc.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/app/settings/api-keys/page-381cf840f4c834dc.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/app/settings/page-4013319f6b6bdeea.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/d86a1412-824f12597910c215.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/efb370ad-7efc12cc7ad54090.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/framework-496f583738ba05a9.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/main-app-6804a7de391fac80.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/main-cbbe046ec4f4fb4c.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/pages/_app-e2409a9b4c87fcd5.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/pages/_error-9d537a00a9e58e65.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/chunks/polyfills-42372ed130431b0a.js",revision:"846118c33b2c0e922d7b3a7676f81f6f"},{url:"/_next/static/chunks/webpack-045cd0c4fb53f721.js",revision:"VRe13SwrwBg8o4rCuxGKq"},{url:"/_next/static/css/d4355d6922d24d49.css",revision:"d4355d6922d24d49"},{url:"/_next/static/media/26a46d62cd723877-s.woff2",revision:"befd9c0fdfa3d8a645d5f95717ed6420"},{url:"/_next/static/media/55c55f0601d81cf3-s.woff2",revision:"43828e14271c77b87e3ed582dbff9f74"},{url:"/_next/static/media/581909926a08bbc8-s.woff2",revision:"f0b86e7c24f455280b8df606b89af891"},{url:"/_next/static/media/6d93bde91c0c2823-s.woff2",revision:"621a07228c8ccbfd647918f1021b4868"},{url:"/_next/static/media/97e0cb1ae144a2a9-s.woff2",revision:"e360c61c5bd8d90639fd4503c829c2dc"},{url:"/_next/static/media/a34f9d1faa5f3315-s.p.woff2",revision:"d4fe31e6a2aebc06b8d6e558c9141119"},{url:"/_next/static/media/df0a9ae256c0569c-s.woff2",revision:"d54db44de5ccb18886ece2fda72bdfe0"},{url:"/file.svg",revision:"d09f95206c3fa0bb9bd9fefabfd0ea71"},{url:"/globe.svg",revision:"2aaafa6a49b6563925fe440891e32717"},{url:"/icons/icon-192x192.png",revision:"ddccf7194f0482ea61cfb1dc3310e5d3"},{url:"/icons/icon-512x512.png",revision:"d436ed4a6736c0be5f254120eab9a139"},{url:"/manifest.json",revision:"e4a5dec6f5004f860a5449cd6b53c3c7"},{url:"/next.svg",revision:"8e061864f388b47f33a1c3780831193e"},{url:"/notification.mp3",revision:"a53360cb103f1b50ab36f3d0bb501f62"},{url:"/vercel.svg",revision:"c0af2f507b369b085b35ef4bbe3bcf1e"},{url:"/window.svg",revision:"a2760511c65806022ad20adf74370ff3"}],{ignoreURLParametersMatching:[]}),e.cleanupOutdatedCaches(),e.registerRoute("/",new e.NetworkFirst({cacheName:"start-url",plugins:[{cacheWillUpdate:async({request:e,response:s,event:i,state:r})=>s&&"opaqueredirect"===s.type?new Response(s.body,{status:200,statusText:"OK",headers:s.headers}):s}]}),"GET"),e.registerRoute(/^https:\/\/.*\.supabase\.co\/.*/i,new e.NetworkFirst({cacheName:"supabase-cache",networkTimeoutSeconds:10,plugins:[]}),"GET")}));
