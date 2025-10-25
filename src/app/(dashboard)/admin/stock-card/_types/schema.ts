import z from "zod";

const stockCardSchema = z.intersection(
  z.object({
    name: z.string().min(1).max(255),
    total: z.number().min(1),
    percent: z.number().min(0).max(100),
    cost: z.number().min(0),
  }),
  z.discriminatedUnion('action',[
    z.object({
      action: z.literal('create'),
    }),
    z.object({
      action: z.literal('update'),
      id: z.number().min(1),
    })
  ])
);

type StockCardSchema = z.infer<typeof stockCardSchema>;

const stockCardDefaultValues: StockCardSchema = {
  name: "",
  total: 0,
  percent: 0,
  cost: 0,
  action: "create",
};

export { stockCardSchema, stockCardDefaultValues, type StockCardSchema };