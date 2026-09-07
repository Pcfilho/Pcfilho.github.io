import { t, L } from '../i18n.js';
import { esc, EXT } from '../dom.js';
import { profile } from '../data/profile.js';
import { apps } from '../data/apps.js';

export const id = 'phone';
let rootEl = null;

// Desktop keeps overflow-y:auto so the mouse wheel can scroll inside the phone.
var PB_TOUCH = (typeof matchMedia === 'function' && matchMedia('(pointer:coarse)').matches) || ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
var PB_HOME_OVERFLOW = PB_TOUCH ? 'hidden' : 'auto';

// ── State (persisted, phone-local; language now comes from js/i18n.js) ──
var ps = {
  openApp: null,
  page: 0,
  editMode: false,
  appOrder: (function(){ try{ var v=JSON.parse(localStorage.getItem('pb_apporder')); return (v&&v.length)?v:null; }catch(e){ return null; } })(),
  // the "tap an app" nudge shows until the visitor opens their first app, then never again
  hinted: (function(){ try{ return localStorage.getItem('pb_hinted')==='1'; }catch(e){ return false; } })()
};
function save(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }

const copy = {
  title: L('Tap an app', 'Toca num app'),
  sub: L('4 apps shipped to the stores · pro work', '4 apps publicados nas lojas · trabalho'),
  annot: L('go on, tap an app', 'vai, toca num app'),
  back: L('Back', 'Voltar'),
  lblProblem: L('The problem', 'O problema'),
  lblBuild: L('What I built', 'O que construí'),
  lblImpact: L('Impact', 'Impacto'),
  shippedApps: L('Shipped apps', 'Apps publicados'),
  roleShort: profile.role
};

// ── Render helpers ────────────────────────────────────────────────────────
function orderedApps(){
  var byKey = {}; apps.forEach(function(a){ byKey[a.key]=a; });
  var keys = ps.appOrder;
  if(keys && keys.length===apps.length && keys.every(function(k){ return byKey[k]; })) return keys.map(function(k){ return byKey[k]; });
  return apps;
}

function statusBarView(){
  var batt = '<span style="display:inline-block;width:17px;height:11px;border:1.5px solid #fff;border-radius:3px;position:relative;"><span style="position:absolute;inset:1.5px;background:#fff;border-radius:1px;"></span></span>';
  var wifi = '<svg width="16" height="12" viewBox="0 0 16 12" fill="#fff" style="opacity:.95"><path d="M8 2.2C5.2 2.2 2.7 3.3 1 5.1l1.4 1.4C3.8 5 5.8 4.1 8 4.1s4.2.9 5.6 2.4L15 5.1C13.3 3.3 10.8 2.2 8 2.2z"/><path d="M8 6c-1.5 0-2.9.6-3.8 1.6L5.6 9C6.2 8.4 7.1 8 8 8s1.8.4 2.4 1l1.4-1.4C10.9 6.6 9.5 6 8 6z"/><circle cx="8" cy="10.4" r="1.2"/></svg>';
  var sig = '<svg width="17" height="11" viewBox="0 0 17 11" fill="#fff"><rect x="0" y="7.5" width="3" height="3.5" rx="1"/><rect x="4.6" y="5" width="3" height="6" rx="1"/><rect x="9.2" y="2.5" width="3" height="8.5" rx="1"/><rect x="13.8" y="0" width="3" height="11" rx="1"/></svg>';
  var right = ps.editMode
    ? '<button onclick="PB.exitEdit(event)" style="pointer-events:auto;cursor:pointer;border:1px solid rgba(255,255,255,.4);background:rgba(255,255,255,.18);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);color:#fff;font-weight:800;font-size:12px;letter-spacing:.2px;padding:5px 15px;border-radius:999px;font-family:var(--font-text);box-shadow:0 2px 12px rgba(0,0,0,.3);text-shadow:none;">OK</button>'
    : '<span style="display:flex;align-items:center;gap:6px;">'+sig+wifi+batt+'</span>';
  return '<div style="position:absolute;top:0;left:0;right:0;display:flex;justify-content:space-between;align-items:center;color:#fff;font-size:14px;font-weight:700;padding:26px 24px 0;text-shadow:0 1px 3px rgba(0,0,0,.3);z-index:6;pointer-events:none;">'
    + '<span id="pb-clock">9:41</span>'
    + right + '</div>';
}

function page0Apps(){
  var stats = profile.stats.map(function(s){
    return '<div style="flex:1;background:rgba(255,255,255,.18);border-radius:12px;padding:8px 6px;text-align:center;">'
      + '<div style="font-size:17px;font-weight:800;color:#fff;line-height:1;">'+esc(s.v)+'</div>'
      + '<div style="font-size:8.5px;color:rgba(255,255,255,.88);font-weight:600;margin-top:3px;line-height:1.15;">'+esc(t(s.l))+'</div></div>';
  }).join('');
  var edit = ps.editMode;
  var icons = orderedApps().map(function(app, idx){
    var del = edit ? '<button class="pb-del" onclick="PB.tryDelete(\''+app.key+'\',event)" aria-label="'+esc(t(L('Remove','Remover')))+'" style="position:absolute;top:-7px;left:-7px;z-index:4;width:22px;height:22px;border-radius:50%;border:none;background:#ededed;color:#222;font-size:18px;font-weight:800;line-height:0;cursor:pointer;box-shadow:0 1px 5px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;padding:0;">−</button>' : '';
    // Coach-mark on the first app (Collective Health, the most important role):
    // the OS 👆 emoji at the icon's bottom-right corner, tilted like a cursor,
    // with a looping tap. Stays until the visitor opens any app, then never again.
    var tapHint = (idx===0 && !ps.hinted && !edit)
      ? '<div class="pb-taphint" aria-hidden="true"><span class="ring"></span>'
        + '<span class="poke" style="left:-16px;bottom:-17px;transform:rotate(24deg);">'
        + '<span class="pk" style="animation-name:pb-poke-dl;"><span class="pk-emoji">👆</span></span>'
        + '</span></div>'
      : '';
    return '<div class="pb-appicon" data-key="'+app.key+'" style="position:relative;display:flex;justify-content:center;">'
      + '<div class="'+(edit?'pb-jig':'')+'" style="display:flex;flex-direction:column;align-items:center;gap:7px;width:60px;">'
      +   '<div style="position:relative;width:60px;height:60px;">'+del
      +     '<button onclick="PB.openApp(\''+app.key+'\')" class="pb-app" style="display:block;width:60px;height:60px;border:none;background:none;padding:0;cursor:pointer;">'
      +       '<div style="width:60px;height:60px;border-radius:15px;background:'+app.iconBg+';box-shadow:0 5px 14px rgba(0,0,0,.3);overflow:hidden;position:relative;">'
      +         '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:24px;">'+esc(app.mono)+'</div>'
      +         '<img src="'+app.icon+'" alt="'+esc(app.name)+'" draggable="false" style="position:absolute;inset:0;width:60px;height:60px;object-fit:cover;" onerror="this.remove()">'
      +       '</div>'
      +     '</button>'
      +     tapHint
      +   '</div>'
      +   '<span style="font-size:10.5px;color:#fff;font-weight:600;text-shadow:0 1px 3px rgba(0,0,0,.5);text-align:center;line-height:1.1;">'+esc(app.short)+'</span>'
      + '</div>'
      + '</div>';
  }).join('');
  var gridLabel = edit ? t(L('Drag to rearrange','Arraste pra reorganizar')) : t(copy.shippedApps);
  return '<div style="height:100%;overflow-x:hidden;overflow-y:'+PB_HOME_OVERFLOW+';padding:58px 18px 124px;">'
    + '<div onclick="PB.goAbout()" title="'+esc(t(L('About me','Sobre mim')))+'" style="cursor:pointer;background:rgba(255,255,255,.08);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,.14);border-radius:24px;padding:16px;margin-bottom:22px;box-shadow:0 8px 24px rgba(0,0,0,.2);">'
    +   '<div style="display:flex;align-items:center;gap:12px;margin-bottom:13px;">'
    +     '<div style="width:50px;height:50px;border-radius:50%;border:2px solid rgba(255,255,255,.6);overflow:hidden;flex:none;position:relative;background:linear-gradient(135deg,#ff8a3d,#ff6a1a);display:flex;align-items:center;justify-content:center;"><span style="color:#fff;font-weight:800;font-size:17px;">PB</span><img src="'+profile.avatar+'" alt="'+esc(profile.name)+'" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" onerror="this.remove()"></div>'
    +     '<div style="min-width:0;"><div style="font-size:17px;font-weight:800;color:#fff;line-height:1.1;">'+esc(profile.name)+'</div><div style="font-size:12px;color:rgba(255,255,255,.88);font-weight:600;">'+esc(t(copy.roleShort))+'</div><div style="font-size:10.5px;color:rgba(255,255,255,.72);font-weight:600;margin-top:1px;">'+(new Date().getFullYear() - profile.since)+'+ '+esc(t(L('years shipping','anos publicando')))+'</div></div>'
    +   '</div>'
    +   '<div style="display:flex;gap:7px;">'+stats+'</div>'
    + '</div>'
    + '<div style="font-size:11px;font-weight:700;color:rgba(255,255,255,.92);letter-spacing:1px;text-transform:uppercase;padding:0 6px 12px;text-shadow:0 1px 3px rgba(0,0,0,.3);">'+esc(gridLabel)+'</div>'
    + '<div id="pb-appgrid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px 8px;">'+icons+'</div>'
    + '</div>';
}

function page1Widgets(){
  // temperature: Fahrenheit for US-style regions (from the browser locale), Celsius elsewhere
  var tC = 31;
  var region = ((navigator.language || 'en').split('-')[1] || '').toUpperCase();
  var temp = (['US','LR','KY','BS','BZ','PW','FM','MH'].indexOf(region) >= 0) ? Math.round(tC*9/5 + 32) + '°F' : tC + '°C';
  var rays = '';
  for(var r=0;r<8;r++){ rays += '<span style="position:absolute;left:50%;top:50%;width:3px;height:11px;background:#ffd34d;border-radius:2px;transform:translate(-50%,-50%) rotate('+(r*45)+'deg) translateY(-30px);"></span>'; }
  var weather = '<div style="border-radius:20px;overflow:hidden;position:relative;background:linear-gradient(160deg,#4f9bff,#9ed0ff 58%,#ffd9a8);padding:16px 18px;box-shadow:0 6px 18px rgba(0,0,0,.18);min-height:112px;">'
    + '<div style="position:absolute;top:-14px;right:-14px;width:82px;height:82px;">'
    +   '<div style="position:absolute;inset:0;animation:pb-spin 16s linear infinite;">'+rays+'</div>'
    +   '<div style="position:absolute;inset:20px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#fff8dc,#ffce47);box-shadow:0 0 22px rgba(255,200,60,.75);"></div>'
    + '</div>'
    + '<div style="position:relative;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,.28);">'
    +   '<div style="font-size:13px;font-weight:800;letter-spacing:.3px;">Fortaleza</div>'
    +   '<div style="font-size:42px;font-weight:800;line-height:1.05;margin:2px 0;">'+temp+'</div>'
    +   '<div style="font-size:12px;font-weight:700;">'+esc(t(L('Sunny · all year 🌴','Ensolarado · o ano todo 🌴')))+'</div>'
    + '</div></div>';

  var bars = '';
  for(var i=0;i<5;i++){ bars += '<span style="width:4px;height:20px;border-radius:2px;background:#fff;display:block;transform-origin:bottom;animation:pb-eq '+(0.7+i*0.13).toFixed(2)+'s ease-in-out '+(i*0.09).toFixed(2)+'s infinite;"></span>'; }
  var coding = '<div style="border-radius:20px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);padding:14px 16px;box-shadow:0 6px 18px rgba(0,0,0,.4);">'
    + '<div style="display:flex;align-items:center;gap:12px;">'
    +   '<div style="width:46px;height:46px;border-radius:12px;background:linear-gradient(135deg,#ff8a3d,#ff6a1a);display:flex;align-items:flex-end;justify-content:center;gap:3px;padding:8px 0;flex:none;">'+bars+'</div>'
    +   '<div style="min-width:0;flex:1;">'
    +     '<div style="font-size:9px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--accent);">'+esc(t(L('Now coding to','Programando ao som de')))+'</div>'
    +     '<div style="font-size:14px;font-weight:800;color:#fff;line-height:1.2;">'+esc(t(L('Smooth jazz','Jazz suave')))+' 🎷</div>'
    +     '<div style="height:4px;border-radius:2px;background:rgba(255,255,255,.14);margin-top:8px;position:relative;overflow:hidden;"><div style="position:absolute;left:0;top:0;bottom:0;width:62%;background:var(--accent);border-radius:2px;"></div></div>'
    +   '</div>'
    + '</div></div>';

  var petThumb = function(key,name){
    return '<div style="text-align:center;">'
      + '<div style="width:64px;height:64px;border-radius:50%;margin:0 auto 6px;overflow:hidden;background:radial-gradient(circle at 50% 35%,rgba(255,106,26,.18),rgba(255,255,255,.08));position:relative;"><img src="assets/'+key+'.webp" alt="'+esc(name)+'" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;" onerror="this.remove()"></div>'
      + '<div style="font-size:11.5px;font-weight:700;color:#fff;">'+esc(name)+'</div></div>';
  };
  var pets = '<div style="border-radius:20px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);padding:14px 16px;box-shadow:0 6px 18px rgba(0,0,0,.4);">'
    + '<div style="font-size:9px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,.6);margin-bottom:10px;">'+esc(t(L('My supervisors 🐾','Meus supervisores 🐾')))+'</div>'
    + '<div style="display:flex;justify-content:space-around;">'+petThumb('bull','Bull')+petThumb('timtim','TimTim')+'</div></div>';

  return '<div style="height:100%;overflow-x:hidden;overflow-y:'+PB_HOME_OVERFLOW+';padding:58px 18px 124px;">'
    + '<div style="font-size:11px;font-weight:700;color:rgba(255,255,255,.92);letter-spacing:1px;text-transform:uppercase;padding:0 6px 14px;text-shadow:0 1px 3px rgba(0,0,0,.3);">'+esc(t(L('Off the clock','Fora do expediente')))+'</div>'
    + '<div style="display:flex;flex-direction:column;gap:14px;">'+weather+coding+pets+'</div></div>';
}

function dotsView(){
  var dot = function(i){ var on = ps.page===i;
    return '<button data-pbdot="'+i+'" onclick="PB.goPage('+i+')" class="pb-dot" aria-label="'+esc(t(L('Page','Página')))+' '+(i+1)+'" style="cursor:pointer;border:none;padding:0;height:6px;border-radius:999px;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.45);width:'+(on?'18px':'6px')+';opacity:'+(on?'1':'.45')+';"></button>';
  };
  return '<div style="position:absolute;left:0;right:0;bottom:114px;display:flex;gap:6px;justify-content:center;z-index:5;">'+dot(0)+dot(1)+'</div>';
}

function dockView(){
  var dockIcon = function(href, attrs, bg, svg){
    return '<a href="'+href+'" '+attrs+' class="pb-dock" style="width:54px;height:54px;border-radius:15px;background:'+bg+';display:flex;align-items:center;justify-content:center;text-decoration:none;">'+svg+'</a>';
  };
  var s = function(p){ return '<svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+p+'</svg>'; };
  return '<div style="position:absolute;left:14px;right:14px;bottom:26px;height:78px;background:rgba(255,255,255,.12);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);border:1px solid rgba(255,255,255,.18);border-radius:28px;display:flex;align-items:center;justify-content:space-around;padding:0 16px;box-shadow:0 8px 24px rgba(0,0,0,.22);z-index:5;">'
    + dockIcon('mailto:'+profile.email,'title="'+esc(t(L('Email','E-mail')))+'"','#FF6A1A', s('<rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>'))
    + dockIcon(profile.linkedin,EXT+' title="'+esc(t(L('LinkedIn','LinkedIn')))+'"','#1f6fe0', s('<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect width="4" height="12" x="2" y="9"></rect><circle cx="4" cy="4" r="2"></circle>'))
    + dockIcon('tel:'+profile.phone,'title="'+esc(t(L('Call','Ligar')))+'"','#27a34a', s('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>'))
    + dockIcon(profile.github,EXT+' title="'+esc(t(L('GitHub','GitHub')))+'"','#2a2a2a', '<svg width="26" height="26" viewBox="0 0 24 24" fill="#fff"><path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.05-.02-2.06-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.49 5.92.43.37.81 1.1.81 2.22 0 1.61-.01 2.9-.01 3.29 0 .32.22.7.83.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z"/></svg>')
    + '</div>';
}

function phoneHomeView(){
  return '<div style="position:absolute;inset:0;">'
    + statusBarView()
    + '<div id="pb-pager" style="position:absolute;inset:0;overflow:hidden;">'
    +   '<div id="pb-track" style="position:absolute;inset:0;width:200%;display:flex;transform:translateX(-'+(ps.page*50)+'%);transition:transform .42s cubic-bezier(.22,1,.36,1);touch-action:pan-y;">'
    +     '<div style="width:50%;height:100%;position:relative;">'+page0Apps()+'</div>'
    +     '<div style="width:50%;height:100%;position:relative;">'+page1Widgets()+'</div>'
    +   '</div>'
    + '</div>'
    + dotsView()
    + dockView()
    + '<div style="position:absolute;bottom:9px;left:50%;transform:translateX(-50%);width:124px;height:5px;border-radius:3px;background:rgba(255,255,255,.75);z-index:6;"></div>'
    + '</div>';
}

function phoneAppView(){
  var app = null;
  for(var i=0;i<apps.length;i++){ if(apps[i].key===ps.openApp){ app=apps[i]; break; } }
  if(!app) return phoneHomeView();

  var stores = app.stores.map(function(st){
    return '<a href="'+st.url+'" '+EXT+' style="text-decoration:none;font-size:12.5px;font-weight:700;color:#000;background:#fff;border-radius:11px;padding:10px 14px;">'+esc(st.label)+' ↗</a>';
  }).join('');

  var labelStyle = 'font:500 10px/1 var(--font-mono);letter-spacing:.08em;text-transform:uppercase;color:var(--fg-3)';
  var block = function(label, body, accent){
    if(accent){
      return '<div style="border-left:2px solid var(--accent);padding-left:12px;background:none;">'
        + '<div style="'+labelStyle+';margin-bottom:5px;">'+esc(label)+'</div>'
        + '<div style="font-size:13.5px;line-height:1.5;color:var(--fg);font-weight:600;">'+esc(body)+'</div></div>';
    }
    return '<div><div style="'+labelStyle+';margin-bottom:5px;">'+esc(label)+'</div>'
      + '<div style="font-size:13.5px;line-height:1.5;color:var(--fg-2);">'+esc(body)+'</div></div>';
  };

  return '<div style="position:absolute;inset:0;background:#0a0a0a;display:flex;flex-direction:column;padding:50px 0 0;animation:pb-fade .42s cubic-bezier(.22,1,.36,1);">'
    + '<div style="display:flex;align-items:center;gap:6px;padding:6px 16px 12px;border-bottom:1px solid var(--line);">'
    +   '<button onclick="PB.closeApp()" style="cursor:pointer;border:none;background:none;color:var(--accent);font-size:14px;font-weight:700;display:flex;align-items:center;gap:3px;padding:4px;">‹ '+esc(t(copy.back))+'</button>'
    + '</div>'
    + '<div style="flex:1;overflow-y:auto;padding:18px 18px 34px;">'
    +   '<div style="display:flex;align-items:center;gap:13px;margin-bottom:18px;">'
    +     '<div style="width:58px;height:58px;border-radius:14px;background:'+app.iconBg+';overflow:hidden;flex:none;box-shadow:0 4px 12px rgba(0,0,0,.4);position:relative;"><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:22px;">'+esc(app.mono)+'</div><img src="'+app.icon+'" alt="'+esc(app.name)+'" style="position:absolute;inset:0;width:58px;height:58px;object-fit:cover;" onerror="this.remove()"></div>'
    +     '<div><div style="font-size:18px;font-weight:800;color:var(--fg);line-height:1.1;">'+esc(app.name)+'</div><div style="font-size:12px;color:var(--accent);font-weight:700;margin-top:2px;">'+esc(t(app.domain))+' · '+esc(app.year)+'</div></div>'
    +   '</div>'
    +   '<div style="display:flex;flex-direction:column;gap:15px;">'
    +     block(t(copy.lblProblem), t(app.cs.problem), false)
    +     block(t(copy.lblBuild), t(app.cs.build), false)
    +     block(t(copy.lblImpact), t(app.cs.impact), true)
    +   '</div>'
    +   '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:20px;">'+stores+'</div>'
    + '</div>'
    + '<div style="position:absolute;bottom:9px;left:50%;transform:translateX(-50%);width:124px;height:5px;border-radius:3px;background:var(--fg-3);opacity:.5;"></div>'
    + '</div>';
}

// ── Live status-bar clock ────────────────────────────────────────────────
function tickClock(){
  var el = document.getElementById('pb-clock');
  if(!el) return;
  var d = new Date(), h = d.getHours(), mn = d.getMinutes();
  el.textContent = h + ':' + (mn<10?'0':'') + mn;
}

// ── Home-screen pager (swipe + dots) ─────────────────────────────────────
function setPage(i){
  i = i < 0 ? 0 : (i > 1 ? 1 : i);
  ps.page = i;
  var track = document.getElementById('pb-track');
  if(track){ track.style.transition = 'transform .42s cubic-bezier(.22,1,.36,1)'; track.style.transform = 'translateX(-' + (i*50) + '%)'; }
  var dots = document.querySelectorAll('[data-pbdot]');
  for(var d=0; d<dots.length; d++){
    var on = (+dots[d].getAttribute('data-pbdot') === i);
    dots[d].style.width = on ? '18px' : '6px';
    dots[d].style.opacity = on ? '1' : '.45';
  }
}

function wirePager(){
  var pager = document.getElementById('pb-pager');
  var track = document.getElementById('pb-track');
  if(!pager || !track) return;
  var startX=0, startY=0, dx=0, vpW=0, dragging=false, decided=false, horizontal=false, moved=false;
  function onMove(e){
    if(!dragging) return;
    dx = e.clientX - startX;
    var dy = e.clientY - startY;
    if(!decided){
      if(Math.abs(dx) > 7 || Math.abs(dy) > 7){ decided=true; horizontal = Math.abs(dx) > Math.abs(dy); }
      else return;
    }
    if(!horizontal) return;            // vertical intent: let the page scroll
    if(e.cancelable) e.preventDefault();
    if(Math.abs(dx) > 9) moved = true;
    var pos = -ps.page*vpW + dx;
    var min = -vpW, max = 0;
    if(pos > max) pos = max + (pos-max)*0.32;
    if(pos < min) pos = min + (pos-min)*0.32;
    track.style.transform = 'translateX(' + pos + 'px)';
  }
  function onUp(){
    if(!dragging) return;
    dragging = false;
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
    if(horizontal){
      var th = vpW * 0.2, np = ps.page;
      if(dx < -th && ps.page < 1) np = 1;
      else if(dx > th && ps.page > 0) np = 0;
      setPage(np);
    } else {
      track.style.transition = 'transform .3s ease';
      track.style.transform = 'translateX(-' + (ps.page*50) + '%)';
    }
    if(moved){ pager._swiped = true; setTimeout(function(){ pager._swiped = false; }, 60); }
  }
  track.addEventListener('pointerdown', function(e){
    if(ps.editMode) return;
    if(e.button !== undefined && e.button !== 0) return;
    startX=e.clientX; startY=e.clientY; dx=0; dragging=true; decided=false; horizontal=false; moved=false;
    vpW = pager.clientWidth || 1;
    track.style.transition = 'none';
    // listen on window so the swipe keeps working when the finger leaves the phone
    window.addEventListener('pointermove', onMove, {passive:false});
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  });
  // swallow the click that follows a real swipe so it doesn't open an app
  track.addEventListener('click', function(e){ if(pager._swiped){ e.stopPropagation(); e.preventDefault(); } }, true);
}

// ── iOS edit mode: long-press to jiggle, drag to rearrange ───────────────
function wireAppGrid(){
  var grid = document.getElementById('pb-appgrid');
  if(!grid) return;
  function cells(){ return Array.prototype.slice.call(grid.querySelectorAll('.pb-appicon')); }

  var pressTimer=null, sx=0, sy=0;
  var dragging=false, origin=null, fromIndex=0, curTo=0, slots=[], grabDX=0, grabDY=0;

  function clearPress(){ if(pressTimer){ clearTimeout(pressTimer); pressTimer=null; } }

  function onDown(e){
    var cell = e.target.closest && e.target.closest('.pb-appicon');
    if(!cell) return;
    if(e.target.closest('.pb-del')) return;
    sx=e.clientX; sy=e.clientY;
    if(ps.editMode){
      beginDrag(cell, e);
    } else {
      clearPress();
      pressTimer = setTimeout(function(){
        pressTimer=null;
        if(navigator.vibrate){ try{ navigator.vibrate(8); }catch(_){} }
        PB.enterEdit();
      }, 450);
    }
  }
  function onMove(e){
    if(pressTimer && (Math.abs(e.clientX-sx)>8 || Math.abs(e.clientY-sy)>8)) clearPress();
    if(dragging) duringDrag(e);
  }
  function onUp(){ clearPress(); if(dragging) endDrag(); }

  function beginDrag(cell, e){
    dragging=true; origin=cell;
    var list=cells(); fromIndex=list.indexOf(cell); curTo=fromIndex;
    slots = list.map(function(el){ var r=el.getBoundingClientRect(); return {cx:r.left+r.width/2, cy:r.top+r.height/2}; });
    grabDX = e.clientX - slots[fromIndex].cx;
    grabDY = e.clientY - slots[fromIndex].cy;
    origin.style.transition='none'; origin.style.zIndex='60';
    var jig = origin.querySelector('.pb-jig'); if(jig) jig.style.animation='none';
    window.addEventListener('pointermove', onMove, {passive:false});
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  }
  function duringDrag(e){
    if(e.cancelable) e.preventDefault();
    var dx=(e.clientX-grabDX)-slots[fromIndex].cx, dy=(e.clientY-grabDY)-slots[fromIndex].cy;
    origin.style.transform='translate('+dx+'px,'+dy+'px) scale(1.12)';
    var to=fromIndex, best=1e9;
    for(var i=0;i<slots.length;i++){ var d=Math.hypot(slots[i].cx-e.clientX, slots[i].cy-e.clientY); if(d<best){ best=d; to=i; } }
    if(to!==curTo){ curTo=to; layoutShift(); }
  }
  function layoutShift(){
    var list=cells();
    for(var i=0;i<list.length;i++){
      if(i===fromIndex) continue;
      var disp=i;
      if(fromIndex<curTo){ if(i>fromIndex && i<=curTo) disp=i-1; }
      else if(fromIndex>curTo){ if(i>=curTo && i<fromIndex) disp=i+1; }
      list[i].style.transform = (disp===i) ? '' : 'translate('+(slots[disp].cx-slots[i].cx)+'px,'+(slots[disp].cy-slots[i].cy)+'px)';
    }
  }
  function endDrag(){
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
    dragging=false;
    var keys = cells().map(function(el){ return el.getAttribute('data-key'); });
    var moved = keys.splice(fromIndex,1)[0];
    keys.splice(curTo,0,moved);
    ps.appOrder = keys;
    save('pb_apporder', JSON.stringify(keys));
    origin=null;
    renderPhone();
  }

  grid.addEventListener('pointerdown', onDown);
  grid.addEventListener('pointermove', onMove);
  grid.addEventListener('pointerup', onUp);       // cancels the long-press timer on a quick tap
  grid.addEventListener('pointercancel', onUp);
}

function toast(msg){
  var el = document.createElement('div');
  el.textContent = msg;
  el.style.cssText = 'position:fixed;top:60px;left:50%;transform:translateX(-50%);z-index:99999;background:var(--fg);color:var(--bg);font-weight:800;font-size:13px;padding:10px 18px;box-shadow:0 12px 34px rgba(0,0,0,.35);font-family:var(--font-text);opacity:0;transition:opacity .25s ease, top .25s ease;';
  document.body.appendChild(el);
  requestAnimationFrame(function(){ el.style.opacity='1'; el.style.top='72px'; });
  setTimeout(function(){ el.style.opacity='0'; setTimeout(function(){ el.remove(); }, 320); }, 2700);
}
// iOS-style push notification, rendered INSIDE the phone screen
export function phoneNotify(msg){
  var screen = document.getElementById('pb-screen');
  if(!screen){ toast(msg); return; }
  var prev = screen.querySelector('.pb-push'); if(prev) prev.remove();
  var el = document.createElement('div');
  el.className = 'pb-push';
  el.style.cssText = 'position:absolute;top:54px;left:10px;right:10px;z-index:30;display:flex;gap:10px;align-items:center;padding:11px 12px;border-radius:20px;background:rgba(250,250,250,.7);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);box-shadow:0 12px 32px rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.55);transform:translateY(-170%);opacity:0;transition:transform .5s cubic-bezier(.2,.9,.3,1.25),opacity .3s ease;font-family:var(--font-text);';
  el.innerHTML = '<div style="width:38px;height:38px;border-radius:10px;flex:none;overflow:hidden;position:relative;background:linear-gradient(135deg,#ff8a3d,#ff6a1a);display:flex;align-items:center;justify-content:center;"><span style="color:#fff;font-weight:800;font-size:13px;">PB</span><img src="'+profile.avatar+'" draggable="false" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" onerror="this.remove()"></div>'
    + '<div style="min-width:0;flex:1;">'
    +   '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;"><span style="font-size:12px;font-weight:800;color:#111;">'+esc(profile.name)+'</span><span style="font-size:11px;color:#666;font-weight:600;flex:none;">'+esc(t(L('now','agora')))+'</span></div>'
    +   '<div style="font-size:12.5px;line-height:1.35;color:#1c1c1c;margin-top:1px;">'+esc(msg)+'</div>'
    + '</div>';
  screen.appendChild(el);
  requestAnimationFrame(function(){ el.style.transform='translateY(0)'; el.style.opacity='1'; });
  setTimeout(function(){ el.style.transform='translateY(-170%)'; el.style.opacity='0'; setTimeout(function(){ el.remove(); }, 520); }, 2900);
}

// exit edit mode: Escape, or tapping empty space inside the phone
window.addEventListener('keydown', function(e){ if(e.key==='Escape' && ps.editMode){ PB.exitEdit(); } });
document.addEventListener('click', function(e){
  if(!ps.editMode) return;
  var tgt = e.target;
  if(tgt.closest && (tgt.closest('.pb-appicon') || tgt.closest('.pb-del'))) return;
  if(tgt.closest && tgt.closest('#pb-pager')) PB.exitEdit();
});

// ── Controller (global, survives re-render via inline handlers) ──────────
window.PB = {
  openApp: function(k){ if(ps.editMode) return; if(!ps.hinted){ ps.hinted=true; save('pb_hinted','1'); } ps.openApp = k; renderPhone(); },
  closeApp: function(){ if(ps.openApp){ ps.openApp = null; renderPhone(); } },
  goPage: function(i){ setPage(i); },
  goAbout: function(){ if(ps.editMode) return; var el=document.getElementById('experience'); if(el) el.scrollIntoView({behavior:'smooth',block:'start'}); },
  enterEdit: function(){ if(!ps.editMode){ ps.editMode = true; renderPhone(); } },
  exitEdit: function(ev){ if(ev && ev.stopPropagation) ev.stopPropagation(); if(ps.editMode){ ps.editMode = false; renderPhone(); } },
  tryDelete: function(key, ev){
    if(ev){ ev.stopPropagation(); ev.preventDefault(); }
    var msgs = [
      L("🙅 You can't delete my story!", '🙅 Você não apaga a minha história!'),
      L('🚀 That one shipped to the App Store. It stays.', '🚀 Esse foi publicado na App Store. Fica.'),
      L('😄 Nice try! This app is here to stay.', '😄 Boa tentativa! Esse aqui eu não deleto.'),
      L('❤️ Erase years of work? Never.', '❤️ Apagar anos de trabalho? Jamais.')
    ];
    phoneNotify(t(msgs[Math.floor(Math.random()*msgs.length)]));
    var cell = document.querySelector('.pb-appicon[data-key="'+key+'"]');
    if(cell){ cell.classList.remove('pb-deny'); void cell.offsetWidth; cell.classList.add('pb-deny'); }
  },
  poke: function(ev){
    if(ev && ev.stopPropagation) ev.stopPropagation();
    var notch = ev && ev.currentTarget, frame = notch && notch.parentElement;
    if(!frame || frame.querySelector('.pb-island')) return;
    var el = document.createElement('div');
    el.className = 'pb-island';
    el.textContent = t(L('🎧 coding • jazz', '🎧 codando • jazz'));
    el.style.cssText = 'position:absolute;top:18px;left:50%;transform:translateX(-50%) scale(.85);background:#0b0b0d;color:#fff;font-size:12px;font-weight:700;padding:9px 16px;border-radius:999px;z-index:8;white-space:nowrap;box-shadow:0 8px 22px rgba(0,0,0,.55);font-family:var(--font-text);opacity:0;transition:opacity .25s ease, transform .4s cubic-bezier(.22,1,.36,1);';
    frame.appendChild(el);
    requestAnimationFrame(function(){ el.style.opacity='1'; el.style.transform='translateX(-50%) scale(1)'; });
    setTimeout(function(){ el.style.opacity='0'; el.style.transform='translateX(-50%) scale(.85)'; setTimeout(function(){ el.remove(); }, 320); }, 2400);
  }
};

export function render(root) {
  rootEl = root;
  root.innerHTML = `
    <div class="container">
      <h2 class="section-title">${esc(t(copy.title))}<span class="sq"></span></h2>
      <p class="section-sub">${esc(t(copy.sub))}</p>
      <div class="phone-stage">${frameView()}</div>
    </div>`;
  afterRender();
}
function renderPhone() { const s = rootEl && rootEl.querySelector('.phone-stage'); if (s) { s.innerHTML = frameView(); afterRender(); } }
function afterRender() { tickClock(); if (!ps.openApp) { wirePager(); wireAppGrid(); } }
function frameView() {
  const screen = ps.openApp ? phoneAppView() : phoneHomeView();
  return '<div class="phone-wrap">'
    + (ps.hinted ? '' : '<button onclick="PB.openApp(\'collective\')" class="phone-annot mono">' + esc(t(copy.annot)) + ' ↓</button>')
    + '<div class="phone-device">'
    +   '<button onclick="PB.poke(event)" aria-label="Dynamic Island" class="phone-island"></button>'
    +   '<div id="pb-screen" class="phone-screen">' + screen + '</div>'
    + '</div></div>';
}
setInterval(tickClock, 15000);
