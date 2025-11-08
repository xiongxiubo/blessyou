import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

export async function convertWebMToMP4(webmBlob: Blob): Promise<Blob> {
  const ffmpeg = new FFmpeg();
  await ffmpeg.load();

  const data = await fetchFile(webmBlob);
  await ffmpeg.writeFile("input.webm", data);

  await ffmpeg.exec(["-i", "input.webm", "-c:v", "libx264", "-c:a", "aac", "-b:v", "2M", "-b:a", "192k", "-movflags", "faststart", "output.mp4"]);

  const mp4Data = await ffmpeg.readFile("output.mp4");

  // ✅ 兼容类型安全
  if (mp4Data instanceof Uint8Array) {
    const arrayBuffer = mp4Data.buffer.slice(0); // 复制 ArrayBuffer 内容
    return new Blob([arrayBuffer as ArrayBuffer], { type: "video/mp4" });
  } else {
    const textEncoder = new TextEncoder();
    return new Blob([textEncoder.encode(mp4Data)], { type: "video/mp4" });
  }
}
