export default class getEnv {
    constructor(request, env) {
        this.request = request;
        this.UA = request.headers.get('User-Agent') || 'null';
        this.userAgent = this.userAgent.toLowerCase();
        this.env = env;
        this.userID = env.UUID || env.uuid || env.PASSWORD || env.pswd || env.KEY || env.TOKEN;
        this.proxyIP = env.proxyIP;
        this.DNS64Server = env.DNS64Server;
        this.sub = env.sub;
        this.subConverter = env.subConverter || atob('U1VCQVBJLkNNTGl1c3Nzcy5uZXQ=');
        this.subConfig = env.subConfig || atob('aHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL0FDTDRTU1IvQUNMNFNTUi9tYXN0ZXIvQ2xhc2gvY29uZmlnL0FDTDRTU1JfT25saW5lX01pbmlfTXVsdGlNb2RlLmluaQ==');
        this.subProtocol = env.subProtocol || 'https';
        this.subEmoji = env.subEmoji || 'true';
        this.socks5Address = env.socks5Address || '';
        this.parsedSocks5Address = env.parsedSocks5Address || {};
        this.enableSocks = env.enableSocks || false;
        this.enableHttp = env.enableHttp || false;
        this.noTLS = env.noTLS || 'false';
        this.expire = Number(env.expire) || 4102329600;//2099-12-31
        this.proxyIPs = env.proxyIPs || [];
        this.socks5s = env.socks5s || [];
        this.go2Socks5s = env.go2Socks5s || [
            '*ttvnw.net',
            '*tapecontent.net',
            '*cloudatacdn.com',
            '*.loadshare.org',
        ];
        this.addresses = env.addresses || [];
        this.addressesapi = env.addressesapi || [];
        this.addressesnotls = env.addressesnotls || [];
        this.addressesnotlsapi = env.addressesnotlsapi || [];
        this.addressescsv = env.addressescsv || [];
        this.DLS = Number(env.DLS) || 8;
        this.remarkIndex = Number(env.remarkIndex) || 1;//CSV备注所在列偏移量
        this.FileName = env.FileName || atob('ZWRnZXR1bm5lbA==');
        this.BotToken = env.BotToken || '';
        this.ChatID = env.ChatID || '';
        this.proxyhosts = env.proxyhosts || [];
        this.proxyhostsURL = env.proxyhostsURL || atob('aHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL2NtbGl1L2NtbGl1L21haW4vUHJveHlIT1NU');
        this.RproxyIP = env.RproxyIP || 'false';
        this.RproxyIPs = env.RproxyIPs || [];
        this.httpPorts = env.httpPorts || ["8080", "8880", "2052", "2082", "2086", "2095"];
        this.httpsPorts = env.httpsPorts || ["2053", "2083", "2087", "2096", "8443"];
        this.有效时间 = Number(env.TIME) || 7;
        this.更新时间 = Number(env.UPTIME) || 3;
        this.userIDLow = env.userID || this.userID;
        this.userIDTime = env.userIDTime || "";
        this.proxyIPPool = env.proxyIPPool || [];
        this.path = env.path || '/?ed=2560';
        this.动态UUID = env.userID || this.userID;
        this.link = env.link || [];
        this.banHosts = env.banHosts || [atob('c3BlZWQuY2xvdWRmbGFyZS5jb20=')];
        this.SCV = env.SCV || 'true';
        this.allowInsecure = env.allowInsecure || '&allowInsecure=1';
    }
}
