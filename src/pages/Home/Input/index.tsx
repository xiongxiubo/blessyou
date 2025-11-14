import style from "./index.module.less";
import { $at } from "i18n-auto-extractor";
import { Button, Input, App, Modal, Tooltip } from "antd";
import { PlayCircleOutlined, SnippetsFilled } from "@ant-design/icons";

interface InputComponentProps {
  isLoading: boolean;
  playAgain: () => Promise<void>;
  AudioData: string | null;
  Enter: (text: string) => void;
}

export default function InputComponent({ isLoading, playAgain, AudioData, Enter }: InputComponentProps) {
  const { message } = App.useApp();
  const [visible, setVisible] = useState(false);
  const { displayTemplate, getTemplate, reName, setDisplayTemplate } = useTemplate();
  const [text, setText] = useState("");
  const [modalText, setModalText] = useState("");
  return (
    <>
      <div className={style.tail}>
        <Input
          value={text}
          className={style.input}
          placeholder={$at("请输入祝福文案")}
          onChange={e => setText(e.target.value)}
        />
        <div className={style.space}>
          <Tooltip title={$at("使用模板生成")}>
            <SnippetsFilled
              className={style.icon}
              onClick={() => {
                setVisible(true);
                getTemplate();
              }}
            />
          </Tooltip>
          {AudioData && (
            <Tooltip title={$at("重新播放")}>
              <PlayCircleOutlined
                disabled={isLoading}
                className={style.icon}
                onClick={playAgain}
              />
            </Tooltip>
          )}

          <Button
            loading={isLoading}
            className={style.button}
            onClick={() => Enter(text)}>
            {isLoading ? $at("生成中") : $at("一键生成")}
          </Button>
        </div>
      </div>
      <Modal
        maskClosable={false}
        destroyOnHidden={true}
        title={$at("使用模板生成")}
        open={visible}
        onCancel={() => {
          setVisible(false);
          setDisplayTemplate("");
        }}
        onOk={() => {
          if (!modalText) return message.warning($at("请输入名字"));
          setVisible(false);
          Enter(displayTemplate);
          setDisplayTemplate("");
        }}
        okText={$at("生成")}
        cancelText={$at("取消")}>
        <Input
          className={style.input}
          value={modalText}
          placeholder={$at("请输入名字")}
          onChange={e => {
            setModalText(e.target.value);
            reName(e.target.value);
          }}
        />
        <p className={style.template}>{displayTemplate}</p>
      </Modal>
    </>
  );
}
