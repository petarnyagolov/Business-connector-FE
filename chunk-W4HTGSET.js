import{ba as s}from"./chunk-XVJMJOXU.js";var a=class n{constructor(){this.initializeStyles()}show(t){this.createToastNotification(t)}success(t,e,o=4e3){this.show({message:t,type:"success",title:e,duration:o})}error(t,e,o=6e3){this.show({message:t,type:"error",title:e,duration:o})}warning(t,e,o=5e3){this.show({message:t,type:"warning",title:e,duration:o})}info(t,e,o=4e3){this.show({message:t,type:"info",title:e,duration:o})}createToastNotification(t){let e=document.getElementById("toast-container");e||(e=document.createElement("div"),e.id="toast-container",e.style.cssText=`
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 12px;
        pointer-events: none;
      `,document.body.appendChild(e));let o=this.getColorScheme(t.type),i=document.createElement("div");i.style.cssText=`
      min-width: 320px;
      max-width: 500px;
      padding: 16px 20px;
      background: ${o.background};
      color: ${o.text};
      border-left: 4px solid ${o.accent};
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      font-size: 14px;
      line-height: 1.5;
      position: relative;
      animation: slideInRight 0.3s ease-out;
      cursor: pointer;
      word-wrap: break-word;
      pointer-events: auto;
      backdrop-filter: blur(10px);
    `;let c=this.getIcon(t.type),l=t.title||this.getDefaultTitle(t.type);i.innerHTML=`
      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <span style="font-size: 20px; flex-shrink: 0; margin-top: 2px;">${c}</span>
        <div style="flex: 1;">
          <div style="font-weight: 600; margin-bottom: 6px; color: ${o.accent};">
            ${l}
          </div>
          <div style="color: ${o.text};">${t.message}</div>
        </div>
        <button class="toast-close-btn" style="
          background: none;
          border: none;
          color: ${o.closeButton};
          font-size: 18px;
          cursor: pointer;
          padding: 0;
          margin-left: 8px;
          line-height: 1;
          flex-shrink: 0;
          border-radius: 4px;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        " onmouseover="this.style.backgroundColor='rgba(0,0,0,0.1)'" 
           onmouseout="this.style.backgroundColor='transparent'"
           onclick="this.parentElement.parentElement.remove()">\xD7</button>
      </div>
      <div class="progress-bar" style="
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        background: ${o.accent};
        border-radius: 0 0 8px 8px;
        animation: progressBar ${(t.duration||4e3)/1e3}s linear;
        transform-origin: left center;
      "></div>
    `,e.appendChild(i);let r=t.autoClose!==!1?t.duration||4e3:0;r>0&&setTimeout(()=>{this.removeToast(i)},r),i.addEventListener("click",d=>{d.target.classList.contains("toast-close-btn")||this.removeToast(i)})}removeToast(t){t.parentNode&&(t.style.animation="slideOutRight 0.3s ease-in",setTimeout(()=>{t.parentNode&&t.remove()},300))}getColorScheme(t){switch(t){case"success":return{background:"#f8f9fa",text:"#155724",accent:"#28a745",closeButton:"#155724"};case"error":return{background:"#f8f9fa",text:"#721c24",accent:"#dc3545",closeButton:"#721c24"};case"warning":return{background:"#f8f9fa",text:"#856404",accent:"#ffc107",closeButton:"#856404"};case"info":default:return{background:"#f8f9fa",text:"#0c5460",accent:"#17a2b8",closeButton:"#0c5460"}}}getIcon(t){switch(t){case"success":return"\u2705";case"error":return"\u274C";case"warning":return"\u26A0\uFE0F";case"info":default:return"\u2139\uFE0F"}}getDefaultTitle(t){switch(t){case"success":return"\u0423\u0441\u043F\u0435\u0445";case"error":return"\u0413\u0440\u0435\u0448\u043A\u0430";case"warning":return"\u0412\u043D\u0438\u043C\u0430\u043D\u0438\u0435";case"info":default:return"\u0418\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F"}}initializeStyles(){if(!document.getElementById("toast-styles")){let t=document.createElement("style");t.id="toast-styles",t.textContent=`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
        @keyframes progressBar {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }
      `,document.head.appendChild(t)}}static \u0275fac=function(e){return new(e||n)};static \u0275prov=s({token:n,factory:n.\u0275fac,providedIn:"root"})};export{a};
