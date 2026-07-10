BEGIN;

CREATE OR REPLACE VIEW qualidade.vw_form_structure
 AS
 SELECT e.id AS employer_id,
    e.trading_name AS employer_nome,
    s.id AS section_id,
    s.nome AS section_nome,
    f.id AS form_id,
    f.nome AS form_nome,
    a.id AS answer_id,
    a.nome AS answer_nome,
    ca.nome AS categoria
   FROM unico.employers e
     JOIN qualidade.sections s ON s.employer_id::text = e.id::text
     JOIN qualidade.forms f ON f.section_id = s.id
     JOIN qualidade.answers a ON a.form_id = f.id
     JOIN qualidade.categories_answers ca ON ca.id = a.categorie_id;

ALTER TABLE qualidade.vw_form_structure
    OWNER TO "ADM";

CREATE OR REPLACE VIEW qualidade.vw_machine_structure
 AS
 SELECT e.id AS employer_id,
    e.trading_name,
    s.id AS section_id,
    s.nome AS section_nome,
    f.id AS form_id,
    f.nome AS form_nome,
    m.id AS machine_id,
    m.nome AS machine_nome,
    ma.id AS machine_answer_id,
    ma.nome AS pergunta
   FROM unico.employers e
     JOIN qualidade.sections s ON s.employer_id::text = e.id::text
     JOIN qualidade.forms f ON f.section_id = s.id
     JOIN qualidade.machines m ON m.form_id = f.id
     JOIN qualidade.machine_answers ma ON ma.machine_id = m.id;

ALTER TABLE qualidade.vw_machine_structure
    OWNER TO "ADM";

END;