const express = require('express');
const path = require('path');
const fs = require('fs');
const { startBot } = require('./main');
const config = require('./config');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

const publicDir = path.join(__dirname, 'public');
const libHtml = path.join(__dirname, 'lib', 'server.html');
if (fs.existsSync(publicDir)) app.use(express.static(publicDir));

const state = {
  qr: null,
  qrRaw: null,
  pairingCode: null,
  status: 'starting',
  mode: 'pairing',
  bot: null,
  commands: new Map(),
  connected: false,
  number: null,
  uptime: Date.now(),
  requestPairingCode: null
};

app.get('/', (req, res) => {
  const indexPath = path.join(publicDir, 'index.html');
  if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
  if (fs.existsSync(libHtml)) return res.sendFile(libHtml);
  return res.status(404).send('<h1>BALDWIN BOT</h1><p>Put index.html in /public</p>');
});

app.get('/api/status', (req, res) => {
  res.json({
    ok: true,
    name: config.BOT_NAME,
    owner: config.OWNER_NAME,
    originalNumber: config.ORIGINAL_NUMBER,
    status: state.status,
    mode: state.mode,
    connected: state.connected || state.status === 'online',
    number: state.number,
    qr: state.qr,
    qrAvailable: Boolean(state.qr),
    code: state.pairingCode,
    pairingCode: state.pairingCode,
    uptime: Math.floor((Date.now() - state.uptime)/1000),
    commands: state.commands?.size || 0
  });
});

app.get('/info', (req,res)=>res.redirect('/api/status'));
app.get('/health', (req,res)=>res.status(200).json({ok:true,status:state.status,uptime:Date.now()-state.uptime}));

app.get('/qr', (req,res)=>{
  if(!state.qrRaw) return res.status(404).json({ok:false,message:'QR not available - switch to QR mode'});
  res.type('text/plain').send(state.qrRaw);
});

app.post('/api/mode', (req,res)=>{
  const {mode}=req.body;
  if(!['qr','pairing'].includes(mode)) return res.status(400).json({ok:false});
  state.mode=mode;
  console.log(`[MODE] ${mode}`);
  if(state.bot) state.status = mode==='qr' ? 'qr' : 'pairing';
  return res.json({ok:true,mode});
});
app.post('/setmode',(req,res)=>{ state.mode=req.body.mode; res.json({ok:true}); });

// PAIRING - 100% LINK FIX
app.post('/api/pair', async (req,res)=>{
  try{
    let phoneNumber = String(req.body.phoneNumber||req.body.number||'').replace(/\D/g,'');
    if(!phoneNumber) return res.status(400).json({ok:false,message:'Enter number e.g 2349166265317'});
    if(phoneNumber.length<10) return res.status(400).json({ok:false,message:'Invalid number'});
    if(!state.bot) return res.status(503).json({ok:false,message:'Bot is starting, wait 10 seconds and retry - check logs for [BOOT]'});
    if(state.status==='online') return res.status(400).json({ok:false,message:'Already connected as '+state.number});

    let code;
    try {
      if(typeof state.requestPairingCode==='function'){
        code = await state.requestPairingCode(phoneNumber);
      } else {
        code = await state.bot.requestPairingCode(phoneNumber);
      }
    } catch (inner) {
      // FIX: If old session blocks, auto clean and tell user to retry once
      if(inner.message && inner.message.toLowerCase().includes('already')){
        console.log('[FIX] Auto deleting data/auth for relink');
        try{ fs.rmSync(path.join(__dirname,'data','auth'), {recursive:true, force:true}); }catch{}
        return res.status(409).json({ok:false, message:'Old session deleted - Wait 5 sec then click Generate again, will work 100%'});
      }
      throw inner;
    }

    state.pairingCode=code;
    state.status='pairing';
    console.log(`[PAIR] ${phoneNumber} => ${code}`);
    return res.json({ok:true,pairingCode:code,code,message:'Go to WhatsApp > Linked Devices > Link with phone number'});
  }catch(e){
    console.error('[PAIR ERROR]',e);
    let msg=e.message||'Failed';
    return res.status(500).json({ok:false,message:msg});
  }
});

app.post('/pair', async (req,res)=>{
  try{
    let phoneNumber = String(req.body.number||req.body.phoneNumber||'').replace(/\D/g,'');
    if(!phoneNumber) return res.status(400).json({ok:false});
    let code = typeof state.requestPairingCode==='function' ? await state.requestPairingCode(phoneNumber) : await state.bot.requestPairingCode(phoneNumber);
    state.pairingCode=code;
    return res.json({ok:true,pairingCode:code,code});
  }catch(e){ return res.status(500).json({ok:false,message:e.message}); }
});

const PORT = Number(process.env.PORT)||config.PORT||3000;
app.listen(PORT,'0.0.0.0',()=>{
  console.log(`BALDWIN BOT running on ${PORT} - Simon Tech Inc`);
});

async function boot(){
  try{
    console.log('[BOOT] Starting Baldwin...');
    await startBot({state,config});
  }catch(e){
    state.status='error';
    console.error('[BOOT FAIL]',e);
    setTimeout(boot,5000);
  }
}
boot();

process.on('unhandledRejection',e=>console.error('[UNHANDLED]',e?.message));
process.on('uncaughtException',e=>console.error('[EXCEPTION]',e?.message));
