// import ScreenRecorder from "@/components/ScreenRecorder";
import { $at } from "i18n-auto-extractor";
import style from "./index.module.less";
import { App, Button, Input, Space, Tooltip } from "antd";
import { PlayCircleOutlined } from "@ant-design/icons";

const Loading = lazy(() => import("./Loading"));
const BG = lazy(() => import("./BG"));

export default function Home() {
  const { message } = App.useApp();
  const avatarRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { loading, sendText, playAgain, AudioData } = useAudio(avatarRef, setIsLoading);

  const Enter = async () => {
    if (!text) return message.warning($at("请输入内容"));
    setIsLoading(true);
    await sendText(text);
  };
  return (
    <>
      {loading && <Loading />}
      <div className={style.container}>
        <BG />
        <div
          className={style.avatar}
          ref={avatarRef}
        />
        <div className={style.tail}>
          {AudioData && (
            <Space>
              {/* <Tooltip title="下载视频">
                <DownloadOutlined
                  className={style.icon}
                  onClick={downloadVideo}
                />
              </Tooltip> */}
              <Tooltip title="重新播放">
                <PlayCircleOutlined
                  disabled={isLoading}
                  className={style.icon}
                  onClick={playAgain}
                />
              </Tooltip>
            </Space>
          )}
          <Input
            value={text}
            className={style.input}
            placeholder={$at("请输入名字")}
            onChange={e => setText(e.target.value)}
            maxLength={20}
          />
          <Button
            loading={isLoading}
            className={style.button}
            onClick={Enter}>
            {isLoading ? $at("生成中") : $at("一键生成")}
          </Button>
        </div>
      </div>
    </>
  );
}
