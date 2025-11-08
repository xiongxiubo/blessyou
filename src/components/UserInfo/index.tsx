import { Avatar, Dropdown } from "antd";
import style from "./index.module.less";
import { useDisconnect } from "@reown/appkit/react";
import { App } from "antd";
import { $at } from "i18n-auto-extractor";

export default function UserInfo() {
  const { message } = App.useApp();
  const { user, setUser, setToken } = useUserStore();
  const { disconnect } = useDisconnect();
  const logout = async () => {
    try {
      await disconnect();
      setUser({});
      setToken("");
      localStorage.removeItem("token");
      message.success($at("退出登录成功"));
    } catch (error) {
      console.error(error);
    }
  };
  const items = [
    {
      label: <div onClick={logout}>{$at("退出登录")}</div>,
      key: "disconnect",
    },
  ];

  return (
    <div>
      <Dropdown
        trigger={["click"]}
        menu={{ items }}>
        <div className={style.footUser}>
          <Avatar
            size={24}
            src={generateAvatar(user.Address)}
          />
          <span>{ellipsis(user.Address)}</span>
        </div>
      </Dropdown>
    </div>
  );
}
