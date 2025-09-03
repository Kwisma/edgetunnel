import { handleSOCKS5, handleHTTPProxy } from '../services/ipService.js';
import { 生成配置信息 } from '../services/configService.js';

/**
 * 处理代理请求
 */
export async function handleProxyRequest(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const userAgent = request.headers.get('User-Agent') || '';
    
    // HTTP代理逻辑
    if (path === '/proxy' || path === '/http') {
        return handleHTTPProxy(request, env, ctx);
    }
    
    // SOCKS5代理逻辑
    if (path === '/socks5') {
        return handleSOCKS5(request, env, ctx);
    }
    
    // 配置生成逻辑 - 处理根路径或特定UUID路径的请求
    const pathParts = path.split('/').filter(Boolean);
    if (pathParts.length <= 1) {
        // 提取必要的参数
        const userID = pathParts[0] || '默认UUID';
        const hostName = url.hostname;
        const sub = url.searchParams.get('sub') || '';
        const RproxyIP = url.searchParams.get('rproxyip') || 'false';
        const fakeUserID = userID;
        const fakeHostName = hostName;
        
        try {
            const configHtml = await 生成配置信息(userID, hostName, sub, userAgent, RproxyIP, url, fakeUserID, fakeHostName, env);
            return new Response(configHtml, {
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
            });
        } catch (error) {
            console.error('生成配置信息时出错:', error);
            return new Response('生成配置信息时出错', { status: 500 });
        }
    }
    
    return new Response('Not found', { status: 404 });
}