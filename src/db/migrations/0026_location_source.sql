-- De onde veio a localização do salão: "device" = do celular (atualiza sozinha ao abrir Ajustes), "manual" = digitada.
ALTER TABLE tenants ADD COLUMN location_source text CHECK (location_source IN ('device', 'manual'));
UPDATE tenants SET location_source = 'manual' WHERE latitude IS NOT NULL;
