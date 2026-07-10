BEGIN;

CREATE OR REPLACE VIEW unico.vw_employees_complete
 AS
 SELECT e.id,
    e.person_name,
    e.registration_number,
    emp.trading_name AS employer,
    d.name AS department,
    jp.name AS job_position,
    cc.name AS cost_center,
    ws.description AS workshift,
    wg.name AS workstation_group,
    e.hire_date,
    e.dismissal_date
   FROM unico.employees e
     LEFT JOIN unico.employers emp ON emp.id::text = e.employer_id::text
     LEFT JOIN unico.departments d ON d.id::text = e.department_id::text
     LEFT JOIN unico.job_positions jp ON jp.id::text = e.job_position_id::text
     LEFT JOIN unico.cost_centers cc ON cc.id::text = e.cost_center_id::text
     LEFT JOIN unico.workshifts ws ON ws.id::text = e.workshift_id::text
     LEFT JOIN unico.workstation_groups wg ON wg.id::text = e.workstation_group_id::text;

ALTER TABLE unico.vw_employees_complete
    OWNER TO "ADM";

CREATE OR REPLACE VIEW unico.vw_user_profile
 AS
 SELECT u.id AS user_id,
    u.username AS user_username,
    u.email AS user_email,
    u.status AS user_status,
    ee.id AS employee_id,
    ee.person_name AS employee_nome,
    ee.register_number AS employee_matricula,
    ee.hire_date AS employee_data_admissao,
    er.id AS employer_id,
    lo.id AS location_id,
    lo.nome AS location_name,
    de.id AS department_id,
    de.name AS department_nome,
    jo.id AS job_position_id,
    jo.name AS job_position_nome,
    wg.id AS workstation_group_id,
    wg.name AS workstation_group_nome,
    ws.id AS workshift_id,
    ws.description AS workshift_descricao,
    cc.id AS cost_center_id,
    cc.name AS cost_center_nome,
    ee.synced_at AS ultima_sincronizacao
   FROM unico.users u
     JOIN unico.employees ee ON ee.id::text = u.employee_id::text
     JOIN unico.employers er ON er.id::text = ee.employer_id::text
     JOIN unico.locations lo ON lo.employer_id::text = ee.employer_id::text
     JOIN unico.departments de ON de.id::text = ee.department_id::text
     JOIN unico.job_positions jo ON jo.id::text = ee.job_position_id::text
     JOIN unico.workstation_groups wg ON wg.id::text = ee.workstation_group_id::text
     JOIN unico.workshifts ws ON ws.id::text = ee.workshift_id::text
     JOIN unico.cost_centers cc ON cc.id::text = ee.cost_center_id::text
  WHERE u.status = 1;

ALTER TABLE unico.vw_user_profile
    OWNER TO "ADM";

CREATE OR REPLACE VIEW unico.vw_users_permissions
 AS
 SELECT u.id AS user_id,
    u.username,
    u.email,
    c.id AS credential_id,
    r.id AS role_id,
    r.nome AS role_nome,
    s.id AS system_id,
    s.nome AS system_nome
   FROM unico.users u
     JOIN unico.credentials c ON c.user_id = u.id
     JOIN unico.credentials_roles cr ON cr.credential_id = c.id
     JOIN unico.roles r ON r.id = cr.role_id
     JOIN unico.systems s ON s.id = r.system_id;

ALTER TABLE unico.vw_users_permissions
    OWNER TO "ADM";


END;