import { SwapOutlined } from "@ant-design/icons";
import styles from "./index.module.less";
import { Divider, FloatButton, Image, Modal } from "antd";
import type { Role } from "@/store/role";
import { $at } from "i18n-auto-extractor";

export default function SwitchRoles() {
  const [visible, setVisible] = useState(false);
  const { roles, setRole: setRoleStore } = useRole();
  const setRole = (item: Role) => {
    setRoleStore(item);
    document.documentElement.className = item.theme;
    setVisible(false);
  };
  return (
    <>
      <FloatButton
        icon={<SwapOutlined />}
        onClick={() => setVisible(true)}
        tooltip={$at("人物切换")}
        className={styles["switch-roles"]}
      />
      <Modal
        open={visible}
        onCancel={() => setVisible(false)}
        footer={null}
        width={960}>
        <div className={styles["switch-roles-model"]}>
          <div className={styles["switch-roles-model-item"]}>
            <Divider
              className={styles["switch-roles-model-item-divider"]}
              orientation="left"
              orientationMargin="0">
              {$at("角色列表")}
            </Divider>
            <div className={styles["switch-roles-model-item-content"]}>
              {roles.map((item, index) => (
                <div
                  key={index}
                  className={styles["switch-roles-model-item-content-item"]}
                  onClick={() => setRole(item)}>
                  <Image
                    className={styles["switch-roles-model-item-content-item-img"]}
                    preview={false}
                    style={{ borderRadius: 10, objectFit: "cover", cursor: "pointer" }}
                    src={item.img}
                  />
                  <div className={styles["switch-roles-model-item-text"]}>{item.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
