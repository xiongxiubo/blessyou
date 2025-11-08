export type LoginParams = {
  email: string;
  password: string;
};
// 注册参数
export type RegisterParams = {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
};
type Response = {
  code: number;
  msg: string;
  data: any;
};
type web3LoginParams = {
  signature: string;
  msg: string;
  address: string;
};
export function useApi() {
  const { request } = useRequest();
  // 登录web3
  const loginWeb3: (data: web3LoginParams) => Promise<Response> = useCallback((data: web3LoginParams) => request.post("/user/web3/login", data), [request]);
  // 获取用户信息
  const getUserInfo: () => Promise<Response> = useCallback(() => request.get("/user/info"), [request]);
  // 创建tts音频
  const createTtsAudio: (data: { text: string }) => Promise<Response> = useCallback((data: { text: string }) => request.post("/tts/create", data), [request]);
  // 获取广告背景墙
  const getAdBg: () => Promise<Response> = useCallback(() => request.get("/background/list"), [request]);
  // 下载视频 /先将webm 上传到服务器，服务器返回mp4视频

  const uploadVideo: (data: FormData) => Promise<any> = useCallback(
    (data: FormData) =>
      request.post("/file/upload", data, {
        responseType: "blob",
      }),
    [request],
  );
  return {
    getAdBg,
    loginWeb3,
    getUserInfo,
    createTtsAudio,
    uploadVideo,
  };
}
