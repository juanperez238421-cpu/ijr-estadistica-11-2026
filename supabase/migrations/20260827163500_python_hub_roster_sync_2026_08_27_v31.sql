-- Synchronize the active Statistics 11 roster to the teacher-provided 2026-08-27 list.
-- Stable student_registry UUIDs/internal_key values are preserved; only current group, position and full display names are corrected.

update public.student_registry
set source_position=source_position+100
where active=true and group_code in ('11A','11B');

update public.student_registry
set group_code='11B', source_position=999,
    metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('roster_verified_on','2026-08-27','roster_source','teacher_provided')
where id='91693734-901e-4a54-b1c4-c0480da2b151'::uuid;

update public.student_registry
set source_position=case when source_position between 101 and 104 then source_position-100 else source_position-101 end,
    metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('roster_verified_on','2026-08-27','roster_source','teacher_provided')
where active=true and group_code='11A' and source_position between 101 and 118;

update public.student_registry
set source_position=case when source_position between 101 and 105 then source_position-100 else source_position-99 end,
    metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('roster_verified_on','2026-08-27','roster_source','teacher_provided')
where active=true and group_code='11B' and source_position between 101 and 120;

update public.student_registry
set source_position=6
where id='91693734-901e-4a54-b1c4-c0480da2b151'::uuid;

with roster(pos,name) as (values
(1,'ARANGO GIRALDO JUAN PABLO'),
(2,'ARISTIZABAL CORREA MATIAS'),
(3,'AVILA GIRALDO ALEJANDRO'),
(4,'BOTERO VALENCIA JOSE MATIAS'),
(5,'CUBIDES DASUKY DANIEL'),
(6,'DIAZ AGUDELO SIMON'),
(7,'ESCOBAR DOMINGUEZ SUSANA'),
(8,'GOMEZ CANO SAMUEL'),
(9,'GOMEZ CASTRILLON ANTONIA'),
(10,'LONDOÑO PALACIO MIGUEL ANGEL'),
(11,'MAZO LOPEZ JERONIMO'),
(12,'MORENO CARDEÑO JUAN ANDRES'),
(13,'ORTIZ MORALES SUSANA'),
(14,'OSORIO CAMPILLO MIGUEL ANGEL'),
(15,'RODRIGUEZ PEÑA JERONIMO'),
(16,'SORZA OSPINA LUCIANA'),
(17,'TORO AVILA JUAN JOSE')
)
update public.student_registry s
set display_name=r.name,
    normalized_name=public.normalize_student_name(r.name),
    metadata=coalesce(s.metadata,'{}'::jsonb)||jsonb_build_object('roster_verified_on','2026-08-27','roster_source','teacher_provided')
from roster r
where s.active=true and s.group_code='11A' and s.source_position=r.pos;

with roster(pos,name) as (values
(1,'ARBELAEZ ESCOBAR PEDRO PABLO'),
(2,'AUBAD ACEBEDO EMMA'),
(3,'BAUTISTA GIRALDO JERONIMO'),
(4,'BETANCUR OSSA MARIA CAMILA'),
(5,'CARDONA GONZALEZ DAREN'),
(6,'CARDONA VILLEGAS ANTONIA'),
(7,'CHAVARRIAGA AVENDAÑO SAMUEL'),
(8,'GALLEGO ORTEGA MARIA DEL MAR'),
(9,'GIRALDO HINESTROZA MARIAJOSE'),
(10,'GOMEZ TAMAYO MARIA ANTONIA'),
(11,'GUZMAN GOMEZ JACOBO'),
(12,'JARAMILLO ALVAREZ PABLO'),
(13,'JARAMILLO PALACIO PABLO'),
(14,'LOPEZ VINASCO SOFIA'),
(15,'LOTERO MUÑOZ SARA'),
(16,'PALACIO ORREGO ISABELLA'),
(17,'POSADA GONZALEZ MARIA DEL MAR'),
(18,'POSADA HIGUITA SOFIA'),
(19,'REMACHE LOPEZ EMMANUEL'),
(20,'RESTREPO OSPINA ISABEL'),
(21,'RICO PARAMO ALEJANDRO')
)
update public.student_registry s
set display_name=r.name,
    normalized_name=public.normalize_student_name(r.name),
    metadata=coalesce(s.metadata,'{}'::jsonb)||jsonb_build_object('roster_verified_on','2026-08-27','roster_source','teacher_provided')
from roster r
where s.active=true and s.group_code='11B' and s.source_position=r.pos;

with roster(pos,name) as (values
(1,'ARANGO SIERRA JUANA INES'),
(2,'BOLIVAR JARAMILLO ISABEL'),
(3,'BUITRAGO VALENCIA MARIANA'),
(4,'CORTES PAJON SAMUEL'),
(5,'DASUKY RIVERA KEMEL'),
(6,'ECHAVARRIA GUTIERREZ MARIANA'),
(7,'GONZALEZ GIRALDO TOMAS'),
(8,'GUISAO ECHAVARRIA ISABEL'),
(9,'GUZMAN GOMEZ MATIAS'),
(10,'HOYOS RESTREPO JERONIMO'),
(11,'LATORRE AREIZA JUAN ANDRES'),
(12,'MOLINA CASTRO ARIANA'),
(13,'MOYA GOMEZ VIOLETA'),
(14,'OTERO ARANGO LUCIANA MARIA'),
(15,'PALACIO MEJIA ANA SOFIA'),
(16,'PALACIO ORREGO MARIA PAULINA'),
(17,'PENAGOS VON WERDER VALENTINA YAZMIN'),
(18,'POVEDA ARTUNDUAGA MANUELA'),
(19,'RINCON TORRES ALEJANDRO'),
(20,'RODRIGUEZ BASTIDAS NICOLAS'),
(21,'VALENCIA VASQUEZ JERONIMO'),
(22,'VARGAS SUAREZ SIMON'),
(23,'VELASQUEZ BELTRAN SAMUEL')
)
update public.student_registry s
set display_name=r.name,
    normalized_name=public.normalize_student_name(r.name),
    metadata=coalesce(s.metadata,'{}'::jsonb)||jsonb_build_object('roster_verified_on','2026-08-27','roster_source','teacher_provided')
from roster r
where s.active=true and s.group_code='11C' and s.source_position=r.pos;

do $$
begin
  if (select count(*) from public.student_registry where active=true and group_code='11A')<>17 then raise exception '11A roster sync count mismatch'; end if;
  if (select count(*) from public.student_registry where active=true and group_code='11B')<>21 then raise exception '11B roster sync count mismatch'; end if;
  if (select count(*) from public.student_registry where active=true and group_code='11C')<>23 then raise exception '11C roster sync count mismatch'; end if;
end $$;
