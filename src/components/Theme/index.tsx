import { MoonFilled, SunFilled } from "@ant-design/icons";
import style from "./index.module.less";

export default function Theme() {
  const { dark, setDark } = useConfigStore();
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [dark]);
  return (
    <div className={style.darkWrap}>
      {dark ? (
        <div
          className={style.darkItemD}
          onClick={() => setDark(false)}>
          <MoonFilled style={{ color: "#fff" }} />
        </div>
      ) : (
        <div
          className={style.darkItemS}
          onClick={() => setDark(true)}>
          <SunFilled />
        </div>
      )}
    </div>
  );
}
