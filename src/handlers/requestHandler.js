// 导入其他处理器和服务
import { handleWebSocket } from './wsHandler.js';
import { handleProxyRequest } from './proxyHandler.js';
import { handleAdminPage } from './adminHandler.js';

/**
 * 主请求处理器
 */
export async function handleRequest(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // 处理WebSocket连接
  if (request.headers.get('Upgrade') === 'websocket') {
    return handleWebSocket(request, env, ctx);
  }
  
  // 处理管理页面请求
  if (path.startsWith('/admin') || path.startsWith('/bestip') || path.startsWith('/edit')) {
    return handleAdminPage(request, env, ctx);
  }
  
  // 处理代理请求
  return handleProxyRequest(request, env, ctx);
}