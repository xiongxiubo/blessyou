import { $at } from "i18n-auto-extractor";
import style from "./index.module.less";
export default function Loading() {
  const text = `...`;

  return (
    <div className={style.loading}>
      <div className={style.loadingContent}>
        <div className={style.loadingText}>
          {text.split("").map((item, index) => (
            <span
              key={index}
              style={{ animationDelay: `${index * 0.2}s` }}>
              {item}
            </span>
          ))}
        </div>
      </div>
      <span className={style.Text}>{$at("加载中")}</span>
    </div>
  );
}
