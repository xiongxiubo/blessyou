import blockies from "ethereum-blockies";
// 一串长字符串，获取前四位后四位，中间用...代替
export function ellipsis(str: string) {
  if (!str) {
    return "";
  }
  if (str.length <= 8) {
    return str;
  }
  return str.slice(0, 6) + "..." + str.slice(-4);
}

export function generateAvatar(hash: string): string {
  const icon = blockies.create({
    seed: hash, // 你的哈希/字符串
    size: 8, // 图案的格子大小
    scale: 16, // 每个格子的像素数
  });
  return icon.toDataURL(); // base64 图片地址，可直接绑定到 <img src="..." />
}

// 获取/dance文件夹 下的所有fbx文件，随机获取一个文件路径进行return
export function getRandomDanceAnimation() {
  // 1-56随机数
  const randomNum = Math.floor(Math.random() * 18) + 1;
  return `/dance/${randomNum}.fbx`;
}
