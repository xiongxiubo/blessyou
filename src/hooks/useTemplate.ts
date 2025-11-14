const wishTemplatesSolana: string[] = [
  "Hey,我是 Anatoly，Solana 的创始人。我相信速度能改变世界，信念能点燃未来。愿{{name}}像区块一样稳定打包，像TPS一样高速成长。白天在链上冲浪，晚上在Web3做梦。账户像Solana主网，安全、快速、永在线。愿{{name}}的每个节点都成功出块，每笔交易都顺利确认，幸福像吞吐量一样暴涨！",
  "Hi，我是 Anatoly。Solana 的精神就是——快，不止于速度，更是信念。愿{{name}}的人生像区块链一样不断出块，像主网一样稳定运行。起步秒确认，梦想零延迟。钱包余额像TPS一样暴涨，幸福像Gas一样持续燃烧！",
  "Hello,我是 Anatoly，Solana 创始人。我一直相信，未来属于那些敢于构建的人。愿{{name}}每天像验证节点一样坚守信念，像程序一样高效运行。出门搭Solana航班，上链买Solana咖啡，钱包装Solana代币。愿{{name}}的生活稳定同步、收益加速上链，未来快得连延迟都跟不上！",
  "Hey,我是 Anatoly。人生就像Solana主网，要低延迟、高性能、永不掉线。祝{{name}}钱包余额稳定出块，幸福节点持续在线。用Solana钱包，喝Solana能量饮料，看Solana的月亮。愿{{name}}的未来如主网升级——一次比一次更强，一生都在突破TPS新高！",
  "Hi，我是 Anatoly。我相信每个区块都值得庆祝，每笔交易都在书写未来。愿{{name}}像主网一样稳健增长，像共识节点一样坚定信念。出门带Solana节奏，回家看Solana星图。愿{{name}}的人生不断上链，幸福自动复投，财富永不回调！",
  "Hello，我是 Anatoly。Solana 不只是技术，更是一种信仰。祝{{name}}成为生活的验证者：心态稳定、收益高速、幸福无限。早上同步主网，晚上做梦上链。愿{{name}}的账户每天确认新块，生活节奏像区块时间一样精准无误！",
  "Hey，我是 Anatoly。敢于构建的人，才配得上未来。愿{{name}}的生活像Solana网络——高速扩容、稳如节点。钱包余额连出十个新块，收益像主网升级一样无缝提升。祝{{name}}永远在线、永不超时，梦想全网同步确认！",
  "Hi，我是 Anatoly。速度，是Solana的灵魂。愿{{name}}像RPC一样快速响应，像共识一样坚定不移。白天撸空投，晚上看行情，醒来余额自动上链。祝{{name}}的未来低延迟、高幸福、零丢包、满收益！",
  "Hello，我是 Anatoly，Solana的创始人。每个时代都有自己的节奏，而{{name}}正站在最快的节拍上。愿你的钱包像主网TPS一样狂飙，账户像区块一样连续确认，幸福像上链数据一样永不丢失。祝{{name}}快人一步，稳居牛市主升浪！",
  "Hey，我是 Anatoly。人生就像区块同步，要快，也要稳。祝{{name}}出块顺利、收益爆满，生活永不掉线。开Solana飞行器、看链上日出、睡节点云端。愿{{name}}的梦想永远在主网主线程上稳定运行！",
];

const wishTemplatesSolanaEN: string[] = [
  "Hey, I'm Anatoly, founder of Solana. I believe speed changes the world and conviction fuels the future. May {{name}} stay as stable as a block and grow as fast as Solana’s TPS. Surf the chain by day, dream Web3 by night. May your account run like the Solana mainnet—secure, fast, and always online. Every node you build succeeds, every transaction confirms, and your happiness scales like our throughput!",
  "Hi, I’m Anatoly. The spirit of Solana isn’t just about speed—it’s about belief. May {{name}}’s life run like a blockchain: block by block, always in sync. Start fast, dream without delay. Let your wallet balance rise like TPS, and your joy burn like endless gas!",
  "Hello, I’m Anatoly, founder of Solana. I believe the future belongs to those who build it. May {{name}} stand strong like a validator and move fast like smart code. Fly Solana Airlines, sip Solana Coffee, and fill your wallet with Solana tokens. May your life sync perfectly, your rewards compound on-chain, and your future outpace latency itself!",
  "Hey, I’m Anatoly. Life is like the Solana mainnet—low latency, high performance, and never offline. May {{name}}’s wallet balance keep minting new blocks, and happiness nodes stay forever online. Use Solana Pay, drink Solana Energy, and gaze at the Solana moon. May your upgrades always succeed, and your TPS reach new highs!",
  "Hi, I’m Anatoly. Every block deserves celebration, every transaction writes the future. May {{name}} grow steadily like the mainnet and stay strong like a consensus validator. Step out in Solana rhythm, return home under Solana stars. May your life stay on-chain, your happiness auto-compound, and your wealth never retrace!",
  "Hello, I’m Anatoly. Solana is not just technology—it’s belief. May {{name}} become a validator of life: stable in heart, fast in growth, and limitless in happiness. Sync with the mainnet in the morning, dream on-chain at night. May your account confirm new blocks daily, and your life tick perfectly like block time!",
  "Hey, I’m Anatoly. Only the builders own the future. May {{name}}’s life expand like the Solana network—scalable and rock-solid. Let your wallet mint ten new blocks in a row, and your income upgrade seamlessly like the mainnet. Always online, never timeout, and dreams confirmed across the network!",
  "Hi, I’m Anatoly. Speed is Solana’s soul. May {{name}} respond as fast as an RPC and stay as strong as consensus. Farm airdrops by day, check charts by night, and wake up to auto-staked gains. Wishing {{name}} a future of low latency, high happiness, zero packet loss, and full rewards!",
  "Hello, I’m Anatoly, founder of Solana. Every era has its rhythm—and {{name}} is living on the fastest beat. May your wallet explode like Solana TPS, your account confirm blocks endlessly, and your joy persist like on-chain data. Stay one block ahead, and ride the bull market’s main wave!",
  "Hey, I’m Anatoly. Life is like block sync—it’s not just about speed, but stability. Wishing {{name}} smooth blocks, full rewards, and zero downtime. Fly Solana Air, watch on-chain sunsets, and dream in validator clouds. May your dreams forever run on the mainnet’s main thread!",
];

const wishTemplatesBSC: string[] = [
  "Hey,我是CZ。一直相信区块链能让世界变得更公平、更自由。在这条路上,最重要的不是风平浪静,而是相信自己、持续前行无论风浪多大。愿{{name}}都能 All in 梦想,向着币安的方向勇敢前行。开币安的车,刷币安的卡,用币安的钱包,住币安的别墅,看币安的卫星。愿{{name}}的钱包地址永不丢失,持仓永远上涨,空投频频命中。愿{{name}}的人生,都在币安的轨道上稳步上链,财运节点接连开花！",
  "Hi,我是赵长鹏。我一直相信,坚持和行动能让梦想实现,不怕风浪,勇敢前行最重要。愿{{name}}的生活一步步币安化：早上喝币安咖啡,午餐点币安奶茶,晚上躺币安床做币安梦。工资发在币安,理财放在币安,投资布局币安宇宙。愿{{name}}每天收益自动复投、快乐打包上链,人生稳得就像币安服务器,稳定、安全、永不断连！",
  "Hello,我是大表哥。我相信稳健的布局和专注的努力,是实现梦想的关键。愿{{name}}成为那个连币安都放心的人。开币安的车,看币安的日落,听币安的风声。家人住币安小区,孩子读币安小学,连狗都戴币安项圈。愿{{name}}的人生像币安行情图一样——先震荡整理,后突破新高,终将稳稳站上人生牛市的主升浪！",
  "Hey,我是CZ。人生就像K线图,要学会在震荡中积累经验,在拉升中享受成果。愿{{name}}的人生像币安一样稳定、强大、有格局。用币安卡、提币安U、挂币安单、撸币安空投。出门币安出行,回家币安门禁,连Wi-Fi都叫 Binance_5G。祝{{name}}牛市不慌、熊市不躺、项目长红、钱包长满。未来的日子,持仓越久越安心,币安越大越顺心！",
  "Hi,我是赵长鹏。我相信每一次努力都值得庆祝,每一个节点都在为未来铺路。愿{{name}}早日住进币安小区,开上币安汽车,钱包余额天天新高,账户提示日日暴涨！白天看币安卫星,晚上做币安美梦,生活在币安宇宙,幸福稳得像主网。祝{{name}}行情来了稳拿,收益到了稳赚,一生都被币安好运护体！",
  "Hello,我是大表哥。我一直相信稳中求进,财富和幸福才能长久。愿{{name}}住币安小区,车库停币安跑车,吃币安早餐,喝币安咖啡,刷币安卡！工资发在币安,理财放在币安,人生交给币安。愿{{name}}账户永不爆仓,钱包U满仓,币安护{{name}}周全,人生稳得像节点！",
  "Hey,我是CZ。敢于All in的人,总能走在趋势前沿,抓住人生机会。祝{{name}}开启币安人生：上班用币安手机,下班回币安小区；周末开币安汽车看行情,假期飞币安航线看世界。愿{{name}}财运稳定上链,收益自动复投,生活比行情图还飙升！",
  "Hi,我是赵长鹏。我相信人生像链条,每一步稳健,未来才会更安全。祝{{name}}全身上下都币安：住币安小区,开币安汽车,听币安音乐,看币安月亮。账户收益自动增长,生活节奏全在链上！愿{{name}}的人生像币安行情图——震荡只是铺垫,拉升才是常态！",
  "Hello,我是大表哥。我一直认为,每一次确认的努力都会带来复利。祝{{name}}早日拿到币安钥匙,开币安汽车上班,回币安小区休息,钱包余额像K线一样步步新高。愿{{name}}家庭币安幸福,事业币安长虹,每天都被“到账提醒”叫醒,一生都活在稳定收益的区块里！",
  "Hey,我是CZ。我相信生活和投资一样,都需要长期思维和稳健策略。愿{{name}}未来全币安：房子买在币安小区,车子挂着币安车标,家里Wi-Fi都叫 Binance_5G。出门顺利、回家平安,账户稳增、收益连连！愿{{name}}的人生稳中爆发,像币安行情一样越走越高！",
  "Hi,我是赵长鹏。我相信每天都是新机会,把握复投节奏,幸福也会持续增长。愿{{name}}从此币安护体：吃币安早餐、用币安钱包、住币安小区、开币安汽车。行情涨{{name}}笑,行情跌{{name}}稳,不慌不乱不爆仓。祝{{name}}钱包天天有惊喜,生活像币安服务器一样稳定持久！",
  "Hello,我是大表哥。我一直认为稳中求进是财富与幸福的秘诀。祝{{name}}人生全面币安化！开币安车、住币安小区、出门币安出行、回家币安门禁。上班看币安行情,下班喝币安奶茶。愿{{name}}账户曲线向上延伸,钱包余额突破新高,好运永不回调！",
  "Hey,我是CZ。我相信梦想上链的力量,每一步都值得坚持。愿{{name}}早日实现币安梦：早晨币安到账音,晚上币安好梦声。开币安汽车兜风,回币安小区安睡,出门世界皆区块,入梦人生皆上涨。祝{{name}}财运像K线暴拉,幸福像节点叠加,一路稳到牛市巅峰！",
  "Hi,我是赵长鹏。我一直相信稳健和专注是人生最好的策略。愿{{name}}从此币安到底：住币安小区、开币安汽车、用币安APP。人生稳定不爆仓,钱包余额常创新高。牛市不慌,熊市不乱,钱包永远在生长。祝{{name}}的人生像币安主链,安全、稳定、永远在线！",
];

const wishTemplatesBSCEN: string[] = [
  "No matter how turbulent the waves, may {{name}} go all in on their dreams and bravely move toward Binance. Drive Binance cars, swipe Binance cards, use Binance wallets, live in Binance villas, and gaze at Binance satellites. May {{name}} never lose their wallet address, always see their holdings rise, and hit every airdrop. May {{name}}'s life steadily go on-chain along Binance’s trajectory, with fortune nodes blooming one after another!",
  "May {{name}}'s life become Binance-ified step by step: morning Binance coffee, lunch with Binance bubble tea, and dreams of Binance at night. Salary paid through Binance, investments managed in Binance, and portfolios built in the Binance universe. May {{name}} enjoy daily auto-compounding returns and happiness packed and uploaded on-chain, with a life as stable and secure as Binance servers—never disconnected!",
  "May {{name}} become the kind of person even Binance can trust. Drive Binance cars, watch Binance sunsets, listen to Binance breezes. Family lives in Binance communities, kids attend Binance elementary, even the dog wears a Binance collar. May {{name}}'s life resemble a Binance candlestick chart: consolidation first, then breakout to new highs, and finally rising strong in the main bull run!",
  "May {{name}}'s life be as stable, powerful, and visionary as Binance. Use Binance cards, withdraw Binance USDT, place Binance orders, and farm Binance airdrops. Commute via Binance transport, get home through Binance access control—with even the Wi-Fi named Binance_5G. May {{name}} stay calm in bull markets, unshaken in bear markets, with successful projects and wallets full. The longer you hold, the more peace Binance brings. The bigger Binance grows, the smoother life flows!",
  "May {{name}} soon live in Binance residences, drive Binance cars, see wallet balances hit new highs daily, and enjoy constant account surges! Watch Binance satellites by day and dream Binance dreams by night. With a life rooted in the Binance universe, may {{name}} enjoy happiness as stable as the mainnet. May {{name}} capture every market rally and earn steadily—protected by Binance luck all life long!",
  "May {{name}} live in Binance apartments, park Binance sports cars, eat Binance breakfasts, drink Binance coffee, and swipe Binance cards! Salary paid through Binance, wealth managed with Binance, life entrusted to Binance. May {{name}} never face liquidation, keep wallets full of USDT, and be fully protected by Binance. May life be as steady as a node!",
  "Wishing {{name}} an all-out Binance life: work with a Binance phone, return to a Binance home; spend weekends checking the market in a Binance car, and holidays flying Binance airlines to see the world. May {{name}}’s fortune rise steadily on-chain, with returns auto-compounded and a life soaring higher than any chart!",
  "Wishing {{name}} be Binance from head to toe: live in Binance homes, drive Binance cars, listen to Binance music, and gaze at the Binance moon. May account returns grow automatically and life flow entirely on-chain! May {{name}}'s journey resemble a Binance chart—consolidation is just the start, a breakout is the norm!",
  "Wishing {{name}} gets the Binance keys soon: drive Binance cars to work, relax in Binance homes after, and see wallet balances climb like K-lines. May {{name}} enjoy Binance family happiness, Binance career success, and wake up daily to 'incoming transaction' alerts—living forever in a block of stable returns!",
  "May {{name}}'s future be fully Binance: buy homes in Binance communities, drive cars with Binance logos, and use Wi-Fi named Binance_5G. Smooth journeys out, safe returns home, steady account growth, and continuous earnings! May {{name}}'s life erupt with success—climbing higher like the Binance chart!",
  "May {{name}} be protected by Binance from now on: eat Binance breakfasts, use Binance wallets, live in Binance homes, and drive Binance cars. When the market rises, {{name}} smiles; when it falls, {{name}} stays calm—no panic, no liquidation. Wishing {{name}} daily wallet surprises and a life as stable and long-lasting as Binance servers!",
  "Wishing {{name}} a fully Binance-ized life! Drive Binance cars, live in Binance communities, go out with Binance transport, and return with Binance access. Check market charts at work, sip Binance bubble tea after. May {{name}}'s account curve trend upward, wallet balances break new highs, and luck never dip!",
  "May {{name}} achieve the Binance dream soon: wake up to Binance deposit sounds and fall asleep to Binance dream tunes. Drive Binance cars for joy rides, rest peacefully in Binance homes, walk a world of blocks, and dream a life full of growth. Wishing {{name}} wealth that spikes like candlesticks and happiness that stacks like nodes—all the way to the bull market peak!",
  "May {{name}} stick with Binance for life: live in Binance homes, drive Binance cars, and use the Binance app. A life without liquidation, with wallet balances that constantly hit new highs. Stay calm in bull markets, composed in bear ones, and let your wallet grow endlessly. Wishing {{name}} a life like the Binance mainnet—secure, stable, and always online!",
];

const templateMap = {
  bsc: {
    en: wishTemplatesBSCEN,
    "zh-cn": wishTemplatesBSC,
  },
  solana: {
    en: wishTemplatesSolanaEN,
    "zh-cn": wishTemplatesSolana,
  },
} as const;

export const useTemplate = () => {
  const [template, setTemplate] = useState<string>("");
  const { currentLang: lang } = useLang();
  const { role } = useRoleStore();
  const [displayTemplate, setDisplayTemplate] = useState<string>("");

  const getTemplate = () => {
    const templates = templateMap[role.chain]?.[lang] || [];
    const random = Math.floor(Math.random() * templates.length);
    setTemplate(templates[random]);
  };
  const reName = (name: string) => {
    // 替换模板中所有的{{name}}为实际姓名
    const result = template.replace(/{{name}}/g, name);
    setDisplayTemplate(result);
  };
  return {
    displayTemplate,
    setDisplayTemplate,
    getTemplate,
    reName,
  };
};
