export const MOCK_ASSET_METRICS = [
    {
        title: "总资产净值",
        value: 1258888.00,
        currency: "¥",
        change: +12.5, // 较昨日
    },
    {
        title: "今日盈亏",
        value: +3566.21,
        isPnl: true,
    },
    {
        title: "现金占比",
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

export const MOCK_TREND_DATA = {
    dates: ["01-25", "01-26", "01-27", "01-28", "01-29", "01-30", "01-31"],
    values: [1200000, 1210000, 1205000, 1220000, 1235000, 1250000, 1258888],
};

export const MOCK_ALLOCATION_DATA = [
    { value: 950000, name: "股票" },
    { value: 258888, name: "基金" },
    { value: 50000, name: "现金" },
];
