import { getAdminPage } from '../pages/adminPage.js';
import { getBestIpPage } from '../pages/bestIpPage.js';
import { getEditPage } from '../pages/editPage.js';
import { getEnv } from '../env.js'

/**
 * 处理管理页面请求
 */
export class handleAdminPage extends getEnv {
  constructor(request, env) {
    this.request = request;
    this.env = env;
  }
  async handle() {
    if (userID && !isValidUUID(userID)) {
      userID = userIDs[0];
      userIDLow = userIDs[1];
    } else 动态UUID = userID;

    if (!userID) {
      return new Response('请设置你的UUID变量，或尝试重试部署，检查变量是否生效？', {
        status: 404,
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        }
      });
    }
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const timestamp = Math.ceil(currentDate.getTime() / 1000);
    const fakeUserIDMD5 = await 双重哈希(`${userID}${timestamp}`);
    const fakeUserID = [
      fakeUserIDMD5.slice(0, 8),
      fakeUserIDMD5.slice(8, 12),
      fakeUserIDMD5.slice(12, 16),
      fakeUserIDMD5.slice(16, 20),
      fakeUserIDMD5.slice(20)
    ].join('-');

    const fakeHostName = `${fakeUserIDMD5.slice(6, 9)}.${fakeUserIDMD5.slice(13, 19)}`;

    proxyIP = env.PROXYIP || env.proxyip || proxyIP;
    proxyIPs = await 整理(proxyIP);
    proxyIP = proxyIPs[Math.floor(Math.random() * proxyIPs.length)];
    DNS64Server = env.DNS64 || env.NAT64 || DNS64Server;
    socks5Address = env.HTTP || env.SOCKS5 || socks5Address;
    socks5s = await 整理(socks5Address);
    socks5Address = socks5s[Math.floor(Math.random() * socks5s.length)];
    enableHttp = env.HTTP ? true : socks5Address.toLowerCase().includes('http://');
    socks5Address = socks5Address.split('//')[1] || socks5Address;
    if (env.GO2SOCKS5) go2Socks5s = await 整理(env.GO2SOCKS5);
    if (env.CFPORTS) httpsPorts = await 整理(env.CFPORTS);
    if (env.BAN) banHosts = await 整理(env.BAN);
    if (socks5Address) {
      try {
        parsedSocks5Address = socks5AddressParser(socks5Address);
        RproxyIP = env.RPROXYIP || 'false';
        enableSocks = true;
      } catch (err) {
        let e = err;
        console.log(e.toString());
        RproxyIP = env.RPROXYIP || !proxyIP ? 'true' : 'false';
        enableSocks = false;
      }
    } else {
      RproxyIP = env.RPROXYIP || !proxyIP ? 'true' : 'false';
    }

    const upgradeHeader = request.headers.get('Upgrade');
    const url = new URL(request.url);
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      if (env.ADD) addresses = await 整理(env.ADD);
      if (env.ADDAPI) addressesapi = await 整理(env.ADDAPI);
      if (env.ADDNOTLS) addressesnotls = await 整理(env.ADDNOTLS);
      if (env.ADDNOTLSAPI) addressesnotlsapi = await 整理(env.ADDNOTLSAPI);
      if (env.ADDCSV) addressescsv = await 整理(env.ADDCSV);
      DLS = Number(env.DLS) || DLS;
      remarkIndex = Number(env.CSVREMARK) || remarkIndex;
      BotToken = env.TGTOKEN || BotToken;
      ChatID = env.TGID || ChatID;
      FileName = env.SUBNAME || FileName;
      subEmoji = env.SUBEMOJI || env.EMOJI || subEmoji;
      if (subEmoji == '0') subEmoji = 'false';
      if (env.LINK) link = await 整理(env.LINK);
      let sub = env.SUB || '';
      subConverter = env.SUBAPI || subConverter;
      if (subConverter.includes("http://")) {
        subConverter = subConverter.split("//")[1];
        subProtocol = 'http';
      } else {
        subConverter = subConverter.split("//")[1] || subConverter;
      }
      subConfig = env.SUBCONFIG || subConfig;
      if (url.searchParams.has('sub') && url.searchParams.get('sub') !== '') sub = url.searchParams.get('sub').toLowerCase();
      if (url.searchParams.has('notls')) noTLS = 'true';

      if (url.searchParams.has('proxyip')) {
        path = `/proxyip=${url.searchParams.get('proxyip')}`;
        RproxyIP = 'false';
      } else if (url.searchParams.has('socks5')) {
        path = `/?socks5=${url.searchParams.get('socks5')}`;
        RproxyIP = 'false';
      } else if (url.searchParams.has('socks')) {
        path = `/?socks5=${url.searchParams.get('socks')}`;
        RproxyIP = 'false';
      }

      SCV = env.SCV || SCV;
      if (!SCV || SCV == '0' || SCV == 'false') allowInsecure = '';
      else SCV = 'true';
      const 路径 = url.pathname.toLowerCase();
      if (路径 == '/') {
        if (env.URL302) return Response.redirect(env.URL302, 302);
        else if (env.URL) return await 代理URL(env.URL, url);
        else return new Response(await nginx(), {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=UTF-8',
          },
        });
      } else if (路径 == `/${fakeUserID}`) {
        const fakeConfig = await 生成配置信息(userID, request.headers.get('Host'), sub, 'CF-Workers-SUB', RproxyIP, url, fakeUserID, fakeHostName, env);
        return new Response(`${fakeConfig}`, { status: 200 });
      } else if (url.pathname == `/${动态UUID}/edit` || 路径 == `/${userID}/edit`) {
        return await KV(request, env);
      } else if (url.pathname == `/${动态UUID}/bestip` || 路径 == `/${userID}/bestip`) {
        return await bestIP(request, env);
      } else if (url.pathname == `/${动态UUID}` || 路径 == `/${userID}`) {
        await sendMessage(`#获取订阅 ${FileName}`, request.headers.get('CF-Connecting-IP'), `UA: ${UA}</tg-spoiler>\n域名: ${url.hostname}\n<tg-spoiler>入口: ${url.pathname + url.search}</tg-spoiler>`);
        const 维列斯Config = await 生成配置信息(userID, request.headers.get('Host'), sub, UA, RproxyIP, url, fakeUserID, fakeHostName, env);
        const now = Date.now();
        //const timestamp = Math.floor(now / 1000);
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        const UD = Math.floor(((now - today.getTime()) / 86400000) * 24 * 1099511627776 / 2);
        let pagesSum = UD;
        let workersSum = UD;
        let total = 24 * 1099511627776;
        if ((env.CF_EMAIL && env.CF_APIKEY) || (env.CF_ID && env.CF_APITOKEN)) {
          const usage = await getUsage(env.CF_ID, env.CF_EMAIL, env.CF_APIKEY, env.CF_APITOKEN, env.CF_ALL);
          pagesSum = usage[1];
          workersSum = usage[2];
          total = env.CF_ALL ? Number(env.CF_ALL) : (1024 * 100); // 100K
        }
        if (userAgent && userAgent.includes('mozilla')) {
          return new Response(维列斯Config, {
            status: 200,
            headers: {
              "Content-Type": "text/html;charset=utf-8",
              "Profile-Update-Interval": "6",
              "Subscription-Userinfo": `upload=${pagesSum}; download=${workersSum}; total=${total}; expire=${expire}`,
              "Cache-Control": "no-store",
            }
          });
        } else {
          return new Response(维列斯Config, {
            status: 200,
            headers: {
              "Content-Disposition": `attachment; filename=${FileName}; filename*=utf-8''${encodeURIComponent(FileName)}`,
              //"Content-Type": "text/plain;charset=utf-8",
              "Profile-Update-Interval": "6",
              "Profile-web-page-url": request.url.includes('?') ? request.url.split('?')[0] : request.url,
              "Subscription-Userinfo": `upload=${pagesSum}; download=${workersSum}; total=${total}; expire=${expire}`,
            }
          });
        }
      } else {
        if (env.URL302) return Response.redirect(env.URL302, 302);
        else if (env.URL) return await 代理URL(env.URL, url);
        else return new Response('不用怀疑！你UUID就是错的！！！', { status: 404 });
      }
    } else {
      socks5Address = url.searchParams.get('socks5') || socks5Address;
      if (new RegExp('/socks5=', 'i').test(url.pathname)) socks5Address = url.pathname.split('5=')[1];
      else if (new RegExp('/socks://', 'i').test(url.pathname) || new RegExp('/socks5://', 'i').test(url.pathname) || new RegExp('/http://', 'i').test(url.pathname)) {
        enableHttp = url.pathname.includes('http://');
        socks5Address = url.pathname.split('://')[1].split('#')[0];
        if (socks5Address.includes('@')) {
          const lastAtIndex = socks5Address.lastIndexOf('@');
          let userPassword = socks5Address.substring(0, lastAtIndex).replaceAll('%3D', '=');
          const base64Regex = /^(?:[A-Z0-9+/]{4})*(?:[A-Z0-9+/]{2}==|[A-Z0-9+/]{3}=)?$/i;
          if (base64Regex.test(userPassword) && !userPassword.includes(':')) userPassword = atob(userPassword);
          socks5Address = `${userPassword}@${socks5Address.substring(lastAtIndex + 1)}`;
        }
        go2Socks5s = ['all in'];//开启全局SOCKS5
      }

      if (socks5Address) {
        try {
          parsedSocks5Address = socks5AddressParser(socks5Address);
          enableSocks = true;
        } catch (err) {
          let e = err;
          console.log(e.toString());
          enableSocks = false;
        }
      } else {
        enableSocks = false;
      }

      if (url.searchParams.has('proxyip')) {
        proxyIP = url.searchParams.get('proxyip');
        enableSocks = false;
      } else if (new RegExp('/proxyip=', 'i').test(url.pathname)) {
        proxyIP = url.pathname.toLowerCase().split('/proxyip=')[1];
        enableSocks = false;
      } else if (new RegExp('/proxyip.', 'i').test(url.pathname)) {
        proxyIP = `proxyip.${url.pathname.toLowerCase().split("/proxyip.")[1]}`;
        enableSocks = false;
      } else if (new RegExp('/pyip=', 'i').test(url.pathname)) {
        proxyIP = url.pathname.toLowerCase().split('/pyip=')[1];
        enableSocks = false;
      }

      return await 维列斯OverWSHandler(request);
    }
  }
}