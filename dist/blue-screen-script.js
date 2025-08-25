(()=>{const o="focus-forge-bsod-overlay";if(document.getElementById(o))return;const e=document.createElement("div");e.id=o,e.className="ff-bsod-overlay",e.innerHTML=`
    <div class="ff-bsod-content">
        <h1>:(</h1>
        <p>Your PC ran into a problem that it couldn't handle, and now it needs to restart.</p>
        <p>Please open the Focus Forge popup to restore your session.</p>
        <div class="ff-bsod-details">
            <p>If you call a support person, give them this info:<br>
            Stop code: 0x000000F1 (0x0000000000000000, 0x0000000000000000, 0x0000000000000000, 0x0000000000000000)</p>
        </div>
    </div>
  `,document.body.appendChild(e),chrome.runtime.onMessage.addListener(t=>{if(t.type==="TIMER_UPDATED"&&t.data.state==="IDLE"){const n=document.getElementById(o);n&&n.remove()}})})();
