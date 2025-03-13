import axios from "axios";
import fetch from "node-fetch";
const CHAT_ID = "-1002352563934";
const MESSAGE_ID = "30";
const NEW_TEXT = `
✳️<a href="https://t.me/Marisa_kristi/30" title="获取最新订阅">Vless 快速体验订阅地址 非标！</a>

固定地区: 🇬🇧英国、🇸🇬新加坡、🇯🇵日本、🇰🇷韩国

✅线路一：https://etc.mesa.ip-ddns.com/9g4C1UAZeaBQD86WfCV0
使用情况：${await fetchGraphQL(process.env.CLOUDFLARE_ACCOUNT_ID_MESA, process.env.CLOUDFLARE_API_TOKEN_MESA)}

✅线路二：https://mihu.sorry.ip-ddns.com/6oFtgiYFBA77zDwFRA4b
使用情况：${await fetchGraphQL(process.env.CLOUDFLARE_ACCOUNT_ID_SORRY, process.env.CLOUDFLARE_API_TOKEN_SORRY)}

✅线路三：https://oty.myto.ip-ddns.com/jJh3s4xu97d5eNPi7e0T
使用情况：${await fetchGraphQL(process.env.CLOUDFLARE_ACCOUNT_ID_MYTO, process.env.CLOUDFLARE_API_TOKEN_MYTO)}

✅线路四：https://miku.mikuru.ip-ddns.com/nYMU6Xk61WsKCCXF941K
使用情况：${await fetchGraphQL(process.env.CLOUDFLARE_ACCOUNT_ID_MIKURU, process.env.CLOUDFLARE_API_TOKEN_MIKURU)}

✅线路五：https://arrbu.us.kg/Y1JRPHZXm4LXM6R9MRzi
使用情况：${await fetchGraphQL(process.env.CLOUDFLARE_ACCOUNT_ID_ARRBU, process.env.CLOUDFLARE_API_TOKEN_ARRBU)}

✅线路六：https://ennyfe.us.kg/wen1u1aHn4kahKQeQN8j
使用情况：${await fetchGraphQL(process.env.CLOUDFLARE_ACCOUNT_ID_ENNYFE, process.env.CLOUDFLARE_API_TOKEN_ENNYFE)}

✅线路七：https://mikuyo.us.kg/xe3K5Bi0FsU2VxAb5aXi
使用情况：${await fetchGraphQL(process.env.CLOUDFLARE_ACCOUNT_ID_MIKUYO, process.env.CLOUDFLARE_API_TOKEN_MIKUYO)}

✅线路八：https://g5w2d5g4.pages.dev/N49o8kZF0qp0447j3kyc
使用情况：${await fetchGraphQL(process.env.CLOUDFLARE_ACCOUNT_ID_PAGES_1, process.env.CLOUDFLARE_API_TOKEN_PAGES_1)}

✅线路九：https://r8x6m2l9.pages.dev/2z2U5XtM39rh2fW84isg
使用情况：${await fetchGraphQL(process.env.CLOUDFLARE_ACCOUNT_ID_PAGES_2, process.env.CLOUDFLARE_API_TOKEN_PAGES_2)}

✅线路十：https://o9d8b0y7.pages.dev/dyRkcYMfQavqC0wMghhv
使用情况：${await fetchGraphQL(process.env.CLOUDFLARE_ACCOUNT_ID_PAGES_3, process.env.CLOUDFLARE_API_TOKEN_PAGES_3)}

------------

#反代IP #优选IP #永久订阅 #Vless  #订阅器 #节点 #订阅 #白嫖 #公益 #免费节点 #免费订阅 #小火箭节点 #v2ray节点 #Clash节点 #proxyip

------------

Worker 部署的 Vless 可通过填入 url 路径快速获取节点订阅信息：

https://[你的订阅链接]?sub=sub.mot.cloudns.biz

注意：sub/订阅器已取消ProxyIP,如有需要请按照以下格式添加：
?sub=xxx.xxx.xxx.xxx&
proxyip=xxx.xxx.xxx.xxx

------------

Worker 部署的 Vless/Trojan 可以通过填入环境变量 SUB 快速获取节点订阅信息，内置 ProxyIP

精简版订阅器
地区: 🇬🇧英国、🇸🇬新加坡、🇯🇵日本、🇰🇷韩国

Edge项目变量 SUB 填：
<code>sub.mot.cloudns.biz</code>
或：
<code>sub.haxtop.ggff.net</code>

或者订阅链接后面加：
<code>?sub=sub.mot.cloudns.biz</code>
或：
<code>?sub=sub.haxtop.ggff.net</code>

测试版订阅器 
地区: 🇩🇪德国、🇬🇧英国、🇭🇰香港、🇮🇩印度尼西亚、🇯🇵日本、🇰🇷韩国、🇸🇪瑞典、🇸🇬新加坡、🇹🇼台湾、🇺🇸美国

Edge项目变量 SUB 填：
<code>subbeta.mot.cloudns.biz</code>
或：
<code>subbate.haxtop.ggff.net</code

或者订阅链接后面加：
<code>?sub=subbeta.mot.cloudns.biz</code>
或：
<code>?sub=subbate.haxtop.ggff.net</code>

------------

订阅内容 base64、clash、singbox、loon
`;
async function updateMessage(CHAT_ID, MESSAGE_ID, NEW_TEXT) {
  try {
    const response = await axios.post(
      `https://api.telegram.org/bot${process.env.BOT_TOKEN}/editMessageText`,
      {
        chat_id: CHAT_ID,
        message_id: MESSAGE_ID,
        text: NEW_TEXT,
        parse_mode: "HTML", // 可选：支持 Markdown 或 HTML
      },
    );

    console.log("✅数据更新，已发送", response.data);
  } catch (error) {
    console.error("数据未更新，取消发送");
  }
}
async function fetchGraphQL(ACCOUNT_ID, API_TOKEN) {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setUTCHours(23, 59, 59, 999);
  const query = `query {
    viewer {
      accounts(filter: { accountTag: "${ACCOUNT_ID}" }) {
        workersInvocationsAdaptive(
          filter: {
          datetime_gt: "${startOfDay.toISOString()}",
          datetime_lt: "${endOfDay.toISOString()}"
        },
          limit: 10000
        ) {
          sum {
            requests
          }
        }
      }
    }
  }`;

  // 发送请求
  const response = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });
  const data = await response.json();
  const quer =
    data?.data?.viewer?.accounts[0]?.workersInvocationsAdaptive[0]?.sum
      ?.requests;
  return quer ? `${quer}/100000` : "无法获取";
}

updateMessage(CHAT_ID, MESSAGE_ID, NEW_TEXT);
