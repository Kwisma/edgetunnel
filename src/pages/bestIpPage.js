async function bestIP(request, env, txt = 'ADD.txt') {
    const country = request.cf?.country || 'CN';
    const url = new URL(request.url);
    async function getNipDomain() {
        try {
            const response = await fetch(atob('aHR0cHM6Ly9jbG91ZGZsYXJlLWRucy5jb20vZG5zLXF1ZXJ5P25hbWU9bmlwLjA5MDIyNy54eXomdHlwZT1UWFQ='), {
                headers: {
                    'Accept': 'application/dns-json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.Status === 0 && data.Answer && data.Answer.length > 0) {
                    // TXT记录的值通常包含在引号中，需要去除引号
                    const txtRecord = data.Answer[0].data;
                    // 去除首尾的引号
                    const domain = txtRecord.replace(/^"(.*)"$/, '$1');
                    console.log('通过DoH解析获取到域名: ' + domain);
                    return domain;
                }
            }
            console.warn('DoH解析失败，使用默认域名');
            return atob('bmlwLmxmcmVlLm9yZw==');
        } catch (error) {
            console.error('DoH解析出错:', error);
            return atob('aXAuMDkwMjI3Lnh5eg==');
        }
    }
    const nipDomain = await getNipDomain();
    async function GetCFIPs(ipSource = 'official', targetPort = '443') {
        try {
            let response;
            if (ipSource === 'as13335') {
                // AS13335列表
                response = await fetch('https://raw.githubusercontent.com/ipverse/asn-ip/master/as/13335/ipv4-aggregated.txt');
            } else if (ipSource === 'as209242') {
                // AS209242列表
                response = await fetch('https://raw.githubusercontent.com/ipverse/asn-ip/master/as/209242/ipv4-aggregated.txt');
            } else if (ipSource === 'as24429') {
                // AS24429列表
                response = await fetch('https://raw.githubusercontent.com/ipverse/asn-ip/master/as/24429/ipv4-aggregated.txt');
            } else if (ipSource === 'as35916') {
                // AS35916列表
                response = await fetch('https://raw.githubusercontent.com/ipverse/asn-ip/master/as/35916/ipv4-aggregated.txt');
            } else if (ipSource === 'as199524') {
                // AS199524列表
                response = await fetch('https://raw.githubusercontent.com/ipverse/asn-ip/master/as/199524/ipv4-aggregated.txt');
            } else if (ipSource === 'cm') {
                // CM整理列表
                response = await fetch('https://raw.githubusercontent.com/cmliu/cmliu/main/CF-CIDR.txt');
            } else if (ipSource === 'proxyip') {
                // 反代IP列表 (直接IP，非CIDR)
                response = await fetch('https://raw.githubusercontent.com/cmliu/ACL4SSR/main/baipiao.txt');
                const text = response.ok ? await response.text() : '';

                // 解析并过滤符合端口的IP
                const allLines = text.split('\n')
                    .map(line => line.trim())
                    .filter(line => line && !line.startsWith('#'));

                const validIps = [];

                for (const line of allLines) {
                    const parsedIP = parseProxyIPLine(line, targetPort);
                    if (parsedIP) {
                        validIps.push(parsedIP);
                    }
                }

                console.log(`反代IP列表解析完成，端口${targetPort}匹配到${validIps.length}个有效IP`);

                // 如果超过512个IP，随机选择512个
                if (validIps.length > 512) {
                    const shuffled = [...validIps].sort(() => 0.5 - Math.random());
                    const selectedIps = shuffled.slice(0, 512);
                    console.log(`IP数量超过512个，随机选择了${selectedIps.length}个IP`);
                    return selectedIps;
                } else {
                    return validIps;
                }
            } else {
                // CF官方列表 (默认)
                response = await fetch('https://www.cloudflare.com/ips-v4/');
            }

            const text = response.ok ? await response.text() : `173.245.48.0/20
103.21.244.0/22
103.22.200.0/22
103.31.4.0/22
141.101.64.0/18
108.162.192.0/18
190.93.240.0/20
188.114.96.0/20
197.234.240.0/22
198.41.128.0/17
162.158.0.0/15
104.16.0.0/13
104.24.0.0/14
172.64.0.0/13
131.0.72.0/22`;
            const cidrs = text.split('\n').filter(line => line.trim() && !line.startsWith('#'));

            const ips = new Set(); // 使用Set去重
            const targetCount = 512;
            let round = 1;

            // 不断轮次生成IP直到达到目标数量
            while (ips.size < targetCount) {
                console.log(`第${round}轮生成IP，当前已有${ips.size}个`);

                // 每轮为每个CIDR生成指定数量的IP
                for (const cidr of cidrs) {
                    if (ips.size >= targetCount) break;

                    const cidrIPs = generateIPsFromCIDR(cidr.trim(), round);
                    cidrIPs.forEach(ip => ips.add(ip));

                    console.log(`CIDR ${cidr} 第${round}轮生成${cidrIPs.length}个IP，总计${ips.size}个`);
                }

                round++;

                // 防止无限循环
                if (round > 100) {
                    console.warn('达到最大轮次限制，停止生成');
                    break;
                }
            }

            console.log(`最终生成${ips.size}个不重复IP`);
            return Array.from(ips).slice(0, targetCount);
        } catch (error) {
            console.error('获取CF IPs失败:', error);
            return [];
        }
    }

    // 新增：解析反代IP行的函数
    function parseProxyIPLine(line, targetPort) {
        try {
            // 移除首尾空格
            line = line.trim();
            if (!line) return null;

            let ip = '';
            let port = '';
            let comment = '';

            // 处理注释部分
            if (line.includes('#')) {
                const parts = line.split('#');
                const mainPart = parts[0].trim();
                comment = parts[1].trim();

                // 检查主要部分是否包含端口
                if (mainPart.includes(':')) {
                    const ipPortParts = mainPart.split(':');
                    if (ipPortParts.length === 2) {
                        ip = ipPortParts[0].trim();
                        port = ipPortParts[1].trim();
                    } else {
                        // 格式不正确，如":844347.254.171.15:8443"
                        console.warn(`无效的IP:端口格式: ${line}`);
                        return null;
                    }
                } else {
                    // 没有端口，默认443
                    ip = mainPart;
                    port = '443';
                }
            } else {
                // 没有注释
                if (line.includes(':')) {
                    const ipPortParts = line.split(':');
                    if (ipPortParts.length === 2) {
                        ip = ipPortParts[0].trim();
                        port = ipPortParts[1].trim();
                    } else {
                        // 格式不正确
                        console.warn(`无效的IP:端口格式: ${line}`);
                        return null;
                    }
                } else {
                    // 只有IP，默认443端口
                    ip = line;
                    port = '443';
                }
            }

            // 验证IP格式
            if (!isValidIP(ip)) {
                console.warn(`无效的IP地址: ${ip} (来源行: ${line})`);
                return null;
            }

            // 验证端口格式
            const portNum = parseInt(port);
            if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
                console.warn(`无效的端口号: ${port} (来源行: ${line})`);
                return null;
            }

            // 检查端口是否匹配
            if (port !== targetPort) {
                return null; // 端口不匹配，过滤掉
            }

            // 构建返回格式
            if (comment) {
                return ip + ':' + port + '#' + comment;
            } else {
                return ip + ':' + port;
            }

        } catch (error) {
            console.error(`解析IP行失败: ${line}`, error);
            return null;
        }
    }

    // 新增：验证IP地址格式的函数
    function isValidIP(ip) {
        const ipRegex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
        const match = ip.match(ipRegex);

        if (!match) return false;

        // 检查每个数字是否在0-255范围内
        for (let i = 1; i <= 4; i++) {
            const num = parseInt(match[i]);
            if (num < 0 || num > 255) {
                return false;
            }
        }

        return true;
    }

    function generateIPsFromCIDR(cidr, count = 1) {
        const [network, prefixLength] = cidr.split('/');
        const prefix = parseInt(prefixLength);

        // 将IP地址转换为32位整数
        const ipToInt = (ip) => {
            return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
        };

        // 将32位整数转换为IP地址
        const intToIP = (int) => {
            return [
                (int >>> 24) & 255,
                (int >>> 16) & 255,
                (int >>> 8) & 255,
                int & 255
            ].join('.');
        };

        const networkInt = ipToInt(network);
        const hostBits = 32 - prefix;
        const numHosts = Math.pow(2, hostBits);

        // 限制生成数量不超过该CIDR的可用主机数
        const maxHosts = numHosts - 2; // -2 排除网络地址和广播地址
        const actualCount = Math.min(count, maxHosts);
        const ips = new Set();

        // 如果可用主机数太少，直接返回空数组
        if (maxHosts <= 0) {
            return [];
        }

        // 生成指定数量的随机IP
        let attempts = 0;
        const maxAttempts = actualCount * 10; // 防止无限循环

        while (ips.size < actualCount && attempts < maxAttempts) {
            const randomOffset = Math.floor(Math.random() * maxHosts) + 1; // +1 避免网络地址
            const randomIP = intToIP(networkInt + randomOffset);
            ips.add(randomIP);
            attempts++;
        }

        return Array.from(ips);
    }

    // POST请求处理
    if (request.method === "POST") {
        if (!env.KV) return new Response("未绑定KV空间", { status: 400 });

        try {
            const contentType = request.headers.get('Content-Type');

            // 处理JSON格式的保存/追加请求
            if (contentType && contentType.includes('application/json')) {
                const data = await request.json();
                const action = url.searchParams.get('action') || 'save';

                if (!data.ips || !Array.isArray(data.ips)) {
                    return new Response(JSON.stringify({ error: 'Invalid IP list' }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                if (action === 'append') {
                    // 追加模式
                    const existingContent = await env.KV.get(txt) || '';
                    const newContent = data.ips.join('\n');

                    // 合并内容并去重
                    const existingLines = existingContent ?
                        existingContent.split('\n').map(line => line.trim()).filter(line => line) :
                        [];
                    const newLines = newContent.split('\n').map(line => line.trim()).filter(line => line);

                    // 使用Set进行去重
                    const allLines = [...existingLines, ...newLines];
                    const uniqueLines = [...new Set(allLines)];
                    const combinedContent = uniqueLines.join('\n');

                    // 检查合并后的内容大小
                    if (combinedContent.length > 24 * 1024 * 1024) {
                        return new Response(JSON.stringify({
                            error: `追加失败：合并后内容过大（${(combinedContent.length / 1024 / 1024).toFixed(2)}MB），超过KV存储限制（24MB）`
                        }), {
                            status: 400,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }

                    await env.KV.put(txt, combinedContent);

                    const addedCount = uniqueLines.length - existingLines.length;
                    const duplicateCount = newLines.length - addedCount;

                    let message = `成功追加 ${addedCount} 个新的优选IP（原有 ${existingLines.length} 个，现共 ${uniqueLines.length} 个）`;
                    if (duplicateCount > 0) {
                        message += `，已去重 ${duplicateCount} 个重复项`;
                    }

                    return new Response(JSON.stringify({
                        success: true,
                        message: message
                    }), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                } else {
                    // 保存模式（覆盖）
                    const content = data.ips.join('\n');

                    // 检查内容大小
                    if (content.length > 24 * 1024 * 1024) {
                        return new Response(JSON.stringify({
                            error: '内容过大，超过KV存储限制（24MB）'
                        }), {
                            status: 400,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }

                    await env.KV.put(txt, content);

                    return new Response(JSON.stringify({
                        success: true,
                        message: `成功保存 ${data.ips.length} 个优选IP`
                    }), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            } else {
                // 处理普通文本格式的保存请求（兼容原有功能）
                const content = await request.text();
                await env.KV.put(txt, content);
                return new Response("保存成功");
            }

        } catch (error) {
            console.error('处理POST请求时发生错误:', error);
            return new Response(JSON.stringify({
                error: '操作失败: ' + error.message
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    // GET请求部分
    let content = '';
    let hasKV = !!env.KV;

    if (hasKV) {
        try {
            content = await env.KV.get(txt) || '';
        } catch (error) {
            console.error('读取KV时发生错误:', error);
            content = '读取数据时发生错误: ' + error.message;
        }
    }

    // 移除初始IP加载，改为在前端动态加载
    const cfIPs = []; // 初始为空数组

    // 判断是否为中国用户
    const isChina = country === 'CN';
    const countryDisplayClass = isChina ? '' : 'proxy-warning';
    const countryDisplayText = isChina ? `${country}` : `${country} ⚠️`;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
    <title>Cloudflare IP优选</title>
    <style>
        body {
            width: 80%;
            margin: 0 auto;
            font-family: Tahoma, Verdana, Arial, sans-serif;
            padding: 20px;
        }
        .ip-list {
            background-color: #f5f5f5;
            padding: 10px;
            border-radius: 5px;
            max-height: 400px;
            overflow-y: auto;
        }
        .ip-item {
            margin: 2px 0;
            font-family: monospace;
        }
        .stats {
            background-color: #e3f2fd;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .test-info {
            margin-top: 15px;
            padding: 12px;
            background-color: #f3e5f5;
            border: 1px solid #ce93d8;
            border-radius: 6px;
            color: #4a148c;
        }
        .test-info p {
            margin: 0;
            font-size: 14px;
            line-height: 1.5;
        }
        .proxy-warning {
            color: #d32f2f !important;
            font-weight: bold !important;
            font-size: 1.1em;
        }
        .warning-notice {
            background-color: #ffebee;
            border: 2px solid #f44336;
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
            color: #c62828;
        }
        .warning-notice h3 {
            margin: 0 0 10px 0;
            color: #d32f2f;
            font-size: 1.2em;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .warning-notice p {
            margin: 8px 0;
            line-height: 1.5;
        }
        .warning-notice ul {
            margin: 10px 0 10px 20px;
            line-height: 1.6;
        }
        .test-controls {
            margin: 20px 0;
            padding: 15px;
            background-color: #f9f9f9;
            border-radius: 5px;
        }
        .port-selector {
            margin: 10px 0;
        }
        .port-selector label {
            font-weight: bold;
            margin-right: 10px;
        }
        .port-selector select {
            padding: 5px 10px;
            font-size: 14px;
            border: 1px solid #ccc;
            border-radius: 3px;
        }
        .button-group {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin-top: 15px;
        }
        .test-button {
            background-color: #4CAF50;
            color: white;
            padding: 15px 32px;
            text-align: center;
            text-decoration: none;
            display: inline-block;
            font-size: 16px;
            cursor: pointer;
            border: none;
            border-radius: 4px;
            transition: background-color 0.3s;
        }
        .test-button:disabled {
            background-color: #cccccc;
            cursor: not-allowed;
        }
        .save-button {
            background-color: #2196F3;
            color: white;
            padding: 15px 32px;
            text-align: center;
            text-decoration: none;
            display: inline-block;
            font-size: 16px;
            cursor: pointer;
            border: none;
            border-radius: 4px;
            transition: background-color 0.3s;
        }
        .save-button:disabled {
            background-color: #cccccc;
            cursor: not-allowed;
        }
        .save-button:not(:disabled):hover {
            background-color: #1976D2;
        }
        .append-button {
            background-color: #FF9800;
            color: white;
            padding: 15px 32px;
            text-align: center;
            text-decoration: none;
            display: inline-block;
            font-size: 16px;
            cursor: pointer;
            border: none;
            border-radius: 4px;
            transition: background-color 0.3s;
        }
        .append-button:disabled {
            background-color: #cccccc;
            cursor: not-allowed;
        }
        .append-button:not(:disabled):hover {
            background-color: #F57C00;
        }
        .edit-button {
            background-color: #9C27B0;
            color: white;
            padding: 15px 32px;
            text-align: center;
            text-decoration: none;
            display: inline-block;
            font-size: 16px;
            cursor: pointer;
            border: none;
            border-radius: 4px;
            transition: background-color 0.3s;
        }
        .edit-button:hover {
            background-color: #7B1FA2;
        }
        .back-button {
            background-color: #607D8B;
            color: white;
            padding: 15px 32px;
            text-align: center;
            text-decoration: none;
            display: inline-block;
            font-size: 16px;
            cursor: pointer;
            border: none;
            border-radius: 4px;
            transition: background-color 0.3s;
        }
        .back-button:hover {
            background-color: #455A64;
        }
        .save-warning {
            margin-top: 10px;
            background-color: #fff3e0;
            border: 2px solid #ff9800;
            border-radius: 6px;
            padding: 12px;
            color: #e65100;
            font-weight: bold;
        }
        .save-warning small {
            font-size: 14px;
            line-height: 1.5;
            display: block;
        }
        .message {
            padding: 10px;
            margin: 10px 0;
            border-radius: 4px;
            display: none;
        }
        .message.success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .message.error {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .progress {
            width: 100%;
            background-color: #f0f0f0;
            border-radius: 5px;
            margin: 10px 0;
        }
        .progress-bar {
            width: 0%;
            height: 20px;
            background-color: #4CAF50;
            border-radius: 5px;
            transition: width 0.3s;
        }
        .good-latency { color: #4CAF50; font-weight: bold; }
        .medium-latency { color: #FF9800; font-weight: bold; }
        .bad-latency { color: #f44336; font-weight: bold; }
        .show-more-section {
            text-align: center;
            margin: 10px 0;
            padding: 10px;
            background-color: #f0f0f0;
            border-radius: 5px;
        }
        .show-more-btn {
            background-color: #607D8B;
            color: white;
            padding: 8px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.3s;
        }
        .show-more-btn:hover {
            background-color: #455A64;
        }
        .ip-display-info {
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
        }
        .save-tip {
            margin-top: 15px;
            padding: 12px;
            background-color: #e8f5e8;
            border: 1px solid #4CAF50;
            border-radius: 6px;
            color: #2e7d32;
            font-size: 14px;
            line-height: 1.5;
        }
        .save-tip strong {
            color: #1b5e20;
        }
        .warm-tips {
            margin: 20px 0;
            padding: 15px;
            background-color: #fff3e0;
            border: 2px solid #ff9800;
            border-radius: 8px;
            color: #e65100;
        }
        .warm-tips h3 {
            margin: 0 0 10px 0;
            color: #f57c00;
            font-size: 1.1em;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .warm-tips p {
            margin: 8px 0;
            line-height: 1.6;
            font-size: 14px;
        }
        .warm-tips ul {
            margin: 10px 0 10px 20px;
            line-height: 1.6;
        }
        .warm-tips li {
            margin: 5px 0;
            font-size: 14px;
        }
        .warm-tips strong {
            color: #e65100;
            font-weight: bold;
        }
        .region-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 10px;
        }
        .region-btn {
            padding: 6px 12px;
            background-color: #e0e0e0;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s;
        }
        .region-btn:hover {
            background-color: #d5d5d5;
        }
        .region-btn.active {
            background-color: #2196F3;
            color: white;
        }
    </style>
    </head>
    <body>
    <h1>在线优选IP</h1>
    
    ${!isChina ? `
    <div class="warning-notice">
        <h3>🚨 代理检测警告</h3>
        <p><strong>检测到您当前很可能处于代理/VPN环境中！</strong></p>
        <p>在代理状态下进行的IP优选测试结果将不准确，可能导致：</p>
        <ul>
            <li>延迟数据失真，无法反映真实网络状况</li>
            <li>优选出的IP在直连环境下表现不佳</li>
            <li>测试结果对实际使用场景参考价值有限</li>
        </ul>
        <p><strong>建议操作：</strong>请关闭所有代理软件（VPN、科学上网工具等），确保处于直连网络环境后重新访问本页面。</p>
    </div>
    ` : ''}

    <div class="stats">
        <h2>统计信息</h2>
        <p><strong>您的国家：</strong><span class="${countryDisplayClass}">${countryDisplayText}</span></p>
        <p><strong>获取到的IP总数：</strong><span id="ip-count">点击开始测试后加载</span></p>
        <p><strong>测试进度：</strong><span id="progress-text">未开始</span></p>
        <div class="progress">
            <div class="progress-bar" id="progress-bar"></div>
        </div>
        <div class="test-info">
            <p><strong>📊 测试说明：</strong>当前优选方式仅进行网络延迟测试，主要评估连接响应速度，并未包含带宽速度测试。延迟测试可快速筛选出响应最快的IP节点，适合日常使用场景的初步优选。</p>
        </div>
    </div>
    
    <div class="warm-tips" id="warm-tips">
        <h3>💡 温馨提示</h3>
        <p><strong>优选完成但测试"真连接延迟"为 -1？</strong>这很有可能是您的网络运营商对你的请求进行了阻断。</p>
        <p><strong>建议尝试以下解决方案：</strong></p>
        <ul>
            <li><strong>更换端口：</strong>尝试使用其他端口（如 2053、2083、2087、2096、8443）</li>
            <li><strong>更换IP库：</strong>切换到不同的IP来源（CM整理列表、AS13335、AS209242列表等，但如果你不明白AS24429和AS199524意味着什么，那就不要选。）</li>
            <li><strong>更换自定义域名：</strong>如果您使用的还是免费域名，那么您更应该尝试一下更换自定义域</li>
        </ul>
        <p>💡 <strong>小贴士：</strong>不同地区和网络环境对各端口的支持情况可能不同，多尝试几个端口组合通常能找到适合的IP。</p>
    </div>

    <div class="test-controls">
        <div class="port-selector">
            <label for="ip-source-select">IP库：</label>
            <select id="ip-source-select">
                <option value="official">CF官方列表</option>
                <option value="cm">CM整理列表</option>
                <option value="as13335">AS13335列表</option>
                <option value="as209242">AS209242列表</option>
                <option value="as24429">AS24429列表(Alibaba)</option>
                <option value="as199524">AS199524列表(G-Core)</option>
                <option value="proxyip">反代IP列表</option>
            </select>

            <label for="port-select" style="margin-left: 20px;">端口：</label>
            <select id="port-select">
                <option value="443">443</option>
                <option value="2053">2053</option>
                <option value="2083">2083</option>
                <option value="2087">2087</option>
                <option value="2096">2096</option>
                <option value="8443">8443</option>
            </select>
        </div>
        <div class="button-group">
            <button class="test-button" id="test-btn" onclick="startTest()">开始延迟测试</button>
            <button class="save-button" id="save-btn" onclick="saveIPs()" disabled>覆盖保存优选IP</button>
            <button class="append-button" id="append-btn" onclick="appendIPs()" disabled>追加保存优选IP</button>
            <button class="edit-button" id="edit-btn" onclick="goEdit()">编辑优选列表</button>
            <button class="back-button" id="back-btn" onclick="goBack()">返回配置页</button>
        </div>
        <div class="save-warning">
            <small>⚠️ 重要提醒："覆盖保存优选IP"会完全覆盖当前 addresses/ADD 优选内容，请慎重考虑！建议优先使用"追加保存优选IP"功能。</small>
        </div>
        <div class="save-tip">
            <strong>💡 保存提示：</strong>[<strong>覆盖保存优选IP</strong>] 和 [<strong>追加保存优选IP</strong>] 功能仅会保存延迟最低的<strong>前16个优选IP</strong>。如需添加更多IP或进行自定义编辑，请使用 [<strong>编辑优选列表</strong>] 功能。
        </div>
        <div id="message" class="message"></div>
    </div>
    
    <h2>IP列表 <span id="result-count"></span></h2>
    <div class="ip-display-info" id="ip-display-info"></div>
    <div id="region-filter" style="margin: 15px 0; display: none;"></div>
    <div class="ip-list" id="ip-list">
        <div class="ip-item">请选择端口和IP库，然后点击"开始延迟测试"加载IP列表</div>
    </div>
    <div class="show-more-section" id="show-more-section" style="display: none;">
        <button class="show-more-btn" id="show-more-btn" onclick="toggleShowMore()">显示更多</button>
    </div>
    
    <script>
        let originalIPs = []; // 改为动态加载
        let testResults = [];
        let displayedResults = []; // 新增：存储当前显示的结果
        let showingAll = false; // 新增：标记是否显示全部内容
        let currentDisplayType = 'loading'; // 新增：当前显示类型 'loading' | 'results'
        let cloudflareLocations = {}; // 新增：存储Cloudflare位置信息
        
        // 新增：本地存储管理
        const StorageKeys = {
            PORT: 'cf-ip-test-port',
            IP_SOURCE: 'cf-ip-test-source'
        };
        
        // 新增：加载Cloudflare位置信息
        async function loadCloudflareLocations() {
            try {
                const response = await fetch('https://speed.cloudflare.com/locations');
                if (response.ok) {
                    const locations = await response.json();
                    // 转换为以iata为key的对象，便于快速查找
                    cloudflareLocations = {};
                    locations.forEach(location => {
                        cloudflareLocations[location.iata] = location;
                    });
                    console.log('Cloudflare位置信息加载成功:', Object.keys(cloudflareLocations).length, '个位置');
                } else {
                    console.warn('无法加载Cloudflare位置信息，将使用原始colo值');
                }
            } catch (error) {
                console.error('加载Cloudflare位置信息失败:', error);
                console.warn('将使用原始colo值');
            }
        }
        
        // 初始化页面设置
        function initializeSettings() {
            const portSelect = document.getElementById('port-select');
            const ipSourceSelect = document.getElementById('ip-source-select');
            
            // 从本地存储读取上次的选择
            const savedPort = localStorage.getItem(StorageKeys.PORT);
            const savedIPSource = localStorage.getItem(StorageKeys.IP_SOURCE);
            
            // 恢复端口选择
            if (savedPort && portSelect.querySelector(\`option[value="\${savedPort}"]\`)) {
                portSelect.value = savedPort;
            } else {
                portSelect.value = '8443'; // 默认值
            }
            
            // 恢复IP库选择
            if (savedIPSource && ipSourceSelect.querySelector(\`option[value="\${savedIPSource}"]\`)) {
                ipSourceSelect.value = savedIPSource;
            } else {
                ipSourceSelect.value = 'official'; // 默认值改为CF官方列表
            }
            
            // 添加事件监听器保存选择
            portSelect.addEventListener('change', function() {
                localStorage.setItem(StorageKeys.PORT, this.value);
            });
            
            ipSourceSelect.addEventListener('change', function() {
                localStorage.setItem(StorageKeys.IP_SOURCE, this.value);
            });
        }
        
        // 页面加载完成后初始化设置
        document.addEventListener('DOMContentLoaded', async function() {
            // 先加载Cloudflare位置信息
            await loadCloudflareLocations();
            // 然后初始化页面设置
            initializeSettings();
        });
        
        // 新增：切换显示更多/更少
        function toggleShowMore() {
            // 在测试过程中不允许切换显示
            if (currentDisplayType === 'testing') {
                return;
            }
            
            showingAll = !showingAll;
            
            if (currentDisplayType === 'loading') {
                displayLoadedIPs();
            } else if (currentDisplayType === 'results') {
                displayResults();
            }
        }
        
        // 新增：显示加载的IP列表
        function displayLoadedIPs() {
            const ipList = document.getElementById('ip-list');
            const showMoreSection = document.getElementById('show-more-section');
            const showMoreBtn = document.getElementById('show-more-btn');
            const ipDisplayInfo = document.getElementById('ip-display-info');
            
            if (originalIPs.length === 0) {
                ipList.innerHTML = '<div class="ip-item">加载IP列表失败，请重试</div>';
                showMoreSection.style.display = 'none';
                ipDisplayInfo.textContent = '';
                return;
            }
            
            const displayCount = showingAll ? originalIPs.length : Math.min(originalIPs.length, 16);
            const displayIPs = originalIPs.slice(0, displayCount);
            
            // 更新显示信息
            if (originalIPs.length <= 16) {
                ipDisplayInfo.textContent = \`显示全部 \${originalIPs.length} 个IP\`;
                showMoreSection.style.display = 'none';
            } else {
                ipDisplayInfo.textContent = \`显示前 \${displayCount} 个IP，共加载 \${originalIPs.length} 个IP\`;
                // 只在非测试状态下显示"显示更多"按钮
                if (currentDisplayType !== 'testing') {
                    showMoreSection.style.display = 'block';
                    showMoreBtn.textContent = showingAll ? '显示更少' : '显示更多';
                    showMoreBtn.disabled = false;
                } else {
                    showMoreSection.style.display = 'none';
                }
            }
            
            // 显示IP列表
            ipList.innerHTML = displayIPs.map(ip => \`<div class="ip-item">\${ip}</div>\`).join('');
        }
        
        function showMessage(text, type = 'success') {
            const messageDiv = document.getElementById('message');
            messageDiv.textContent = text;
            messageDiv.className = \`message \${type}\`;
            messageDiv.style.display = 'block';
            
            // 3秒后自动隐藏消息
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 3000);
        }
        
        function updateButtonStates() {
            const saveBtn = document.getElementById('save-btn');
            const appendBtn = document.getElementById('append-btn');
            const hasResults = displayedResults.length > 0;
            
            saveBtn.disabled = !hasResults;
            appendBtn.disabled = !hasResults;
        }
        
        function disableAllButtons() {
            const testBtn = document.getElementById('test-btn');
            const saveBtn = document.getElementById('save-btn');
            const appendBtn = document.getElementById('append-btn');
            const editBtn = document.getElementById('edit-btn');
            const backBtn = document.getElementById('back-btn');
            const portSelect = document.getElementById('port-select');
            const ipSourceSelect = document.getElementById('ip-source-select');
            
            testBtn.disabled = true;
            saveBtn.disabled = true;
            appendBtn.disabled = true;
            editBtn.disabled = true;
            backBtn.disabled = true;
            portSelect.disabled = true;
            ipSourceSelect.disabled = true;
        }
        
        function enableButtons() {
            const testBtn = document.getElementById('test-btn');
            const editBtn = document.getElementById('edit-btn');
            const backBtn = document.getElementById('back-btn');
            const portSelect = document.getElementById('port-select');
            const ipSourceSelect = document.getElementById('ip-source-select');
            
            testBtn.disabled = false;
            editBtn.disabled = false;
            backBtn.disabled = false;
            portSelect.disabled = false;
            ipSourceSelect.disabled = false;
            updateButtonStates();
        }
        
        async function saveIPs() {
            // 使用当前显示的结果而不是全部结果
            let ipsToSave = [];
            if (document.getElementById('region-filter') && document.getElementById('region-filter').style.display !== 'none') {
                // 如果地区筛选器可见，使用筛选后的结果
                ipsToSave = displayedResults;
            } else {
                // 否则使用全部测试结果
                ipsToSave = testResults;
            }
            
            if (ipsToSave.length === 0) {
                showMessage('没有可保存的IP结果', 'error');
                return;
            }
            
            const saveBtn = document.getElementById('save-btn');
            const originalText = saveBtn.textContent;
            
            // 禁用所有按钮
            disableAllButtons();
            saveBtn.textContent = '保存中...';
            
            try {
                // 只保存前16个最优IP
                const saveCount = Math.min(ipsToSave.length, 16);
                const ips = ipsToSave.slice(0, saveCount).map(result => result.display);
                
                const response = await fetch('?action=save', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ ips })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showMessage(data.message + '（已保存前' + saveCount + '个最优IP）', 'success');
                } else {
                    showMessage(data.error || '保存失败', 'error');
                }
                
            } catch (error) {
                showMessage('保存失败: ' + error.message, 'error');
            } finally {
                saveBtn.textContent = originalText;
                enableButtons();
            }
        }
        
        async function appendIPs() {
            // 使用当前显示的结果而不是全部结果
            let ipsToAppend = [];
            if (document.getElementById('region-filter') && document.getElementById('region-filter').style.display !== 'none') {
                // 如果地区筛选器可见，使用筛选后的结果
                ipsToAppend = displayedResults;
            } else {
                // 否则使用全部测试结果
                ipsToAppend = testResults;
            }
            
            if (ipsToAppend.length === 0) {
                showMessage('没有可追加的IP结果', 'error');
                return;
            }
            
            const appendBtn = document.getElementById('append-btn');
            const originalText = appendBtn.textContent;
            
            // 禁用所有按钮
            disableAllButtons();
            appendBtn.textContent = '追加中...';
            
            try {
                // 只追加前16个最优IP
                const saveCount = Math.min(ipsToAppend.length, 16);
                const ips = ipsToAppend.slice(0, saveCount).map(result => result.display);
                
                const response = await fetch('?action=append', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ ips })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showMessage(data.message + '（已追加前' + saveCount + '个最优IP）', 'success');
                } else {
                    showMessage(data.error || '追加失败', 'error');
                }
                
            } catch (error) {
                showMessage('追加失败: ' + error.message, 'error');
            } finally {
                appendBtn.textContent = originalText;
                enableButtons();
            }
        }
        
        function goEdit() {
            const currentUrl = window.location.href;
            const parentUrl = currentUrl.substring(0, currentUrl.lastIndexOf('/'));
            window.location.href = parentUrl + '/edit';
        }
        
        function goBack() {
            const currentUrl = window.location.href;
            const parentUrl = currentUrl.substring(0, currentUrl.lastIndexOf('/'));
            window.location.href = parentUrl;
        }
        
        async function testIP(ip, port) {
            const timeout = 5000; // 增加超时时间到5秒
            
            // 解析IP格式
            const parsedIP = parseIPFormat(ip, port);
            if (!parsedIP) {
                return null;
            }
            
            // 进行测试，最多重试3次
            let lastError = null;
            for (let attempt = 1; attempt <= 3; attempt++) {
                const result = await singleTest(parsedIP.host, parsedIP.port, timeout);
                if (result) {
                    console.log(\`IP \${parsedIP.host}:\${parsedIP.port} 第\${attempt}次测试成功: \${result.latency}ms, colo: \${result.colo}, 类型: \${result.type}\`);
                    
                    // 根据colo字段获取国家代码
                    const locationCode = cloudflareLocations[result.colo] ? cloudflareLocations[result.colo].cca2 : result.colo;
                    
                    // 生成显示格式
                    const typeText = result.type === 'official' ? '官方优选' : '反代优选';
                    const display = \`\${parsedIP.host}:\${parsedIP.port}#\${locationCode} \${typeText} \${result.latency}ms\`;
                    
                    return {
                        ip: parsedIP.host,
                        port: parsedIP.port,
                        latency: result.latency,
                        colo: result.colo,
                        type: result.type,
                        locationCode: locationCode,
                        comment: \`\${locationCode} \${typeText}\`,
                        display: display
                    };
                } else {
                    console.log(\`IP \${parsedIP.host}:\${parsedIP.port} 第\${attempt}次测试失败\`);
                    if (attempt < 3) {
                        // 短暂延迟后重试
                        await new Promise(resolve => setTimeout(resolve, 200));
                    }
                }
            }
            
            return null; // 所有尝试都失败
        }
        
        // 新增：解析IP格式的函数
        function parseIPFormat(ipString, defaultPort) {
            try {
                let host, port, comment;
                
                // 先处理注释部分（#之后的内容）
                let mainPart = ipString;
                if (ipString.includes('#')) {
                    const parts = ipString.split('#');
                    mainPart = parts[0];
                    comment = parts[1];
                }
                
                // 处理端口部分
                if (mainPart.includes(':')) {
                    const parts = mainPart.split(':');
                    host = parts[0];
                    port = parseInt(parts[1]);
                } else {
                    host = mainPart;
                    port = parseInt(defaultPort);
                }
                
                // 验证IP格式
                if (!host || !port || isNaN(port)) {
                    return null;
                }
                
                return {
                    host: host.trim(),
                    port: port,
                    comment: comment ? comment.trim() : null
                };
            } catch (error) {
                console.error('解析IP格式失败:', ipString, error);
                return null;
            }
        }
        
        async function singleTest(ip, port, timeout) {
            // 先进行预请求以缓存DNS解析结果
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);
                const parts = ip.split('.').map(part => {
                    const hex = parseInt(part, 10).toString(16);
                    return hex.length === 1 ? '0' + hex : hex; // 补零
                });
                const nip = parts.join('');
                
                // 预请求，不计入延迟时间
                await fetch('https://' + nip + '.${nipDomain}:' + port + '/cdn-cgi/trace', {
                    signal: controller.signal,
                    mode: 'cors'
                });
                
                clearTimeout(timeoutId);
            } catch (preRequestError) {
                // 预请求失败可以忽略，继续进行正式测试
                console.log('预请求失败 (' + ip + ':' + port + '):', preRequestError.message);
            }
            
            // 正式延迟测试
            const startTime = Date.now();
            
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);
                const parts = ip.split('.').map(part => {
                    const hex = parseInt(part, 10).toString(16);
                    return hex.length === 1 ? '0' + hex : hex; // 补零
                });
                const nip = parts.join('');
                const response = await fetch('https://' + nip + '.${nipDomain}:' + port + '/cdn-cgi/trace', {
                    signal: controller.signal,
                    mode: 'cors'
                });
                
                clearTimeout(timeoutId);
                
                // 检查响应状态
                if (response.status === 200) {
                    const latency = Date.now() - startTime;
                    const responseText = await response.text();
                    
                    // 解析trace响应
                    const traceData = parseTraceResponse(responseText);
                    
                    if (traceData && traceData.ip && traceData.colo) {
                        // 判断IP类型
                        const responseIP = traceData.ip;
                        let ipType = 'official'; // 默认官方IP
                        
                        // 检查是否是IPv6（包含冒号）或者IP相等
                        if (responseIP.includes(':') || responseIP === ip) {
                            ipType = 'proxy'; // 反代IP
                        }
                        // 如果responseIP与ip不相等且不是IPv6，则是官方IP
                        
                        return {
                            ip: ip,
                            port: port,
                            latency: latency,
                            colo: traceData.colo,
                            type: ipType,
                            responseIP: responseIP
                        };
                    }
                }
                
                return null;
                
            } catch (error) {
                const latency = Date.now() - startTime;
                
                // 检查是否是真正的超时（接近设定的timeout时间）
                if (latency >= timeout - 100) {
                    return null;
                }
                
                return null;
            }
        }
        
        // 新增：解析trace响应的函数
        function parseTraceResponse(responseText) {
            try {
                const lines = responseText.split('\\n');
                const data = {};
                
                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (trimmedLine && trimmedLine.includes('=')) {
                        const [key, value] = trimmedLine.split('=', 2);
                        data[key] = value;
                    }
                }
                
                return data;
            } catch (error) {
                console.error('解析trace响应失败:', error);
                return null;
            }
        }
        
        async function testIPsWithConcurrency(ips, port, maxConcurrency = 32) {
            const results = [];
            const totalIPs = ips.length;
            let completedTests = 0;
            
            const progressBar = document.getElementById('progress-bar');
            const progressText = document.getElementById('progress-text');
            
            // 创建工作队列
            let index = 0;
            
            async function worker() {
                while (index < ips.length) {
                    const currentIndex = index++;
                    const ip = ips[currentIndex];
                    
                    const result = await testIP(ip, port);
                    if (result) {
                        results.push(result);
                    }
                    
                    completedTests++;
                    
                    // 更新进度
                    const progress = (completedTests / totalIPs) * 100;
                    progressBar.style.width = progress + '%';
                    progressText.textContent = \`\${completedTests}/\${totalIPs} (\${progress.toFixed(1)}%) - 有效IP: \${results.length}\`;
                }
            }
            
            // 创建工作线程
            const workers = Array(Math.min(maxConcurrency, ips.length))
                .fill()
                .map(() => worker());
            
            await Promise.all(workers);
            
            return results;
        }
        
        async function startTest() {
            const testBtn = document.getElementById('test-btn');
            const portSelect = document.getElementById('port-select');
            const ipSourceSelect = document.getElementById('ip-source-select');
            const progressBar = document.getElementById('progress-bar');
            const progressText = document.getElementById('progress-text');
            const ipList = document.getElementById('ip-list');
            const resultCount = document.getElementById('result-count');
            const ipCount = document.getElementById('ip-count');
            const ipDisplayInfo = document.getElementById('ip-display-info');
            const showMoreSection = document.getElementById('show-more-section');
            
            const selectedPort = portSelect.value;
            const selectedIPSource = ipSourceSelect.value;
            
            // 保存当前选择到本地存储
            localStorage.setItem(StorageKeys.PORT, selectedPort);
            localStorage.setItem(StorageKeys.IP_SOURCE, selectedIPSource);
            
            testBtn.disabled = true;
            testBtn.textContent = '加载IP列表...';
            portSelect.disabled = true;
            ipSourceSelect.disabled = true;
            testResults = [];
            displayedResults = []; // 重置显示结果
            showingAll = false; // 重置显示状态
            currentDisplayType = 'loading'; // 设置当前显示类型
            ipList.innerHTML = '<div class="ip-item">正在加载IP列表，请稍候...</div>';
            ipDisplayInfo.textContent = '';
            showMoreSection.style.display = 'none';
            updateButtonStates(); // 更新按钮状态
            
            // 重置进度条
            progressBar.style.width = '0%';
            
            // 根据IP库类型显示对应的加载信息
            let ipSourceName = '';
            switch(selectedIPSource) {
                case 'official':
                    ipSourceName = 'CF官方';
                    break;
                case 'cm':
                    ipSourceName = 'CM整理';
                    break;
                case 'as13335':
                    ipSourceName = 'CF全段';
                    break;
                case 'as209242':
                    ipSourceName = 'CF非官方';
                    break;
                case 'as24429':
                    ipSourceName = 'Alibaba';
                    break;
                case 'as199524':
                    ipSourceName = 'G-Core';
                    break;
                case 'proxyip':
                    ipSourceName = '反代IP';
                    break;
                default:
                    ipSourceName = '未知';
            }
            
            progressText.textContent = '正在加载 ' + ipSourceName + ' IP列表...';
            
            // 加载IP列表
            originalIPs = await loadIPs(selectedIPSource, selectedPort);

            if (originalIPs.length === 0) {
                ipList.innerHTML = '<div class="ip-item">加载IP列表失败，请重试</div>';
                ipCount.textContent = '0 个';
                testBtn.disabled = false;
                testBtn.textContent = '开始延迟测试';
                portSelect.disabled = false;
                ipSourceSelect.disabled = false;
                progressText.textContent = '加载失败';
                return;
            }
            
            // 更新IP数量显示
            ipCount.textContent = originalIPs.length + ' 个';
            
            // 显示加载的IP列表（默认显示前16个）
            displayLoadedIPs();
            
            // 开始测试
            testBtn.textContent = '测试中...';
            progressText.textContent = '开始测试端口 ' + selectedPort + '...';
            currentDisplayType = 'testing'; // 切换到测试状态
            
            // 在测试开始时隐藏显示更多按钮
            showMoreSection.style.display = 'none';
            
            // 使用更高的并发数（从16增加到32）来加快测试速度
            const results = await testIPsWithConcurrency(originalIPs, selectedPort, 32);
            
            // 按延迟排序
            testResults = results.sort((a, b) => a.latency - b.latency);
            
            // 显示结果
            currentDisplayType = 'results'; // 切换到结果显示状态
            showingAll = false; // 重置显示状态
            displayResults();
            
            // 创建地区筛选器
            createRegionFilter();
            
            testBtn.disabled = false;
            testBtn.textContent = '重新测试';
            portSelect.disabled = false;
            ipSourceSelect.disabled = false;
            progressText.textContent = '完成 - 有效IP: ' + testResults.length + '/' + originalIPs.length + ' (端口: ' + selectedPort + ', IP库: ' + ipSourceName + ')';
        }
        
        // 新增：加载IP列表的函数
        async function loadIPs(ipSource, port) {
            try {
                const response = await fetch(\`?loadIPs=\${ipSource}&port=\${port}\`, {
                    method: 'GET'
                });
                
                if (!response.ok) {
                    throw new Error('Failed to load IPs');
                }
                
                const data = await response.json();
                return data.ips || [];
            } catch (error) {
                console.error('加载IP列表失败:', error);
                return [];
            }
        }
        
        function displayResults() {
            const ipList = document.getElementById('ip-list');
            const resultCount = document.getElementById('result-count');
            const showMoreSection = document.getElementById('show-more-section');
            const showMoreBtn = document.getElementById('show-more-btn');
            const ipDisplayInfo = document.getElementById('ip-display-info');
            
            if (testResults.length === 0) {
                ipList.innerHTML = '<div class="ip-item">未找到有效的IP</div>';
                resultCount.textContent = '';
                ipDisplayInfo.textContent = '';
                showMoreSection.style.display = 'none';
                displayedResults = [];
                updateButtonStates();
                return;
            }
            
            // 确定显示数量
            const maxDisplayCount = showingAll ? testResults.length : Math.min(testResults.length, 16);
            displayedResults = testResults.slice(0, maxDisplayCount);
            
            // 更新结果计数显示
            if (testResults.length <= 16) {
                resultCount.textContent = '(共测试出 ' + testResults.length + ' 个有效IP)';
                ipDisplayInfo.textContent = '显示全部 ' + testResults.length + ' 个测试结果';
                showMoreSection.style.display = 'none';
            } else {
                resultCount.textContent = '(共测试出 ' + testResults.length + ' 个有效IP)';
                ipDisplayInfo.textContent = '显示前 ' + maxDisplayCount + ' 个测试结果，共 ' + testResults.length + ' 个有效IP';
                showMoreSection.style.display = 'block';
                showMoreBtn.textContent = showingAll ? '显示更少' : '显示更多';
                showMoreBtn.disabled = false; // 确保在结果显示时启用按钮
            }
            
            const resultsHTML = displayedResults.map(result => {
                let className = 'good-latency';
                if (result.latency > 200) className = 'bad-latency';
                else if (result.latency > 100) className = 'medium-latency';
                
                return '<div class="ip-item ' + className + '">' + result.display + '</div>';
            }).join('');
            
            ipList.innerHTML = resultsHTML;
            updateButtonStates();
        }
        
        // 新增：创建地区筛选器
        function createRegionFilter() {
            // 获取所有唯一的地区代码（使用cca2代码）
            const uniqueRegions = [...new Set(testResults.map(result => result.locationCode))];
            uniqueRegions.sort(); // 按字母顺序排序
            
            const filterContainer = document.getElementById('region-filter');
            if (!filterContainer) return;
            
            if (uniqueRegions.length === 0) {
                filterContainer.style.display = 'none';
                return;
            }
            
            // 创建筛选按钮
            let filterHTML = '<h3>地区筛选：</h3><div class="region-buttons">';
            filterHTML += '<button class="region-btn active" data-region="all">全部 (' + testResults.length + ')</button>';
            
            uniqueRegions.forEach(region => {
                const count = testResults.filter(r => r.locationCode === region).length;
                filterHTML += '<button class="region-btn" data-region="' + region + '">' + region + ' (' + count + ')</button>';
            });
            
            filterHTML += '</div>';
            filterContainer.innerHTML = filterHTML;
            filterContainer.style.display = 'block';
            
            // 添加点击事件
            document.querySelectorAll('.region-btn').forEach(button => {
                button.addEventListener('click', function() {
                    // 更新活动按钮
                    document.querySelectorAll('.region-btn').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    this.classList.add('active');
                    
                    // 筛选结果
                    const selectedRegion = this.getAttribute('data-region');
                    if (selectedRegion === 'all') {
                        displayedResults = [...testResults];
                    } else {
                        displayedResults = testResults.filter(result => result.locationCode === selectedRegion);
                    }
                    
                    // 重置显示状态
                    showingAll = false;
                    displayFilteredResults();
                });
            });
        }
        
        // 新增：显示筛选后的结果
        function displayFilteredResults() {
            const ipList = document.getElementById('ip-list');
            const resultCount = document.getElementById('result-count');
            const showMoreSection = document.getElementById('show-more-section');
            const showMoreBtn = document.getElementById('show-more-btn');
            const ipDisplayInfo = document.getElementById('ip-display-info');
            
            if (displayedResults.length === 0) {
                ipList.innerHTML = '<div class="ip-item">未找到有效的IP</div>';
                resultCount.textContent = '';
                ipDisplayInfo.textContent = '';
                showMoreSection.style.display = 'none';
                updateButtonStates();
                return;
            }
            
            // 确定显示数量
            const maxDisplayCount = showingAll ? displayedResults.length : Math.min(displayedResults.length, 16);
            const currentResults = displayedResults.slice(0, maxDisplayCount);
            
            // 更新结果计数显示
            const totalCount = testResults.length;
            const filteredCount = displayedResults.length;
            
            if (filteredCount <= 16) {
                resultCount.textContent = '(共测试出 ' + totalCount + ' 个有效IP，筛选出 ' + filteredCount + ' 个)';
                ipDisplayInfo.textContent = '显示全部 ' + filteredCount + ' 个筛选结果';
                showMoreSection.style.display = 'none';
            } else {
                resultCount.textContent = '(共测试出 ' + totalCount + ' 个有效IP，筛选出 ' + filteredCount + ' 个)';
                ipDisplayInfo.textContent = '显示前 ' + maxDisplayCount + ' 个筛选结果，共 ' + filteredCount + ' 个';
                showMoreSection.style.display = 'block';
                showMoreBtn.textContent = showingAll ? '显示更少' : '显示更多';
                showMoreBtn.disabled = false;
            }
            
            const resultsHTML = currentResults.map(result => {
                let className = 'good-latency';
                if (result.latency > 200) className = 'bad-latency';
                else if (result.latency > 100) className = 'medium-latency';
                
                return '<div class="ip-item ' + className + '">' + result.display + '</div>';
            }).join('');
            
            ipList.innerHTML = resultsHTML;
            updateButtonStates();
        }
    </script>
    
    </body>
    </html>
    `;

    // 处理加载IP的请求
    if (url.searchParams.get('loadIPs')) {
        const ipSource = url.searchParams.get('loadIPs');
        const port = url.searchParams.get('port') || '443';
        const ips = await GetCFIPs(ipSource, port);

        return new Response(JSON.stringify({ ips }), {
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    return new Response(html, {
        headers: {
            'Content-Type': 'text/html; charset=UTF-8',
        },
    });
}
export { bestIP };