// 导入主请求处理器
import { handleRequest } from './handlers/requestHandler.js';
// 默认导出fetch函数，作为Cloudflare Workers的入口点
export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env, ctx);
  }
};