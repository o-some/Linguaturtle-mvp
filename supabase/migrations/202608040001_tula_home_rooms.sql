insert into public.shop_items (item_id, item_type, shell_cost, consumable) values
  ('home:flower', 'home', 45, false),
  ('home:sailor', 'home', 65, false),
  ('home:explorer', 'home', 80, false)
on conflict (item_id) do update
set item_type = excluded.item_type,
    shell_cost = excluded.shell_cost,
    consumable = excluded.consumable,
    active = true;
