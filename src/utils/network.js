/**
 * 网络相关工具函数
 */

export async function remoteSocketToWS(clientWS, remoteSocket, log) {
  // 从原代码中提取remoteSocketToWS函数的逻辑
  const writer = remoteSocket.writable.getWriter();
  const reader = remoteSocket.readable.getReader();
  
  // 数据转发逻辑
  clientWS.onmessage = async (event) => {
    try {
      // 处理接收到的消息并发送到远程Socket
      // ...从原代码中提取数据处理逻辑
      await writer.write(event.data);
    } catch (e) {
      console.error('Error writing to remote socket:', e);
    }
  };
  
  // 从远程Socket读取数据并发送到WebSocket
  const readLoop = async () => {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        clientWS.send(value);
      }
    } catch (e) {
      console.error('Error reading from remote socket:', e);
    } finally {
      clientWS.close();
    }
  };
  
  readLoop();
}

// 其他网络相关工具函数
// ...从原代码中提取其他网络相关函数