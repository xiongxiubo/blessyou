// @ts-ignore 忽略找不到模块声明文件的错误
import { TalkingHead } from "./blessyouhead.mjs";
import type { RefObject } from "react";
import { eq } from "lodash";
import { App } from "antd";

export default function useAudio(avatarRef: RefObject<HTMLDivElement | null>, setIsLoading: (loading: boolean) => void) {
  const [head, setHead] = useState<TalkingHead | null>(null);
  const [loading, setLoading] = useState(false);
  const { currentLang } = useLang();
  const { message } = App.useApp();
  const [AudioData, setAudioData] = useState<any>();
  const [Recording, setRecording] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const { role } = useRole();

  const initTalkingHead = async () => {
    setLoading(true);
    clearContainer(avatarRef);
    const post = poseTemplates(role.name);
    const head = new TalkingHead(avatarRef.current, {
      ttsEndpoint: "https://eu-texttospeech.googleapis.com/v1beta1/text:synthesize",
      lipsyncModules: ["en"],
      cameraView: "full",
      poseTemplates: post,
    });
    await head?.showAvatar(
      {
        url: role.modelurl,
        body: "M",
        avatarMood: "neutral",
        lipsyncLang: "en",
        enableStrongLight: role.enableStrongLight,
      },
      (e: any) => {
        if (e.loaded === e.total) {
          setTimeout(() => {
            setLoading(false);
          }, 1000);
        }
      },
    );
    head?.setVehicle(role.vehicleurl, role.vehiclepos, role.vehiclerot);
    setHead(head);
  };
  // 链接websocket
  const connectWebSocket = (data: string) => {
    const token = localStorage.getItem("token") || "";
    wsRef.current = new WebSocket(import.meta.env.VITE_WS_BASE + "?token=" + token);
    wsRef.current.onopen = () => {
      setIsLoading(true);
      wsRef.current?.send(
        JSON.stringify({
          lang: currentLang,
          type: role.name,
          data,
        }),
      );
    };
    wsRef.current.onmessage = event => {
      try {
        const res = JSON.parse(event.data);
        console.log(res);
        if (eq(res.code, 0) || eq(res.code, 1)) {
          if (eq(res.code, 0)) {
            head?.playAnimation(getRandomDanceAnimation());
          }
          handleMessage(res.data);
          setAudioData(res);
          wsRef.current?.close();
        } else {
          message.error(res.msg);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("解析服务器消息错误:", error);
      }
    };
    wsRef.current.onerror = error => {
      console.error("WebSocket 错误:", error);
    };
    wsRef.current.onclose = () => {
      console.log("WebSocket 连接关闭");
    };
  };
  function clearContainer(ref: RefObject<HTMLDivElement | null>) {
    if (!ref.current) return;
    if (!head) return;
    head?.renderer.dispose();
    // 清理 three.js 渲染器
    const canvas = ref.current.querySelector("canvas");
    if (canvas && canvas.getContext) {
      const gl = canvas.getContext("webgl") || canvas.getContext("webgl2");
      if (gl) {
        const loseCtx = gl.getExtension("WEBGL_lose_context");
        loseCtx && loseCtx.loseContext();
      }
    }
    // 移除所有子节点
    while (ref.current.firstChild) {
      ref.current.removeChild(ref.current.firstChild);
    }
  }
  useLayoutEffect(() => {
    if (head && !avatarRef.current) return;
    initTalkingHead();
  }, [avatarRef, role]);
  // 处理消息
  const handleMessage = (message: any) => {
    let words = message.Words || [];
    let audio = {
      audio: base64ToArrayBuffer(message.Audio),
      words: [] as string[],
      wtimes: [] as number[],
      wdurations: [] as number[],
    };
    words.forEach((x: any) => {
      audio.words.push(x.word);
      audio.wtimes.push(x.start_time);
      audio.wdurations.push(x.end_time - x.start_time);
    });
    playAudio(audio);
  };
  const playAudio = useCallback(
    async (audio: any) => {
      await head?.streamStart(
        { sampleRate: 16000, lipsyncType: "words", gain: 3, lipsyncLang: "en" },
        () => {
          console.log("开始播放");
          setRecording(true);
        },
        () => {
          console.log("播放完成");
          setRecording(false);
          setIsLoading(false);
        },
      );
      head?.streamAudio(audio);
    },
    [head],
  );
  // 重播
  const playAgain = async () => {
    if (AudioData && !Recording) {
      if (AudioData.code === 0) {
        // await startRecording(avatarRef, AudioData.data.Audio);
        head?.playAnimation(getRandomDanceAnimation());
      }
      handleMessage(AudioData.data);
    }
  };
  // 设置logo
  const setLogo = (logo: Blob) => {
    head?.setLogo(logo);
  };
  return { loading, connectWebSocket, playAgain, AudioData, setLogo };
}
// 将Base64编码的音频数据转换为ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64); // 解码 Base64 成 binary 字符串
  const len = binaryString.length;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i); // 转成字节
  }

  return bytes.buffer; // 返回 ArrayBuffer
}
