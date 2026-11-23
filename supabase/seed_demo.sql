-- Clearly labelled demo seed. Replace/expand only with properly sourced data.
insert into public.teams(name,kind,country_code) values
('France','national','FR'),('Real Madrid','club','ES'),('Barcelona','club','ES')
on conflict(name,kind) do nothing;

with demo(name,nationality,position,rating,team_name) as (values
('Fabien Barthez','France','GK',91,'France'),
('Iker Casillas','Spain','GK',94,'Real Madrid'),
('Victor Valdes','Spain','GK',90,'Barcelona'),
('Bixente Lizarazu','France','LB',88,'France'),
('Roberto Carlos','Brazil','LB',94,'Real Madrid'),
('Eric Abidal','France','LB',90,'Barcelona'),
('Marcel Desailly','France','CB',92,'France'),
('Sergio Ramos','Spain','CB',96,'Real Madrid'),
('Carles Puyol','Spain','CB',93,'Barcelona'),
('Laurent Blanc','France','CB',91,'France'),
('Pepe','Portugal','CB',93,'Real Madrid'),
('Gerard Pique','Spain','CB',92,'Barcelona'),
('Lilian Thuram','France','RB',92,'France'),
('Dani Carvajal','Spain','RB',91,'Real Madrid'),
('Dani Alves','Brazil','RB',95,'Barcelona'),
('Patrick Vieira','France','CM',93,'France'),
('Luka Modric','Croatia','CM',96,'Real Madrid'),
('Xavi','Spain','CM',95,'Barcelona'),
('Zinedine Zidane','France','CM',96,'France'),
('Toni Kroos','Germany','CM',95,'Real Madrid'),
('Andres Iniesta','Spain','CM',96,'Barcelona'),
('Claude Makelele','France','CDM',90,'France'),
('Casemiro','Brazil','CDM',91,'Real Madrid'),
('Sergio Busquets','Spain','CDM',92,'Barcelona'),
('Franck Ribery','France','LW',92,'France'),
('Cristiano Ronaldo','Portugal','LW',98,'Real Madrid'),
('Ronaldinho','Brazil','LW',96,'Barcelona'),
('Olivier Giroud','France','ST',88,'France'),
('Raul','Spain','ST',94,'Real Madrid'),
('Luis Suarez','Uruguay','ST',96,'Barcelona'),
('Kylian Mbappe','France','RW',97,'France'),
('Gareth Bale','Wales','RW',94,'Real Madrid'),
('Lionel Messi','Argentina','RW',98,'Barcelona')
), ins as (
 insert into public.players(full_name,nationality,data_status)
 select name,nationality,'demo'::data_status from demo
 on conflict do nothing returning id,full_name
)
insert into public.players(full_name,nationality,data_status)
select d.name,d.nationality,'demo'::data_status from demo d
where not exists(select 1 from public.players p where p.full_name=d.name);

insert into public.player_teams(player_id,team_id,relationship)
select p.id,t.id,'demo_association'
from public.players p
join (values
('Fabien Barthez','France'),('Iker Casillas','Real Madrid'),('Victor Valdes','Barcelona'),
('Bixente Lizarazu','France'),('Roberto Carlos','Real Madrid'),('Eric Abidal','Barcelona'),
('Marcel Desailly','France'),('Sergio Ramos','Real Madrid'),('Carles Puyol','Barcelona'),
('Laurent Blanc','France'),('Pepe','Real Madrid'),('Gerard Pique','Barcelona'),
('Lilian Thuram','France'),('Dani Carvajal','Real Madrid'),('Dani Alves','Barcelona'),
('Patrick Vieira','France'),('Luka Modric','Real Madrid'),('Xavi','Barcelona'),
('Zinedine Zidane','France'),('Toni Kroos','Real Madrid'),('Andres Iniesta','Barcelona'),
('Claude Makelele','France'),('Casemiro','Real Madrid'),('Sergio Busquets','Barcelona'),
('Franck Ribery','France'),('Cristiano Ronaldo','Real Madrid'),('Ronaldinho','Barcelona'),
('Olivier Giroud','France'),('Raul','Real Madrid'),('Luis Suarez','Barcelona'),
('Kylian Mbappe','France'),('Gareth Bale','Real Madrid'),('Lionel Messi','Barcelona')
) as x(player_name,team_name) on true
join public.teams t on t.name=x.team_name
where p.full_name=x.player_name
on conflict(player_id,team_id,relationship) do nothing;

insert into public.player_positions(player_id,position,is_primary)
select p.id, x.position::player_position,true
from public.players p
join (values
('Fabien Barthez','GK'),('Iker Casillas','GK'),('Victor Valdes','GK'),
('Bixente Lizarazu','LB'),('Roberto Carlos','LB'),('Eric Abidal','LB'),
('Marcel Desailly','CB'),('Sergio Ramos','CB'),('Carles Puyol','CB'),
('Laurent Blanc','CB'),('Pepe','CB'),('Gerard Pique','CB'),
('Lilian Thuram','RB'),('Dani Carvajal','RB'),('Dani Alves','RB'),
('Patrick Vieira','CM'),('Luka Modric','CM'),('Xavi','CM'),
('Zinedine Zidane','CM'),('Toni Kroos','CM'),('Andres Iniesta','CM'),
('Claude Makelele','CDM'),('Casemiro','CDM'),('Sergio Busquets','CDM'),
('Franck Ribery','LW'),('Cristiano Ronaldo','LW'),('Ronaldinho','LW'),
('Olivier Giroud','ST'),('Raul','ST'),('Luis Suarez','ST'),
('Kylian Mbappe','RW'),('Gareth Bale','RW'),('Lionel Messi','RW')
) as x(player_name,position) on p.full_name=x.player_name
on conflict(player_id,position) do nothing;

insert into public.rating_sources(source_name,edition,season_year,rights_notes)
values('Demo placeholder','Unverified illustrative ratings',2026,'Not official FIFA/EA data; do not use as factual historical ratings.')
on conflict(source_name,edition) do nothing;

insert into public.player_ratings(player_id,source_id,overall,position,is_peak,status)
select p.id,s.id,
case p.full_name
 when 'Fabien Barthez' then 91 when 'Iker Casillas' then 94 when 'Victor Valdes' then 90
 when 'Bixente Lizarazu' then 88 when 'Roberto Carlos' then 94 when 'Eric Abidal' then 90
 when 'Marcel Desailly' then 92 when 'Sergio Ramos' then 96 when 'Carles Puyol' then 93
 when 'Laurent Blanc' then 91 when 'Pepe' then 93 when 'Gerard Pique' then 92
 when 'Lilian Thuram' then 92 when 'Dani Carvajal' then 91 when 'Dani Alves' then 95
 when 'Patrick Vieira' then 93 when 'Luka Modric' then 96 when 'Xavi' then 95
 when 'Zinedine Zidane' then 96 when 'Toni Kroos' then 95 when 'Andres Iniesta' then 96
 when 'Claude Makelele' then 90 when 'Casemiro' then 91 when 'Sergio Busquets' then 92
 when 'Franck Ribery' then 92 when 'Cristiano Ronaldo' then 98 when 'Ronaldinho' then 96
 when 'Olivier Giroud' then 88 when 'Raul' then 94 when 'Luis Suarez' then 96
 when 'Kylian Mbappe' then 97 when 'Gareth Bale' then 94 when 'Lionel Messi' then 98
 else 80 end,
pp.position,true,'demo'::data_status
from public.players p
join public.player_positions pp on pp.player_id=p.id and pp.is_primary
join public.rating_sources s on s.source_name='Demo placeholder'
where p.data_status='demo'
on conflict do nothing;
