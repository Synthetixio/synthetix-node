const { z } = require('zod');

const DappSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    icon: z.string(),
    ens: z.string().optional(),
    ipns: z.string().optional(),
    qm: z.string().optional(),
    bafy: z.string().optional(),
    url: z.string().optional().nullable(),
  })
  .refine((obj) => Boolean(obj.ens || obj.ipns), {
    message: 'ens or ipns must be defined',
    path: ['ens'],
  });

const DappsSchema = z.array(DappSchema);

const ConfigSchema = z
  .object({
    dapps: DappsSchema,
  })
  .strict();

module.exports = {
  DappSchema,
  DappsSchema,
  ConfigSchema,
};
