-- ============================================================
-- Price-Compare Seed Data
-- 在 Supabase Dashboard → SQL Editor 中执行
-- 注意：请先执行建表 SQL，再执行本文件
-- ============================================================

-- ============================================================
-- 1. 供应商 (Suppliers)
-- ============================================================
INSERT INTO suppliers (id, name, "supplierTypes", "contactPerson", phone, email, address, status)
VALUES
  ('a0000000-0000-0000-0000-000000000001', '顺丰国际', ARRAY['first_mile'], '张三', '13800138001', 'zhangsan@sf.com', '深圳市南山区科技园', 'active'),
  ('a0000000-0000-0000-0000-000000000002', '中通国际', ARRAY['customs'], '李四', '13800138002', 'lisi@zto.com', '上海市青浦区华新镇', 'active'),
  ('a0000000-0000-0000-0000-000000000003', '圆通速递', ARRAY['last_mile'], '王五', '13800138003', 'wangwu@yto.com', '上海市青浦区华新镇', 'active'),
  ('a0000000-0000-0000-0000-000000000004', '锅盔全程物流', ARRAY['full_service'], '赵六', '13800138004', 'zhaoliu@guokui.com', '广州市白云区物流园', 'active');

-- ============================================================
-- 2. 国家 (Countries)
-- ============================================================
INSERT INTO countries (id, name, code, status)
VALUES
  ('b0000000-0000-0000-0000-000000000001', '美国', 'US', 'active'),
  ('b0000000-0000-0000-0000-000000000002', '英国', 'GB', 'active'),
  ('b0000000-0000-0000-0000-000000000003', '德国', 'DE', 'active');

-- ============================================================
-- 3. 货币 (Currencies)
-- ============================================================
INSERT INTO currencies (id, name, rate, status)
VALUES
  ('c0000000-0000-0000-0000-000000000001', '美元', 724.50, 'active'),
  ('c0000000-0000-0000-0000-000000000002', '英镑', 915.30, 'active'),
  ('c0000000-0000-0000-0000-000000000003', '欧元', 788.60, 'active');

-- ============================================================
-- 4. 产品 (Products)
-- ============================================================

-- 美国专线-标准（全程，重量段计费，普货）
INSERT INTO products (id, name, "productType", "supplierId", country, "cargoType", "volumeRatio", "currencyId", "taxRate", "pricingMode", "weightRanges", status)
VALUES (
  'd0000000-0000-0000-0000-000000000001',
  '美国专线-标准',
  'full_service',
  'a0000000-0000-0000-0000-000000000004',
  '美国',
  'general',
  5000,
  '',
  0,
  'weight_range',
  '[
    {"id":"wr-001-1","minWeight":0,"maxWeight":5,"unitPrice":45,"handlingFee":15},
    {"id":"wr-001-2","minWeight":5,"maxWeight":10,"unitPrice":40,"handlingFee":15},
    {"id":"wr-001-3","minWeight":10,"maxWeight":30,"unitPrice":35,"handlingFee":15},
    {"id":"wr-001-4","minWeight":30,"maxWeight":9999,"unitPrice":30,"handlingFee":15}
  ]'::jsonb,
  'active'
);

-- 美国专线-经济（全程，重量段计费，普货）
INSERT INTO products (id, name, "productType", "supplierId", country, "cargoType", "volumeRatio", "currencyId", "taxRate", "pricingMode", "weightRanges", status)
VALUES (
  'd0000000-0000-0000-0000-000000000002',
  '美国专线-经济',
  'full_service',
  'a0000000-0000-0000-0000-000000000004',
  '美国',
  'general',
  6000,
  '',
  0,
  'weight_range',
  '[
    {"id":"wr-002-1","minWeight":0,"maxWeight":5,"unitPrice":38,"handlingFee":10},
    {"id":"wr-002-2","minWeight":5,"maxWeight":10,"unitPrice":34,"handlingFee":10},
    {"id":"wr-002-3","minWeight":10,"maxWeight":30,"unitPrice":30,"handlingFee":10},
    {"id":"wr-002-4","minWeight":30,"maxWeight":9999,"unitPrice":26,"handlingFee":10}
  ]'::jsonb,
  'active'
);

-- 美国专线-快速（全程，重量段计费，带电）
INSERT INTO products (id, name, "productType", "supplierId", country, "cargoType", "volumeRatio", "currencyId", "taxRate", "pricingMode", "weightRanges", status)
VALUES (
  'd0000000-0000-0000-0000-000000000003',
  '美国专线-快速',
  'full_service',
  'a0000000-0000-0000-0000-000000000004',
  '美国',
  'electric',
  5000,
  '',
  0,
  'weight_range',
  '[
    {"id":"wr-003-1","minWeight":0,"maxWeight":5,"unitPrice":55,"handlingFee":20},
    {"id":"wr-003-2","minWeight":5,"maxWeight":10,"unitPrice":48,"handlingFee":20},
    {"id":"wr-003-3","minWeight":10,"maxWeight":30,"unitPrice":42,"handlingFee":20},
    {"id":"wr-003-4","minWeight":30,"maxWeight":9999,"unitPrice":38,"handlingFee":20}
  ]'::jsonb,
  'active'
);

-- 英国专线-标准（全程，重量段计费，普货）
INSERT INTO products (id, name, "productType", "supplierId", country, "cargoType", "volumeRatio", "currencyId", "taxRate", "pricingMode", "weightRanges", status)
VALUES (
  'd0000000-0000-0000-0000-000000000004',
  '英国专线-标准',
  'full_service',
  'a0000000-0000-0000-0000-000000000004',
  '英国',
  'general',
  5000,
  '',
  0,
  'weight_range',
  '[
    {"id":"wr-004-1","minWeight":0,"maxWeight":5,"unitPrice":50,"handlingFee":12},
    {"id":"wr-004-2","minWeight":5,"maxWeight":10,"unitPrice":45,"handlingFee":12},
    {"id":"wr-004-3","minWeight":10,"maxWeight":30,"unitPrice":40,"handlingFee":12},
    {"id":"wr-004-4","minWeight":30,"maxWeight":9999,"unitPrice":35,"handlingFee":12}
  ]'::jsonb,
  'active'
);

-- 英国专线-经济（全程，重量段计费，特敏）
INSERT INTO products (id, name, "productType", "supplierId", country, "cargoType", "volumeRatio", "currencyId", "taxRate", "pricingMode", "weightRanges", status)
VALUES (
  'd0000000-0000-0000-0000-000000000005',
  '英国专线-经济',
  'full_service',
  'a0000000-0000-0000-0000-000000000004',
  '英国',
  'sensitive',
  6000,
  '',
  0,
  'weight_range',
  '[
    {"id":"wr-005-1","minWeight":0,"maxWeight":5,"unitPrice":42,"handlingFee":8},
    {"id":"wr-005-2","minWeight":5,"maxWeight":10,"unitPrice":38,"handlingFee":8},
    {"id":"wr-005-3","minWeight":10,"maxWeight":30,"unitPrice":33,"handlingFee":8},
    {"id":"wr-005-4","minWeight":30,"maxWeight":9999,"unitPrice":28,"handlingFee":8}
  ]'::jsonb,
  'active'
);

-- 德国专线-标准（全程，重量段计费，普货）
INSERT INTO products (id, name, "productType", "supplierId", country, "cargoType", "volumeRatio", "currencyId", "taxRate", "pricingMode", "weightRanges", status)
VALUES (
  'd0000000-0000-0000-0000-000000000006',
  '德国专线-标准',
  'full_service',
  'a0000000-0000-0000-0000-000000000004',
  '德国',
  'general',
  5000,
  '',
  0,
  'weight_range',
  '[
    {"id":"wr-006-1","minWeight":0,"maxWeight":5,"unitPrice":52,"handlingFee":15},
    {"id":"wr-006-2","minWeight":5,"maxWeight":10,"unitPrice":46,"handlingFee":15},
    {"id":"wr-006-3","minWeight":10,"maxWeight":30,"unitPrice":40,"handlingFee":15},
    {"id":"wr-006-4","minWeight":30,"maxWeight":9999,"unitPrice":36,"handlingFee":15}
  ]'::jsonb,
  'active'
);

-- 美国专线-首重续重（全程，首重续重计费，普货）
INSERT INTO products (id, name, "productType", "supplierId", country, "cargoType", "volumeRatio", "currencyId", "taxRate", "pricingMode", "firstWeight", "continuedWeight", "firstWeightPrice", "continuedWeightPrice", status)
VALUES (
  'd0000000-0000-0000-0000-000000000007',
  '美国专线-首重续重',
  'full_service',
  'a0000000-0000-0000-0000-000000000004',
  '美国',
  'general',
  5000,
  '',
  0,
  'first_weight',
  0.5,
  0.5,
  25,
  12,
  'active'
);

-- 美国组合专线（组合产品，F货）
INSERT INTO products (id, name, "productType", country, "cargoType", "firstMile", customs, "lastMile", status)
VALUES (
  'd0000000-0000-0000-0000-000000000008',
  '美国组合专线',
  'combined',
  '美国',
  'f_cargo',
  '{"supplierId":"a0000000-0000-0000-0000-000000000001","price":3.5,"currencyId":"","volumeRatio":5000}'::jsonb,
  '{"supplierId":"a0000000-0000-0000-0000-000000000002","price":1.2,"currencyId":"","taxRate":0}'::jsonb,
  '{
    "supplierId":"a0000000-0000-0000-0000-000000000003",
    "currencyId":"",
    "volumeRatio":5000,
    "weightRanges":[
      {"id":"wr-008-1","minWeight":0,"maxWeight":5,"unitPrice":8,"handlingFee":10},
      {"id":"wr-008-2","minWeight":5,"maxWeight":10,"unitPrice":7,"handlingFee":10},
      {"id":"wr-008-3","minWeight":10,"maxWeight":30,"unitPrice":6,"handlingFee":10},
      {"id":"wr-008-4","minWeight":30,"maxWeight":9999,"unitPrice":5,"handlingFee":10}
    ]
  }'::jsonb,
  'active'
);
