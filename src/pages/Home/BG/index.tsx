import style from "./index.module.less";
import { useBGAD } from "./useBGAD";
export default function BG() {
  const { currentLogos, itemClassName, currentChunkIndex } = useBGAD();
  const { isMobile } = useDevice();

  const tab = [0, 1, 2];
  return (
    <div className={style.binance}>
      {isMobile && (
        <div className={style.tabContainer}>
          {tab.map(item => (
            <div
              className={style.tab + (item === currentChunkIndex ? ` ${style.active}` : "")}
              key={`tab-${item}`}
            />
          ))}
        </div>
      )}
      {currentLogos.map((item, index) => (
        <div
          className={itemClassName(item)}
          key={`item-${index}`}>
          {item.map((e, i) => (
            <div
              className={style.item}
              key={`item-${index}-${i}`}>
              <img src={e.Image} />
              <span>{e.Name}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
