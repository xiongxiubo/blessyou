import style from "./index.module.less";
import { useAppKit, useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { BrowserProvider } from "ethers";
import { $at } from "i18n-auto-extractor";
import { eq } from "lodash";
import { App } from "antd";

export default function AppKitButton() {
  const { message } = App.useApp();
  const router = useNavigate();
  const { open } = useAppKit();
  const Account = useAppKitAccount();
  const { setToken } = useUserStore();
  const Provider = useAppKitProvider("eip155");
  const [signature, setSignature] = useState("");
  const [msg, setMsg] = useState("");
  const { loginWeb3 } = useApi();
  const openAppKit = () => {
    open({ view: "Connect", namespace: "eip155" });
  };

  //签名消息
  const signMessage = useCallback(async () => {
    if (!Account.isConnected) {
      message.warning($at("未连接钱包"));
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const provider = new BrowserProvider(Provider.walletProvider as any);
    const signer = await provider.getSigner();

    const msg = `Bless You`;
    const signa = await signer.signMessage(msg);
    setSignature(signa);
    setMsg(msg);
  }, [Account.isConnected, Provider]);
  //登录web3
  const web3login = useCallback(async () => {
    if (!Account.isConnected) return;
    if (!signature || !msg || !Account.address) return;
    const res = await loginWeb3({ signature: signature, msg: msg, address: Account.address });
    if (eq(res?.code, 0)) {
      message.success($at("登录成功"));
      setToken(res.data);
      localStorage.setItem("token", res.data);
    } else {
      message.error(res.msg);
    }
  }, [Account.isConnected, signature, msg, Account.address, router, setToken]);
  //连接钱包
  const connect = useCallback(async () => {
    await signMessage();
    await web3login();
  }, [signMessage, web3login]);

  useEffect(() => {
    if (Account.isConnected) {
      connect();
    }
  }, [Account.isConnected, connect]);
  return (
    <button
      className={style.btn}
      onClick={openAppKit}>
      Connect Wallet
    </button>
  );
}
