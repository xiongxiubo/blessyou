import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/zh-cn";
import "dayjs/locale/en";
import "dayjs/locale/ja";

dayjs.extend(relativeTime);
export function formatTime(time: string) {
  return dayjs(time).format("YYYY-MM-DD HH:mm:ss");
}

export function timeFromNow(time: string, locale: string = "zh-cn") {
  return dayjs(time).locale(locale).fromNow();
}
