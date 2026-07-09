import"./modulepreload-polyfill-B5Qt9EMX.js";function r(e){const t=Number(e);return Number.isFinite(t)?t:0}function h(e,t=Math.floor(Date.now()/1e3)){const i=r(e);return i?i>t?"会员":"已过期":"免费"}function b(e){const t=r(e);return t?new Intl.DateTimeFormat("zh-CN",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}).format(new Date(t*1e3)):"-"}function l(e={},t=Math.floor(Date.now()/1e3)){const i=e.counters||{},d=Array.isArray(e.users)?e.users:[],n=Array.isArray(e.plans)?e.plans:[],g=Array.isArray(e.orders)?e.orders:[];return{counters:{totalUsers:r(i.total_users||i.totalUsers),todayUsers:r(i.today_users||i.todayUsers),activeUsers:r(i.active_users||i.activeUsers),paidUsers:r(i.paid_users||i.paidUsers),revenueCents:r(i.revenue_cents||i.revenueCents)},users:d.map(a=>({id:a.id||a.uid||"",openid:a.openid||"",nickname:a.nickname||a.username||"未命名用户",avatar:a.avatar||"",mobile:a.mobile||"",currentBook:a.book_name||a.currentBook||"-",currentPage:r(a.cur_page||a.currentPage),createTime:r(a.create_time||a.createTime),lastLoginTime:r(a.last_login_time||a.lastLoginTime),memberExpireTime:r(a.member_expire_time||a.memberExpireTime),memberState:h(a.member_expire_time||a.memberExpireTime,t)})),plans:n,orders:g}}const f={counters:{total_users:1286,today_users:37,active_users:418,paid_users:96,revenue_cents:268800},users:[{id:1001,nickname:"小明",mobile:"138****1234",book_name:"三年级上册",cur_page:20,create_time:1783423600,last_login_time:178351e4,member_expire_time:1786192e3},{id:1002,nickname:"Lily",mobile:"",book_name:"五年级上册",cur_page:9,create_time:1783337200,last_login_time:17835e5,member_expire_time:0},{id:1003,nickname:"Tom",mobile:"186****8821",book_name:"六年级上册",cur_page:72,create_time:1782991600,last_login_time:178346e4,member_expire_time:17834e5}],plans:[{id:1,name:"月卡",price_cents:1900,duration_days:30,status:1},{id:2,name:"季卡",price_cents:4900,duration_days:90,status:1},{id:3,name:"年卡",price_cents:12800,duration_days:365,status:1}],orders:[{id:9001,order_no:"DD202607080001",nickname:"小明",plan_name:"年卡",amount_cents:12800,pay_status:"paid",paid_time:1783509600},{id:9002,order_no:"DD202607080002",nickname:"Lily",plan_name:"月卡",amount_cents:1900,pay_status:"pending",paid_time:0}]};async function v(){try{const e=await fetch("/api/admin_dashboard/dashboard",{credentials:"include"}),t=await e.json();if(!e.ok||t.code===0||t.code===500)throw new Error(t.msg||"后台接口未就绪");return t.data||t}catch{return f}}const u=document.querySelector("#admin-app"),o={authed:localStorage.getItem("diandu-admin-demo-auth")==="1",loading:!1,dashboard:l()};function c(e){return`¥${(Number(e||0)/100).toFixed(2)}`}function s(e){return String(e??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}function m(e){Object.assign(o,e),_()}async function p(){m({loading:!0});const e=await v();m({dashboard:l(e),loading:!1})}window.adminApp={login(e){e.preventDefault(),localStorage.setItem("diandu-admin-demo-auth","1"),m({authed:!0}),p()},logout(){localStorage.removeItem("diandu-admin-demo-auth"),m({authed:!1})}};function y(){u.innerHTML=`
    <main class="login-page">
      <form class="login-card" onsubmit="adminApp.login(event)">
        <h1>点读后台</h1>
        <p>用户统计与收费准备</p>
        <label>账号<input value="admin" autocomplete="username" /></label>
        <label>密码<input value="admin123" type="password" autocomplete="current-password" /></label>
        <button>登录后台</button>
      </form>
    </main>
  `}function $(){const{counters:e,users:t,plans:i,orders:d}=o.dashboard;u.innerHTML=`
    <main class="admin-shell">
      <aside>
        <strong>点读后台</strong>
        <a class="active">数据看板</a>
        <a>用户管理</a>
        <a>会员套餐</a>
        <a>订单管理</a>
        <button onclick="adminApp.logout()">退出</button>
      </aside>
      <section class="content">
        <header>
          <div>
            <h1>数据看板</h1>
            <p>${o.loading?"加载中...":"已连接后台接口，接口未就绪时显示演示数据"}</p>
          </div>
          <span>收费模块预备版</span>
        </header>
        <div class="metric-grid">
          <article><small>总注册用户</small><strong>${e.totalUsers}</strong></article>
          <article><small>今日新增</small><strong>${e.todayUsers}</strong></article>
          <article><small>活跃用户</small><strong>${e.activeUsers}</strong></article>
          <article><small>会员用户</small><strong>${e.paidUsers}</strong></article>
          <article><small>累计收入</small><strong>${c(e.revenueCents)}</strong></article>
        </div>
        <div class="section-grid">
          <section class="panel wide">
            <h2>最近用户</h2>
            <table>
              <thead><tr><th>用户</th><th>手机号</th><th>当前教材</th><th>页数</th><th>会员</th><th>最近登录</th></tr></thead>
              <tbody>
                ${t.map(n=>`
                  <tr>
                    <td>${s(n.nickname)}</td>
                    <td>${s(n.mobile||"-")}</td>
                    <td>${s(n.currentBook)}</td>
                    <td>${n.currentPage}</td>
                    <td><span class="badge">${s(n.memberState)}</span></td>
                    <td>${b(n.lastLoginTime)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </section>
          <section class="panel">
            <h2>会员套餐</h2>
            ${i.map(n=>`
              <div class="plan-row">
                <strong>${s(n.name)}</strong>
                <span>${c(n.price_cents)} / ${n.duration_days} 天</span>
              </div>
            `).join("")}
          </section>
          <section class="panel">
            <h2>最近订单</h2>
            ${d.map(n=>`
              <div class="order-row">
                <strong>${s(n.order_no)}</strong>
                <span>${s(n.nickname)} · ${s(n.plan_name)} · ${c(n.amount_cents)}</span>
              </div>
            `).join("")}
          </section>
        </div>
      </section>
    </main>
  `}function _(){o.authed?$():y()}_();o.authed&&p();
