import { App } from "antd";

interface UseRefCanvasRecorderOptions {
  autoDownload?: boolean;
  backgroundImage?: string | null; // 支持 URL 或 base64 图片
  scale?: number; // 输出清晰度倍率（1=原画，2=2K，4=4K）
}

export function useRefCanvasRecorder({ autoDownload = true, backgroundImage = null, scale = 2 }: UseRefCanvasRecorderOptions = {}) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [recording, setRecording] = useState(false);
  const [videoData, setVideoData] = useState<Blob | null>(null);
  const { uploadVideo } = useApi();
  const { message } = App.useApp();
  // 下载锁
  const downloadLock = useRef(false);

  // 🔊 Base64 PCM → 16kHz AudioBuffer
  const base64ToAudioBuffer = useCallback(async (base64: string, audioContext: AudioContext) => {
    const binary = atob(base64);
    const buffer = new ArrayBuffer(binary.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < binary.length; i++) view[i] = binary.charCodeAt(i);

    const samples = new Float32Array(binary.length / 2);
    const dv = new DataView(buffer);
    for (let i = 0; i < samples.length; i++) {
      samples[i] = dv.getInt16(i * 2, true) / 0x8000;
    }

    // 🧩 在音频头部插入 100ms 静音
    const sampleRate = 16000;
    const silentSamplesCount = Math.floor(sampleRate * 0.1);
    const paddedSamples = new Float32Array(silentSamplesCount + samples.length);
    paddedSamples.set(samples, silentSamplesCount);

    const audioBuffer = audioContext.createBuffer(1, paddedSamples.length, sampleRate);
    audioBuffer.copyToChannel(paddedSamples, 0);

    return audioBuffer;
  }, []);

  const findCanvasInRef = useCallback((ref: React.RefObject<HTMLElement | null>) => {
    if (!ref.current) return null;
    return ref.current.querySelector("canvas");
  }, []);

  const startRecording = useCallback(
    async (containerRef: React.RefObject<HTMLElement | null>, base64PCM: string) => {
      const canvas = findCanvasInRef(containerRef);
      if (!canvas) {
        console.error("No <canvas> element found inside the given ref.");
        return;
      }
      const originalStream = canvas.captureStream(60);
      let finalStream: MediaStream;

      // 🎨 处理背景图与高清输出
      const upscaleCanvas = document.createElement("canvas");
      upscaleCanvas.width = canvas.width * scale;
      upscaleCanvas.height = canvas.height * scale;
      const upscaleCtx = upscaleCanvas.getContext("2d")!;

      // 如果有背景图，加载一次
      let bgImage: HTMLImageElement | null = null;
      if (backgroundImage) {
        bgImage = new Image();
        bgImage.crossOrigin = "anonymous";
        bgImage.src = backgroundImage;

        await new Promise<void>(resolve => {
          bgImage!.onload = () => resolve();
          bgImage!.onerror = () => {
            console.warn("[useRefCanvasRecorder] 背景图片加载失败，跳过。");
            resolve();
          };
        });
      }

      // 用视频中间层承接 canvas 画面
      const video = document.createElement("video");
      video.srcObject = new MediaStream([originalStream.getVideoTracks()[0]]);
      await video.play();

      // 🎬 循环绘制高分辨率画面
      const drawLoop = () => {
        if (bgImage) upscaleCtx.drawImage(bgImage, 0, 0, upscaleCanvas.width, upscaleCanvas.height);
        upscaleCtx.drawImage(video, 0, 0, upscaleCanvas.width, upscaleCanvas.height);
        requestAnimationFrame(drawLoop);
      };
      drawLoop();

      // 🎥 从隐藏的高分辨率 canvas 捕获视频流
      finalStream = upscaleCanvas.captureStream(60);

      // ✅ 稍微等待渲染稳定
      await new Promise(r => setTimeout(r, 300));

      // 🎧 音频部分（16kHz）
      const audioContext = new AudioContext({ sampleRate: 16000 });
      const destination = audioContext.createMediaStreamDestination();
      const audioBuffer = await base64ToAudioBuffer(base64PCM, audioContext);
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(destination);

      // 🔗 合并音视频流
      const combinedStream = new MediaStream([...finalStream.getVideoTracks(), ...destination.stream.getAudioTracks()]);

      // 检查可用类型（兼容 iOS Safari）
      let mimeType;

      if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
        mimeType = "video/webm;codecs=vp9";
      } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8")) {
        mimeType = "video/webm;codecs=vp8";
      } else if (MediaRecorder.isTypeSupported("video/mp4;codecs=h264")) {
        mimeType = "video/mp4;codecs=h264";
      } else {
        mimeType = ""; // Safari 会自动选择可用格式
      }

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        // videoBitsPerSecond: 10_000_000, // iPhone 带宽有限，可适当降低
      });

      recorderRef.current = recorder;
      chunksRef.current = [];
      setRecording(true);

      recorder.ondataavailable = e => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        setVideoData(blob);

        setRecording(false);
        source.disconnect();
        audioContext.close();
      };

      // ✅ 启动录制与音频同步
      recorder.start();
      source.start();
      source.onended = () => recorder.stop();
    },
    [findCanvasInRef, base64ToAudioBuffer, autoDownload, backgroundImage, scale],
  );
  const downloadVideo = useCallback(async () => {
    if (downloadLock.current) return;

    try {
      if (videoData) {
        // 把videoData 变成url
        // const videoUrl = URL.createObjectURL(videoData);
        // const a = document.createElement("a");
        // a.href = videoUrl;
        // a.download = `video_${Date.now()}.mp4`;
        // a.click();
        // URL.revokeObjectURL(videoUrl);
        const formData = new FormData();
        formData.append("file", videoData);
        message.loading({
          content: "正在下载视频请稍后",
          key: "download",
          duration: 0,
        });
        downloadLock.current = true;

        const res = await uploadVideo(formData);
        if (res) {
          const a = document.createElement("a");
          a.href = URL.createObjectURL(new Blob([res], { type: "video/mp4" }));
          a.download = `video_${Date.now()}.mp4`;
          a.click();
          URL.revokeObjectURL(a.href);
          message.destroy("download");
        }
      }
    } catch (error) {
      throw error;
    } finally {
      downloadLock.current = false;
    }
  }, [videoData, recorderRef]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recording) {
      recorderRef.current.stop();
    }
  }, [recording]);

  return {
    startRecording,
    stopRecording,
    downloadVideo,
  };
}
