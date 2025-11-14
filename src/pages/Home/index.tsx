import style from "./index.module.less";
import { App } from "antd";
import { $at } from "i18n-auto-extractor";

const Loading = lazy(() => import("./Loading"));
const BG = lazy(() => import("./BG"));
const SwitchRoles = lazy(() => import("@/components/SwitchRoles"));
const InputComponent = lazy(() => import("./Input"));

export default function Home() {
  const { message } = App.useApp();
  const avatarRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { loading, connectWebSocket, playAgain, AudioData } = useAudio(avatarRef, setIsLoading);
  const Enter = async (text: string) => {
    if (!text) return message.warning($at("请输入内容"));
    setIsLoading(true);
    connectWebSocket(text);
  };

  // const props: UploadProps = {
  //   name: "file",
  //   showUploadList: false,
  //   beforeUpload(file) {
  //     const isImage = file.type.startsWith("image/");
  //     if (!isImage) {
  //       message.warning($at("请上传图片"));
  //     }
  //     setLogo(file);
  //     return false;
  //   },
  // };
  return (
    <>
      <SwitchRoles />
      {loading && <Loading />}
      <div className={style.container}>
        <BG />
        <div
          className={style.avatar}
          ref={avatarRef}
        />
        <InputComponent
          isLoading={isLoading}
          playAgain={playAgain}
          AudioData={AudioData}
          Enter={e => Enter(e)}
        />
      </div>
    </>
  );
}
