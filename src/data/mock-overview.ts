export const MOCK_ASSET_METRICS = [
    {
        title: "Total Assets",
        value: 1258888.00,
        currency: "¥",
        change: +12.5, // 较昨日
    },
    {
        title: "Today P&L",
        value: +3566.21,
        isPnl: true,
    },
    {
        title: "Cash Ratio",
        value: "24.5%",
        desc: "较上月 -2%",
    },
];

export const MOCK_ACCOUNTS = [
    {
        id: "1",
        name: "招商银行储蓄卡",
        type: "现金",
        balance: 50000.00,
        totalAssets: 1258888.00, // 用于计算占比
    },
    {
        id: "2",
        name: "支付宝余额宝",
        type: "基金",
        balance: 258888.00,
        totalAssets: 1258888.00,
    },
    {
        id: "3",
        name: "华泰证券账户",
        type: "股票",
        balance: 850000.00,
        totalAssets: 1258888.00,
    },
    {
        id: "4",
        name: "微信零钱",
        type: "现金",
        balance: 10000.00,
        totalAssets: 1258888.00,
    },
];

// 修改 MOCK_TREND_DATA 结构以支持多时间维度
export const MOCK_TREND_DATA = {
    week: { // 原来的 7 天数据
        dates: ["01-25", "01-26", "01-27", "01-28", "01-29", "01-30", "01-31"],
        values: [1200000, 1210000, 1205000, 1220000, 1235000, 1250000, 1258888],
    },
    month: { // 30 天数据 mock (简化为每 3 天一个点)
        dates: ["01-01", "01-04", "01-07", "01-10", "01-13", "01-16", "01-19", "01-22", "01-25", "01-28", "01-31"],
        values: [1150000, 1160000, 1155000, 1170000, 1180000, 1175000, 1190000, 1200000, 1200000, 1220000, 1258888],
    },
    year: { // 12 个月数据
        dates: ["Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan"],
        values: [900000, 920000, 950000, 930000, 980000, 1000000, 1050000, 1100000, 1080000, 1150000, 1200000, 1258888],
    },
};

export const MOCK_ALLOCATION_DATA = [
    { value: 950000, name: "股票" },
    { value: 258888, name: "基金" },
    { value: 50000, name: "现金" },
];

export interface Position {
    id: string;
    code: string;
    name: string;
    assetType: "STOCK" | "FUND"; // STOCK 或 FUND
    currentPrice: number; // 当前价/最新净值
    avgCost: number; // 持仓成本
    quantity: number; // 持仓数量
    dailyChange: number; // 今日涨跌幅 (%)
    totalProfit: number; // 累计盈亏
}

export const MOCK_POSITIONS: Position[] = [
    {
        id: "p1",
        code: "00700",
        name: "腾讯控股",
        assetType: "STOCK",
        currentPrice: 385.2,
        avgCost: 350.0,
        quantity: 1000,
        dailyChange: 1.5,
        totalProfit: (385.2 - 350.0) * 1000,
    },
    {
        id: "p2",
        code: "000001",
        name: "上证指数ETF",
        assetType: "FUND",
        currentPrice: 1.25,
        avgCost: 1.20,
        quantity: 50000,
        dailyChange: -0.8,
        totalProfit: (1.25 - 1.20) * 50000,
    },
    {
        id: "p3",
        code: "TSLA",
        name: "Tesla Inc",
        assetType: "STOCK",
        currentPrice: 240.5,
        avgCost: 260.0,
        quantity: 50,
        dailyChange: 2.1,
        totalProfit: (240.5 - 260.0) * 50,
    },
];
