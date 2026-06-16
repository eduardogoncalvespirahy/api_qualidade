-- =====================================================================
-- Migração inicial do banco de qualidade (schema: teste)
-- Baseada no ERD banco_qualidade.png / banco_qualidade.sql
--
-- Ajustes em relação ao SQL original:
--  * CREATE SCHEMA / CREATE SEQUENCE adicionados para tornar o script
--    executável do zero.
--  * Colunas de FK que estavam como `bigserial` (credentials.user_id,
--    credentials.system_id, sessions.credential_id) foram corrigidas
--    para `bigint`, já que FK não deve ter sequência própria.
-- =====================================================================

BEGIN;


CREATE TABLE IF NOT EXISTS teste.answers
(
    id bigserial NOT NULL,
    form_id bigint NOT NULL,
    nome character varying(100) COLLATE pg_catalog."default" NOT NULL,
    descricao text COLLATE pg_catalog."default",
    status smallint NOT NULL DEFAULT 1,
    data_criacao timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_alteracao timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT answers_pkey PRIMARY KEY (id),
    CONSTRAINT unique_nome_form_answers UNIQUE (nome, form_id)
);

CREATE TABLE IF NOT EXISTS teste.cost_centers
(
    id character varying(50) COLLATE pg_catalog."default" NOT NULL,
    name character varying(255) COLLATE pg_catalog."default",
    CONSTRAINT cost_centers_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS teste.credentials
(
    id bigserial NOT NULL,
    user_id bigserial NOT NULL,
    system_id bigserial NOT NULL,
    senha_hash character varying(255) COLLATE pg_catalog."default" NOT NULL,
    status smallint NOT NULL DEFAULT 1,
    data_ultimo_login timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_criacao timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_alteracao timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT credentials_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS teste.credentials_roles
(
    credential_id bigint NOT NULL,
    role_id bigint NOT NULL,
    CONSTRAINT credentials_roles_pkey PRIMARY KEY (credential_id, role_id)
);

CREATE TABLE IF NOT EXISTS teste.departments
(
    id character varying(50) COLLATE pg_catalog."default" NOT NULL,
    name character varying(255) COLLATE pg_catalog."default",
    CONSTRAINT departments_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS teste.employees
(
    id character varying(50) COLLATE pg_catalog."default" NOT NULL,
    company_number integer,
    register_number integer,
    registration_number integer,
    person_id character varying(50) COLLATE pg_catalog."default",
    person_name character varying(255) COLLATE pg_catalog."default",
    hire_date date,
    dismissal_date date,
    hash character varying(64) COLLATE pg_catalog."default",
    employer_id character varying(50) COLLATE pg_catalog."default",
    department_id character varying(50) COLLATE pg_catalog."default",
    job_position_id character varying(50) COLLATE pg_catalog."default",
    workstation_group_id character varying(50) COLLATE pg_catalog."default",
    workshift_id character varying(50) COLLATE pg_catalog."default",
    cost_center_id character varying(50) COLLATE pg_catalog."default",
    synced_at timestamp without time zone DEFAULT now(),
    CONSTRAINT employees_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS teste.employers
(
    id character varying(50) COLLATE pg_catalog."default" NOT NULL,
    trading_name character varying(255) COLLATE pg_catalog."default",
    CONSTRAINT employers_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS teste.forms
(
    id bigserial NOT NULL,
    section_id bigint NOT NULL,
    nome character varying(100) COLLATE pg_catalog."default" NOT NULL,
    descricao text COLLATE pg_catalog."default",
    status smallint NOT NULL DEFAULT 1,
    data_criacao timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_alteracao timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT forms_pkey PRIMARY KEY (id),
    CONSTRAINT unique_nome_section_forms UNIQUE (nome, section_id)
);

CREATE TABLE IF NOT EXISTS teste.job_positions
(
    id character varying(50) COLLATE pg_catalog."default" NOT NULL,
    name character varying(255) COLLATE pg_catalog."default",
    CONSTRAINT job_positions_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS teste.locations
(
    id bigserial NOT NULL,
    employer_id character varying(50) COLLATE pg_catalog."default" NOT NULL,
    nome character varying(100) COLLATE pg_catalog."default" NOT NULL,
    descricao text COLLATE pg_catalog."default",
    status smallint NOT NULL DEFAULT 1,
    data_criacao timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_alteracao timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT locations_pkey PRIMARY KEY (id),
    CONSTRAINT locations_employer_id_key UNIQUE (employer_id),
    CONSTRAINT unique_nome_employer_locations UNIQUE (nome, employer_id)
);

CREATE TABLE IF NOT EXISTS teste.machines
(
    id bigserial NOT NULL,
    form_id bigint NOT NULL,
    nome character varying(100) COLLATE pg_catalog."default" NOT NULL,
    descricao text COLLATE pg_catalog."default",
    status smallint NOT NULL DEFAULT 1,
    data_criacao timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_alteracao timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT machines_pkey PRIMARY KEY (id),
    CONSTRAINT unique_nome_form_machines UNIQUE (nome, form_id)
);

CREATE TABLE IF NOT EXISTS teste.roles
(
    id bigserial NOT NULL,
    system_id bigint NOT NULL,
    nome character varying(100) COLLATE pg_catalog."default" NOT NULL,
    descricao text COLLATE pg_catalog."default",
    status smallint NOT NULL DEFAULT 1,
    data_criacao timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_alteracao timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT roles_pkey PRIMARY KEY (id),
    CONSTRAINT unique_nome_system_roles UNIQUE (nome, system_id)
);

CREATE TABLE IF NOT EXISTS teste.sections
(
    id bigint NOT NULL DEFAULT nextval('teste.section_id_seq'::regclass),
    employer_id character varying(50) COLLATE pg_catalog."default" NOT NULL,
    nome character varying(100) COLLATE pg_catalog."default" NOT NULL,
    descricao text COLLATE pg_catalog."default",
    status smallint NOT NULL DEFAULT 1,
    data_criacao timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_alteracao timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT section_pkey PRIMARY KEY (id),
    CONSTRAINT unique_nome_employer_sections UNIQUE (nome, employer_id)
);

CREATE TABLE IF NOT EXISTS teste.sessions
(
    id bigserial NOT NULL,
    credential_id bigserial NOT NULL,
    refreshtoken text COLLATE pg_catalog."default" NOT NULL,
    expira timestamp with time zone NOT NULL,
    revogado boolean NOT NULL DEFAULT false,
    data_criacao timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_alteracao timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT sessions_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS teste.sync_logs
(
    id bigserial NOT NULL,
    started_at timestamp without time zone NOT NULL,
    finished_at timestamp without time zone NOT NULL,
    duration_ms bigint NOT NULL,
    inserted integer NOT NULL,
    updated integer NOT NULL,
    removed integer NOT NULL,
    total_api integer NOT NULL,
    total_before integer NOT NULL,
    success boolean NOT NULL,
    error text COLLATE pg_catalog."default",
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT sync_logs_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS teste.systems
(
    id bigserial NOT NULL,
    nome character varying(100) COLLATE pg_catalog."default" NOT NULL,
    descricao text COLLATE pg_catalog."default",
    url character varying(50) COLLATE pg_catalog."default",
    status smallint NOT NULL DEFAULT 1,
    data_criacao timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_alteracao timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT systems_pkey PRIMARY KEY (id),
    CONSTRAINT unique_nome_systems UNIQUE (nome)
);

CREATE TABLE IF NOT EXISTS teste.users
(
    id bigserial NOT NULL,
    employee_id character varying(50) COLLATE pg_catalog."default" NOT NULL,
    username character varying(50) COLLATE pg_catalog."default" NOT NULL,
    email character varying(50) COLLATE pg_catalog."default" NOT NULL,
    status smallint NOT NULL DEFAULT 1,
    data_criacao timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_alteracao timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT unique_email_employee_users UNIQUE (email, employee_id),
    CONSTRAINT unique_username_employee_users UNIQUE (username, employee_id)
);

CREATE TABLE IF NOT EXISTS teste.workshifts
(
    id character varying(50) COLLATE pg_catalog."default" NOT NULL,
    description character varying(255) COLLATE pg_catalog."default",
    CONSTRAINT workshifts_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS teste.workstation_groups
(
    id character varying(50) COLLATE pg_catalog."default" NOT NULL,
    name character varying(255) COLLATE pg_catalog."default",
    CONSTRAINT workstation_groups_pkey PRIMARY KEY (id)
);

ALTER TABLE IF EXISTS teste.answers
    ADD CONSTRAINT forms_fkey FOREIGN KEY (form_id)
    REFERENCES teste.forms (id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE RESTRICT;


ALTER TABLE IF EXISTS teste.credentials
    ADD CONSTRAINT systems_fkey FOREIGN KEY (system_id)
    REFERENCES teste.systems (id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE RESTRICT;


ALTER TABLE IF EXISTS teste.credentials
    ADD CONSTRAINT users_fkey FOREIGN KEY (user_id)
    REFERENCES teste.users (id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE RESTRICT;


ALTER TABLE IF EXISTS teste.credentials_roles
    ADD CONSTRAINT credentials_fkey FOREIGN KEY (credential_id)
    REFERENCES teste.credentials (id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE RESTRICT;


ALTER TABLE IF EXISTS teste.credentials_roles
    ADD CONSTRAINT roles_fkey FOREIGN KEY (role_id)
    REFERENCES teste.roles (id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE RESTRICT;


ALTER TABLE IF EXISTS teste.forms
    ADD CONSTRAINT section_fkey FOREIGN KEY (section_id)
    REFERENCES teste.sections (id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE RESTRICT;


ALTER TABLE IF EXISTS teste.locations
    ADD CONSTRAINT employers_fkey FOREIGN KEY (employer_id)
    REFERENCES teste.employers (id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS locations_employer_id_key
    ON teste.locations(employer_id);


ALTER TABLE IF EXISTS teste.machines
    ADD CONSTRAINT forms_fkey FOREIGN KEY (form_id)
    REFERENCES teste.forms (id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE RESTRICT;


ALTER TABLE IF EXISTS teste.roles
    ADD CONSTRAINT systems_fkey FOREIGN KEY (system_id)
    REFERENCES teste.systems (id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE RESTRICT;


ALTER TABLE IF EXISTS teste.sections
    ADD CONSTRAINT employers_fkey FOREIGN KEY (employer_id)
    REFERENCES teste.employers (id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE RESTRICT;


ALTER TABLE IF EXISTS teste.sessions
    ADD CONSTRAINT credentials_fkey FOREIGN KEY (credential_id)
    REFERENCES teste.credentials (id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE RESTRICT;


ALTER TABLE IF EXISTS teste.users
    ADD CONSTRAINT employees_fkey FOREIGN KEY (employee_id)
    REFERENCES teste.employees (id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE RESTRICT;

END;