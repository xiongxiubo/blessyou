// @ts-ignore 忽略找不到模块声明文件的错误
import { TalkingHead } from "./blessyouhead.mjs";
import type { RefObject } from "react";
// import bgpng from "@/assets/bg.png";
// import bg2png from "@/assets/bg2.png";

import { eq } from "lodash";
import { App } from "antd";

export default function useAudio(avatarRef: RefObject<HTMLDivElement | null>, setIsLoading: (loading: boolean) => void) {
  const [head, setHead] = useState<TalkingHead | null>(null);
  const [loading, setLoading] = useState(true);
  const { message } = App.useApp();
  const { createTtsAudio } = useApi();
  const [AudioData, setAudioData] = useState<any>();
  const [Recording, setRecording] = useState(false);
  // const { isMobile } = useDevice();
  // const backgroundImage = useMemo(() => (isMobile ? bg2png : bgpng), [isMobile]);
  // const { startRecording, downloadVideo } = useRefCanvasRecorder({ backgroundImage });
  const initTalkingHead = async () => {
    await head?.showAvatar(
      {
        url: "/model/cz.glb",
        body: "M",
        avatarMood: "neutral",
        lipsyncLang: "en",
      },
      (e: any) => {
        if (e.loaded === e.total) {
          setTimeout(() => {
            setLoading(false);
          }, 1000);
        }
      },
    );
    // head?.playAnimation("/model/a.fbx");
  };

  useLayoutEffect(() => {
    if (head && !avatarRef.current) return;
    const newHead = new TalkingHead(avatarRef.current, {
      ttsEndpoint: "https://eu-texttospeech.googleapis.com/v1beta1/text:synthesize",
      lipsyncModules: ["en"],
      cameraView: "full",
    });
    setHead(newHead);
  }, [avatarRef]);
  useEffect(() => {
    (async () => {
      if (!head) return;
      await initTalkingHead();
    })();
  }, [head]);

  const sendText = async (text: string) => {
    try {
      const res = await createTtsAudio({ text });

      if (eq(res.code, 0) || eq(res.code, 1)) {
        // await startRecording(avatarRef, res.data.Audio);
        if (eq(res.code, 0)) {
          head?.playAnimation(getRandomDanceAnimation());
        }
        handleMessage(res.data);
        setAudioData(res);
      } else {
        message.error(res.msg);
        setIsLoading(false);
      }
    } catch (error) {
      setIsLoading(false);
      console.error(error);
    }
  };
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
        () => setRecording(true),
        () => {
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
  return { loading, sendText, playAgain, AudioData };
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
