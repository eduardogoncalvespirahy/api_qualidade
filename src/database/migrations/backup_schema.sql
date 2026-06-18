--
-- PostgreSQL database dump
--

\restrict FjKOeCpdWFFephdW7pj5aDlsPD2QXS8nbi4QPWS1D5MvZQ6WT25rgWWdZ9vFjUn

-- Dumped from database version 15.12
-- Dumped by pg_dump version 18.3

-- Started on 2026-06-18 16:26:13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 22 (class 2615 OID 7800672)
-- Name: teste; Type: SCHEMA; Schema: -; Owner: ADM
--

CREATE SCHEMA teste;


ALTER SCHEMA teste OWNER TO "ADM";

--
-- TOC entry 1743 (class 1255 OID 7814040)
-- Name: fn_inativar_usuario_apos_exclusao_employee(); Type: FUNCTION; Schema: teste; Owner: ADM
--

CREATE FUNCTION teste.fn_inativar_usuario_apos_exclusao_employee() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE teste.users
       SET status = 0,
           data_alteracao = CURRENT_TIMESTAMP
     WHERE employee_id = OLD.id;

    RETURN OLD;
END;
$$;


ALTER FUNCTION teste.fn_inativar_usuario_apos_exclusao_employee() OWNER TO "ADM";

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 1518 (class 1259 OID 7813757)
-- Name: answer_result; Type: TABLE; Schema: teste; Owner: ADM
--

CREATE TABLE teste.answer_result (
    id bigint NOT NULL,
    answer_id bigint NOT NULL,
    resposta text
);


ALTER TABLE teste.answer_result OWNER TO "ADM";

--
-- TOC entry 1517 (class 1259 OID 7813756)
-- Name: answer_result_id_seq; Type: SEQUENCE; Schema: teste; Owner: ADM
--

CREATE SEQUENCE teste.answer_result_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE teste.answer_result_id_seq OWNER TO "ADM";

--
-- TOC entry 7641 (class 0 OID 0)
-- Dependencies: 1517
-- Name: answer_result_id_seq; Type: SEQUENCE OWNED BY; Schema: teste; Owner: ADM
--

ALTER SEQUENCE teste.answer_result_id_seq OWNED BY teste.answer_result.id;


--
-- TOC entry 1495 (class 1259 OID 7809394)
-- Name: answers; Type: TABLE; Schema: teste; Owner: ADM
--

CREATE TABLE teste.answers (
    id bigint NOT NULL,
    form_id bigint NOT NULL,
    nome character varying(100) NOT NULL,
    descricao text,
    status smallint DEFAULT 1 NOT NULL,
    data_criacao timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    data_alteracao timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    categorie_id bigint NOT NULL,
    CONSTRAINT check_nome_answers CHECK ((length(TRIM(BOTH FROM nome)) > 0)),
    CONSTRAINT check_status_answers CHECK ((status = ANY (ARRAY[0, 1])))
);


ALTER TABLE teste.answers OWNER TO "ADM";

--
-- TOC entry 1494 (class 1259 OID 7809393)
-- Name: answers_id_seq; Type: SEQUENCE; Schema: teste; Owner: ADM
--

CREATE SEQUENCE teste.answers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE teste.answers_id_seq OWNER TO "ADM";

--
-- TOC entry 7642 (class 0 OID 0)
-- Dependencies: 1494
-- Name: answers_id_seq; Type: SEQUENCE OWNED BY; Schema: teste; Owner: ADM
--

ALTER SEQUENCE teste.answers_id_seq OWNED BY teste.answers.id;


--
-- TOC entry 1524 (class 1259 OID 7813870)
-- Name: breaks_forms; Type: TABLE; Schema: teste; Owner: ADM
--

CREATE TABLE teste.breaks_forms (
    id bigint NOT NULL,
    form_id bigint NOT NULL,
    hora_inicio timestamp without time zone,
    hora_fim timestamp without time zone,
    motivo text,
    status smallint DEFAULT 1 NOT NULL,
    data_criacao timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    data_alteracao timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT check_status_breaks_forms CHECK ((status = ANY (ARRAY[0, 1])))
);


ALTER TABLE teste.breaks_forms OWNER TO "ADM";

--
-- TOC entry 1523 (class 1259 OID 7813869)
-- Name: breaks_forms_id_seq; Type: SEQUENCE; Schema: teste; Owner: ADM
--

CREATE SEQUENCE teste.breaks_forms_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE teste.breaks_forms_id_seq OWNER TO "ADM";

--
-- TOC entry 7643 (class 0 OID 0)
-- Dependencies: 1523
-- Name: breaks_forms_id_seq; Type: SEQUENCE OWNED BY; Schema: teste; Owner: ADM
--

ALTER SEQUENCE teste.breaks_forms_id_seq OWNED BY teste.breaks_forms.id;


--
-- TOC entry 1526 (class 1259 OID 7813890)
-- Name: breaks_machines; Type: TABLE; Schema: teste; Owner: ADM
--

CREATE TABLE teste.breaks_machines (
    id bigint NOT NULL,
    machine_id bigint NOT NULL,
    hora_inicio timestamp without time zone,
    hora_fim timestamp without time zone,
    motivo text,
    status smallint DEFAULT 1 NOT NULL,
    data_criacao timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    data_alteracao timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT check_status_breaks_machines CHECK ((status = ANY (ARRAY[0, 1])))
);


ALTER TABLE teste.breaks_machines OWNER TO "ADM";

--
-- TOC entry 1525 (class 1259 OID 7813889)
-- Name: breaks_machines_id_seq; Type: SEQUENCE; Schema: teste; Owner: ADM
--

CREATE SEQUENCE teste.breaks_machines_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE teste.breaks_machines_id_seq OWNER TO "ADM";

--
-- TOC entry 7644 (class 0 OID 0)
-- Dependencies: 1525
-- Name: breaks_machines_id_seq; Type: SEQUENCE OWNED BY; Schema: teste; Owner: ADM
--

ALTER SEQUENCE teste.breaks_machines_id_seq OWNED BY teste.breaks_machines.id;


--
-- TOC entry 1514 (class 1259 OID 7812201)
-- Name: categories_answers; Type: TABLE; Schema: teste; Owner: ADM
--

CREATE TABLE teste.categories_answers (
    id bigint NOT NULL,
    nome character varying(100) NOT NULL,
    descricao text,
    status smallint DEFAULT 1 NOT NULL,
    data_criacao timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    data_alteracao timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT check_nome_categories_answers CHECK ((length(TRIM(BOTH FROM nome)) > 0)),
    CONSTRAINT check_status_categories_answers CHECK ((status = ANY (ARRAY[0, 1])))
);


ALTER TABLE teste.categories_answers OWNER TO "ADM";

--
-- TOC entry 1513 (class 1259 OID 7812200)
-- Name: categories_answers_id_seq; Type: SEQUENCE; Schema: teste; Owner: ADM
--

CREATE SEQUENCE teste.categories_answers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE teste.categories_answers_id_seq OWNER TO "ADM";

--
-- TOC entry 7645 (class 0 OID 0)
-- Dependencies: 1513
-- Name: categories_answers_id_seq; Type: SEQUENCE OWNED BY; Schema: teste; Owner: ADM
--

ALTER SEQUENCE teste.categories_answers_id_seq OWNED BY teste.categories_answers.id;


--
-- TOC entry 1528 (class 1259 OID 7814109)
-- Name: controls; Type: TABLE; Schema: teste; Owner: ADM
--

CREATE TABLE teste.controls (
    id bigint NOT NULL,
    form_id bigint NOT NULL,
    user_id bigint NOT NULL,
    observacao text,
    data_emissao timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    data_criacao timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    data_alteracao timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE teste.controls OWNER TO "ADM";

--
-- TOC entry 1527 (class 1259 OID 7814108)
-- Name: controls_id_seq; Type: SEQUENCE; Schema: teste; Owner: ADM
--

CREATE SEQUENCE teste.controls_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE teste.controls_id_seq OWNER TO "ADM";

--
-- TOC entry 7646 (class 0 OID 0)
-- Dependencies: 1527
-- Name: controls_id_seq; Type: SEQUENCE OWNED BY; Schema: teste; Owner: ADM
--

ALTER SEQUENCE teste.controls_id_seq OWNED BY teste.controls.id;


--
-- TOC entry 1473 (class 1259 OID 7808689)
-- Name: cost_centers; Type: TABLE; Schema: teste; Owner: ADM
--

CREATE TABLE teste.cost_centers (
    id character varying(50) NOT NULL,
    name character varying(255)
);


ALTER TABLE teste.cost_centers OWNER TO "ADM";

--
-- TOC entry 1486 (class 1259 OID 7809127)
-- Name: credentials; Type: TABLE; Schema: teste; Owner: ADM
--

CREATE TABLE teste.credentials (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    system_id bigint NOT NULL,
    senha_hash character varying(255) NOT NULL,
    status smallint DEFAULT 1 NOT NULL,
    data_ultimo_login timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    data_criacao timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    data_alteracao timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT check_status_credentials CHECK ((status = ANY (ARRAY[0, 1])))
);


ALTER TABLE teste.credentials OWNER TO "ADM";

--
-- TOC entry 1483 (class 1259 OID 7809124)
-- Name: credentials_id_seq; Type: SEQUENCE; Schema: teste; Owner: ADM
--

CREATE SEQUENCE teste.credentials_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE teste.credentials_id_seq OWNER TO "ADM";

--
-- TOC entry 7647 (class 0 OID 0)
-- Dependencies: 1483
-- Name: credentials_id_seq; Type: SEQUENCE OWNED BY; Schema: teste; Owner: ADM
--

ALTER SEQUENCE teste.credentials_id_seq OWNED BY teste.credentials.id;


--
-- TOC entry 1504 (class 1259 OID 7809574)
-- Name: credentials_roles; Type: TABLE; Schema: teste; Owner: ADM
--

CREATE TABLE teste.credentials_roles (
    credential_id bigint NOT NULL,
    role_id bigint NOT NULL
);


ALTER TABLE teste.credentials_roles OWNER TO "ADM";

--
-- TOC entry 1485 (class 1259 OID 7809126)
-- Name: credentials_system_id_seq; Type: SEQUENCE; Schema: teste; Owner: ADM
--

CREATE SEQUENCE teste.credentials_system_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE teste.credentials_system_id_seq OWNER TO "ADM";

--
-- TOC entry 7648 (class 0 OID 0)
-- Dependencies: 1485
-- Name: credentials_system_id_seq; Type: SEQUENCE OWNED BY; Schema: teste; Owner: ADM
--

ALTER SEQUENCE teste.credentials_system_id_seq OWNED BY teste.credentials.system_id;


--
-- TOC entry 1484 (class 1259 OID 7809125)
-- Name: credentials_user_id_seq; Type: SEQUENCE; Schema: teste; Owner: ADM
--

CREATE SEQUENCE teste.credentials_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE teste.credentials_user_id_seq OWNER TO "ADM";

--
-- TOC entry 7649 (class 0 OID 0)
-- Dependencies: 1484
-- Name: credentials_user_id_seq; Type: SEQUENCE OWNED BY; Schema: teste; Owner: ADM
--

ALTER SEQUENCE teste.credentials_user_id_seq OWNED BY teste.credentials.user_id;


--
-- TOC entry 1471 (class 1259 OID 7808679)
-- Name: departments; Type: TABLE; Schema: teste; Owner: ADM
--

CREATE TABLE teste.departments (
    id character varying(50) NOT NULL,
    name character varying(255)
);


ALTER TABLE teste.departments OWNER TO "ADM";

--
-- TOC entry 1476 (class 1259 OID 7808704)
-- Name: employees; Type: TABLE; Schema: teste; Owner: ADM
--

CREATE TABLE teste.employees (
    id character varying(50) NOT NULL,
    company_number integer,
    register_number integer,
    registration_number integer,
    person_id character varying(50),
    person_name character varying(255),
    hire_date date,
    dismissal_date date,
    hash character varying(64),
    employer_id character varying(50),
    department_id character varying(50),
    job_position_id character varying(50),
    workstation_group_id character varying(50),
    workshift_id character varying(50),
    cost_center_id character varying(50),
    synced_at timestamp without time zone DEFAULT now()
);


ALTER TABLE teste.employees OWNER TO "ADM";

--
-- TOC entry 1470 (class 1259 OID 7808674)
-- Name: employers; Type: TABLE; Schema: teste; Owner: ADM
--

CREATE TABLE teste.employers (
    id character varying(50) NOT NULL,
    trading_name character varying(255)
);


ALTER TABLE teste.employers OWNER TO "ADM";

--
-- TOC entry 1493 (class 1259 OID 7809375)
-- Name: forms; Type: TABLE; Schema: teste; Owner: ADM
--

CREATE TABLE teste.forms (
    id bigint NOT NULL,
    section_id bigint NOT NULL,
    nome character varying(100) NOT NULL,
    descricao text,
    status smallint DEFAULT 1 NOT NULL,
    data_criacao timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    data_alteracao timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT check_nome_forms CHECK ((length(TRIM(BOTH FROM nome)) > 0)),
    CONSTRAINT check_status_forms CHECK ((status = ANY (ARRAY[0, 1])))
);


ALTER TABLE teste.forms OWNER TO "ADM";

--
-- TOC entry 1492 (class 1259 OID 7809374)
-- Name: forms_id_seq; Type: SEQUENCE; Schema: teste; Owner: ADM
--

CREATE SEQUENCE teste.forms_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE teste.forms_id_seq OWNER TO "ADM";

--
-- TOC entry 7650 (class 0 OID 0)
-- Dependencies: 1492
-- Name: forms_id_seq; Type: SEQUENCE OWNED BY; Schema: teste; Owner: ADM
--

ALTER SEQUENCE teste.forms_id_seq OWNED BY teste.forms.id;


--
-- TOC entry 1472 (class 1259 OID 7808684)
-- Name: job_positions; Type: TABLE; Schema: teste; Owner: ADM
--

CREATE TABLE teste.job_positions (
    id character varying(50) NOT NULL,
    name character varying(255)
);


ALTER TABLE teste.job_positions OWNER TO "ADM";

--
-- TOC entry 1516 (class 1259 OID 7812270)
-- Name: limits_answers; Type: TABLE; Schema: teste; Owner: ADM
--

CREATE TABLE teste.limits_answers (
    id bigint NOT NULL,
    answer_id bigint NOT NULL,
    limit_max numeric(19,4),
    limit_min numeric(19,4),
    status smallint DEFAULT 1 NOT NULL,
    data_criacao timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    data_alteracao timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT check_limit_max_limits_answers CHECK ((limit_max > (0)::numeric)),
    CONSTRAINT check_limit_min_limits_answers CHECK ((limit_min > (0)::numeric)),
    CONSTRAINT check_status_limits_answers CHECK ((status = ANY (ARRAY[0, 1])))
);


ALTER TABLE teste.limits_answers OWNER TO "ADM";

--
-- TOC entry 1515 (class 1259 OID 7812269)
-- Name: limits_answers_id_seq; Type: SEQUENCE; Schema: teste; Owner: ADM
--

CREATE SEQUENCE teste.limits_answers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE teste.limits_answers_id_seq OWNER TO "ADM";

--
-- TOC entry 7651 (class 0 OID 0)
-- Dependencies: 1515
-- Name: limits_answers_id_seq; Type: SEQUENCE OWNED BY; Schema: teste; Owner: ADM
--

ALTER SEQUENCE teste.limits_answers_id_seq OWNED BY teste.limits_answers.id;


--
-- TOC entry 1511 (class 1259 OID 7810854)
-- Name: locations; Type: TABLE; Schema: teste; Owner: ADM
--

CREATE TABLE teste.locations (
    id bigint NOT NULL,
    employer_id character varying(50) NOT NULL,
    nome character varying(100) NOT NULL,
    descricao text,
    status smallint DEFAULT 1 NOT NULL,
    data_criacao timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    data_alteracao timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT check_nome_locations CHECK ((length(TRIM(BOTH FROM nome)) > 0)),
    CONSTRAINT check_status_locations CHECK ((status = ANY (ARRAY[0, 1])))
);


ALTER TABLE teste.locations OWNER TO "ADM";

--
-- TOC entry 1510 (class 1259 OID 7810853)
-- Name: locations_id_seq; Type: SEQUENCE; Schema: teste; Owner: ADM
--

CREATE SEQUENCE teste.locations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE teste.locations_id_seq OWNER TO "ADM";

--
-- TOC entry 7652 (class 0 OID 0)
-- Dependencies: 1510
-- Name: locations_id_seq; Type: SEQUENCE OWNED BY; Schema: teste; Owner: ADM
--

ALTER SEQUENCE teste.locations_id_seq OWNED BY teste.locations.id;


--
-- TOC entry 1522 (class 1259 OID 7813814)
-- Name: machine_answer_result; Type: TABLE; Schema: teste; Owner: ADM
--

CREATE TABLE teste.machine_answer_result (
    id bigint NOT NULL,
    machine_answer_id bigint NOT NULL,
    resposta text
);


ALTER TABLE teste.machine_answer_result OWNER TO "ADM";

--
-- TOC entry 1521 (class 1259 OID 7813813)
-- Name: machine_answer_result_id_seq; Type: SEQUENCE; Schema: teste; Owner: ADM
--

CREATE SEQUENCE teste.machine_answer_result_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE teste.machine_answer_result_id_seq OWNER TO "ADM";

--
-- TOC entry 7653 (class 0 OID 0)
-- Dependencies: 1521
-- Name: machine_answer_result_id_seq; Type: SEQUENCE OWNED BY; Schema: teste; Owner: ADM
--

ALTER SEQUENCE teste.machine_answer_result_id_seq OWNED BY teste.machine_answer_result.id;


--
-- TOC entry 1520 (class 1259 OID 7813789)
-- Name: machine_answers; Type: TABLE; Schema: teste; Owner: ADM
--

CREATE TABLE teste.machine_answers (
    id bigint NOT NULL,
    machine_id bigint NOT NULL,
    nome character varying(100),
    descricao text,
    status smallint DEFAULT 1 NOT NULL,
    data_criacao timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    data_alteracao timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT check_nome_machine_answers CHECK ((length(TRIM(BOTH FROM nome)) > 0)),
    CONSTRAINT check_status_machine_answers CHECK ((status = ANY (ARRAY[0, 1])))
);


ALTER TABLE teste.machine_answers OWNER TO "ADM";

--
-- TOC entry 1519 (class 1259 OID 7813788)
-- Name: machine_answers_id_seq; Type: SEQUENCE; Schema: teste; Owner: ADM
--

CREATE SEQUENCE teste.machine_answers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE teste.machine_answers_id_seq OWNER TO "ADM";

--
-- TOC entry 7654 (class 0 OID 0)
-- Dependencies: 1519
-- Name: machine_answers_id_seq; Type: SEQUENCE OWNED BY; Schema: teste; Owner: ADM
--

ALTER SEQUENCE teste.machine_answers_id_seq OWNED BY teste.machine_answers.id;


--
-- TOC entry 1497 (class 1259 OID 7809411)
-- Name: machines; Type: TABLE; Schema: teste; Owner: ADM
--

CREATE TABLE teste.machines (
    id bigint NOT NULL,
    form_id bigint NOT NULL,
    nome character varying(100) NOT NULL,
    descricao text,
    status smallint DEFAULT 1 NOT NULL,
    data_criacao timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    data_alteracao timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT check_nome_machines CHECK ((length(TRIM(BOTH FROM nome)) > 0)),
    CONSTRAINT check_status_machines CHECK ((status = ANY (ARRAY[0, 1])))
);


ALTER TABLE teste.machines OWNER TO "ADM";

--
-- TOC entry 1496 (class 1259 OID 7809410)
-- Name: machines_id_seq; Type: SEQUENCE; Schema: teste; Owner: ADM
--

CREATE SEQUENCE teste.machines_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE teste.machines_id_seq OWNER TO "ADM";

--
-- TOC entry 7655 (class 0 OID 0)
-- Dependencies: 1496
-- Name: machines_id_seq; Type: SEQUENCE OWNED BY; Schema: teste; Owner: ADM
--

ALTER SEQUENCE teste.machines_id_seq OWNED BY teste.machines.id;


--
-- TOC entry 1503 (class 1259 OID 7809547)
-- Name: roles; Type: TABLE; Schema: teste; Owner: ADM
--

CREATE TABLE teste.roles (
    id bigint NOT NULL,
    system_id bigint NOT NULL,
    nome character varying(100) NOT NULL,
    descricao text,
    status smallint DEFAULT 1 NOT NULL,
    data_criacao timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    data_alteracao timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT check_nome_roles CHECK ((length(TRIM(BOTH FROM nome)) > 0)),
    CONSTRAINT check_status_roles CHECK ((status = ANY (ARRAY[0, 1])))
);


ALTER TABLE teste.roles OWNER TO "ADM";

--
-- TOC entry 1502 (class 1259 OID 7809546)
-- Name: roles_id_seq; Type: SEQUENCE; Schema: teste; Owner: ADM
--

CREATE SEQUENCE teste.roles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE teste.roles_id_seq OWNER TO "ADM";

--
-- TOC entry 7656 (class 0 OID 0)
-- Dependencies: 1502
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: teste; Owner: ADM
--

ALTER SEQUENCE teste.roles_id_seq OWNED BY teste.roles.id;


--
-- TOC entry 1491 (class 1259 OID 7809344)
-- Name: sections; Type: TABLE; Schema: teste; Owner: ADM
--

CREATE TABLE teste.sections (
    id bigint NOT NULL,
    employer_id character varying(50) NOT NULL,
    nome character varying(100) NOT NULL,
    descricao text,
    status smallint DEFAULT 1 NOT NULL,
    data_criacao timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    data_alteracao timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT check_nome_sections CHECK ((length(TRIM(BOTH FROM nome)) > 0)),
    CONSTRAINT check_status_sections CHECK ((status = ANY (ARRAY[0, 1])))
);


ALTER TABLE teste.sections OWNER TO "ADM";

--
-- TOC entry 1490 (class 1259 OID 7809343)
-- Name: section_id_seq; Type: SEQUENCE; Schema: teste; Owner: ADM
--

CREATE SEQUENCE teste.section_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE teste.section_id_seq OWNER TO "ADM";

--
-- TOC entry 7657 (class 0 OID 0)
-- Dependencies: 1490
-- Name: section_id_seq; Type: SEQUENCE OWNED BY; Schema: teste; Owner: ADM
--

ALTER SEQUENCE teste.section_id_seq OWNED BY teste.sections.id;


--
-- TOC entry 1489 (class 1259 OID 7809152)
-- Name: sessions; Type: TABLE; Schema: teste; Owner: ADM
--

CREATE TABLE teste.sessions (
    id bigint NOT NULL,
    credential_id bigint NOT NULL,
    refreshtoken text NOT NULL,
    expira timestamp with time zone NOT NULL,
    revogado boolean DEFAULT false NOT NULL,
    data_criacao timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    data_alteracao timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE teste.sessions OWNER TO "ADM";

--
-- TOC entry 1488 (class 1259 OID 7809151)
-- Name: sessions_credential_id_seq; Type: SEQUENCE; Schema: teste; Owner: ADM
--

CREATE SEQUENCE teste.sessions_credential_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE teste.sessions_credential_id_seq OWNER TO "ADM";

--
-- TOC entry 7658 (class 0 OID 0)
-- Dependencies: 1488
-- Name: sessions_credential_id_seq; Type: SEQUENCE OWNED BY; Schema: teste; Owner: ADM
--

ALTER SEQUENCE teste.sessions_credential_id_seq OWNED BY teste.sessions.credential_id;


--
-- TOC entry 1487 (class 1259 OID 7809150)
-- Name: sessions_id_seq; Type: SEQUENCE; Schema: teste; Owner: ADM
--

CREATE SEQUENCE teste.sessions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE teste.sessions_id_seq OWNER TO "ADM";

--
-- TOC entry 7659 (class 0 OID 0)
-- Dependencies: 1487
-- Name: sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: teste; Owner: ADM
--

ALTER SEQUENCE teste.sessions_id_seq OWNED BY teste.sessions.id;


--
-- TOC entry 1478 (class 1259 OID 7808713)
-- Name: sync_logs; Type: TABLE; Schema: teste; Owner: ADM
--

CREATE TABLE teste.sync_logs (
    id bigint NOT NULL,
    started_at timestamp without time zone NOT NULL,
    finished_at timestamp without time zone NOT NULL,
    duration_ms bigint NOT NULL,
    inserted integer NOT NULL,
    updated integer NOT NULL,
    removed integer NOT NULL,
    total_api integer NOT NULL,
    total_before integer NOT NULL,
    success boolean NOT NULL,
    error text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE teste.sync_logs OWNER TO "ADM";

--
-- TOC entry 1477 (class 1259 OID 7808712)
-- Name: sync_logs_id_seq; Type: SEQUENCE; Schema: teste; Owner: ADM
--

CREATE SEQUENCE teste.sync_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE teste.sync_logs_id_seq OWNER TO "ADM";

--
-- TOC entry 7660 (class 0 OID 0)
-- Dependencies: 1477
-- Name: sync_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: teste; Owner: ADM
--

ALTER SEQUENCE teste.sync_logs_id_seq OWNED BY teste.sync_logs.id;


--
-- TOC entry 1482 (class 1259 OID 7809109)
-- Name: systems; Type: TABLE; Schema: teste; Owner: ADM
--

CREATE TABLE teste.systems (
    id bigint NOT NULL,
    nome character varying(100) NOT NULL,
    descricao text,
    url character varying(50),
    status smallint DEFAULT 1 NOT NULL,
    data_criacao timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    data_alteracao timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT check_nome_systems CHECK ((length(TRIM(BOTH FROM nome)) > 0)),
    CONSTRAINT check_status_systems CHECK ((status = ANY (ARRAY[0, 1])))
);


ALTER TABLE teste.systems OWNER TO "ADM";

--
-- TOC entry 1481 (class 1259 OID 7809108)
-- Name: systems_id_seq; Type: SEQUENCE; Schema: teste; Owner: ADM
--

CREATE SEQUENCE teste.systems_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE teste.systems_id_seq OWNER TO "ADM";

--
-- TOC entry 7661 (class 0 OID 0)
-- Dependencies: 1481
-- Name: systems_id_seq; Type: SEQUENCE OWNED BY; Schema: teste; Owner: ADM
--

ALTER SEQUENCE teste.systems_id_seq OWNED BY teste.systems.id;


--
-- TOC entry 1480 (class 1259 OID 7808998)
-- Name: users; Type: TABLE; Schema: teste; Owner: ADM
--

CREATE TABLE teste.users (
    id bigint NOT NULL,
    employee_id character varying(50) NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(50) NOT NULL,
    status smallint DEFAULT 1 NOT NULL,
    data_criacao timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    data_alteracao timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT check_email_users CHECK ((length(TRIM(BOTH FROM email)) > 0)),
    CONSTRAINT check_status_users CHECK ((status = ANY (ARRAY[0, 1]))),
    CONSTRAINT check_username_users CHECK ((length(TRIM(BOTH FROM username)) > 0))
);


ALTER TABLE teste.users OWNER TO "ADM";

--
-- TOC entry 1479 (class 1259 OID 7808997)
-- Name: users_id_seq; Type: SEQUENCE; Schema: teste; Owner: ADM
--

CREATE SEQUENCE teste.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE teste.users_id_seq OWNER TO "ADM";

--
-- TOC entry 7662 (class 0 OID 0)
-- Dependencies: 1479
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: teste; Owner: ADM
--

ALTER SEQUENCE teste.users_id_seq OWNED BY teste.users.id;


--
-- TOC entry 1475 (class 1259 OID 7808699)
-- Name: workshifts; Type: TABLE; Schema: teste; Owner: ADM
--

CREATE TABLE teste.workshifts (
    id character varying(50) NOT NULL,
    description character varying(255)
);


ALTER TABLE teste.workshifts OWNER TO "ADM";

--
-- TOC entry 1474 (class 1259 OID 7808694)
-- Name: workstation_groups; Type: TABLE; Schema: teste; Owner: ADM
--

CREATE TABLE teste.workstation_groups (
    id character varying(50) NOT NULL,
    name character varying(255)
);


ALTER TABLE teste.workstation_groups OWNER TO "ADM";

--
-- TOC entry 7054 (class 2604 OID 7813760)
-- Name: answer_result id; Type: DEFAULT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.answer_result ALTER COLUMN id SET DEFAULT nextval('teste.answer_result_id_seq'::regclass);


--
-- TOC entry 7030 (class 2604 OID 7809397)
-- Name: answers id; Type: DEFAULT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.answers ALTER COLUMN id SET DEFAULT nextval('teste.answers_id_seq'::regclass);


--
-- TOC entry 7060 (class 2604 OID 7813873)
-- Name: breaks_forms id; Type: DEFAULT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.breaks_forms ALTER COLUMN id SET DEFAULT nextval('teste.breaks_forms_id_seq'::regclass);


--
-- TOC entry 7064 (class 2604 OID 7813893)
-- Name: breaks_machines id; Type: DEFAULT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.breaks_machines ALTER COLUMN id SET DEFAULT nextval('teste.breaks_machines_id_seq'::regclass);


--
-- TOC entry 7046 (class 2604 OID 7812204)
-- Name: categories_answers id; Type: DEFAULT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.categories_answers ALTER COLUMN id SET DEFAULT nextval('teste.categories_answers_id_seq'::regclass);


--
-- TOC entry 7068 (class 2604 OID 7814112)
-- Name: controls id; Type: DEFAULT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.controls ALTER COLUMN id SET DEFAULT nextval('teste.controls_id_seq'::regclass);


--
-- TOC entry 7010 (class 2604 OID 7809130)
-- Name: credentials id; Type: DEFAULT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.credentials ALTER COLUMN id SET DEFAULT nextval('teste.credentials_id_seq'::regclass);


--
-- TOC entry 7011 (class 2604 OID 7809131)
-- Name: credentials user_id; Type: DEFAULT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.credentials ALTER COLUMN user_id SET DEFAULT nextval('teste.credentials_user_id_seq'::regclass);


--
-- TOC entry 7012 (class 2604 OID 7809132)
-- Name: credentials system_id; Type: DEFAULT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.credentials ALTER COLUMN system_id SET DEFAULT nextval('teste.credentials_system_id_seq'::regclass);


--
-- TOC entry 7026 (class 2604 OID 7809378)
-- Name: forms id; Type: DEFAULT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.forms ALTER COLUMN id SET DEFAULT nextval('teste.forms_id_seq'::regclass);


--
-- TOC entry 7050 (class 2604 OID 7812273)
-- Name: limits_answers id; Type: DEFAULT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.limits_answers ALTER COLUMN id SET DEFAULT nextval('teste.limits_answers_id_seq'::regclass);


--
-- TOC entry 7042 (class 2604 OID 7810857)
-- Name: locations id; Type: DEFAULT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.locations ALTER COLUMN id SET DEFAULT nextval('teste.locations_id_seq'::regclass);


--
-- TOC entry 7059 (class 2604 OID 7813817)
-- Name: machine_answer_result id; Type: DEFAULT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.machine_answer_result ALTER COLUMN id SET DEFAULT nextval('teste.machine_answer_result_id_seq'::regclass);


--
-- TOC entry 7055 (class 2604 OID 7813792)
-- Name: machine_answers id; Type: DEFAULT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.machine_answers ALTER COLUMN id SET DEFAULT nextval('teste.machine_answers_id_seq'::regclass);


--
-- TOC entry 7034 (class 2604 OID 7809414)
-- Name: machines id; Type: DEFAULT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.machines ALTER COLUMN id SET DEFAULT nextval('teste.machines_id_seq'::regclass);


--
-- TOC entry 7038 (class 2604 OID 7809550)
-- Name: roles id; Type: DEFAULT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.roles ALTER COLUMN id SET DEFAULT nextval('teste.roles_id_seq'::regclass);


--
-- TOC entry 7022 (class 2604 OID 7809347)
-- Name: sections id; Type: DEFAULT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.sections ALTER COLUMN id SET DEFAULT nextval('teste.section_id_seq'::regclass);


--
-- TOC entry 7017 (class 2604 OID 7809155)
-- Name: sessions id; Type: DEFAULT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.sessions ALTER COLUMN id SET DEFAULT nextval('teste.sessions_id_seq'::regclass);


--
-- TOC entry 7018 (class 2604 OID 7809156)
-- Name: sessions credential_id; Type: DEFAULT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.sessions ALTER COLUMN credential_id SET DEFAULT nextval('teste.sessions_credential_id_seq'::regclass);


--
-- TOC entry 7000 (class 2604 OID 7808716)
-- Name: sync_logs id; Type: DEFAULT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.sync_logs ALTER COLUMN id SET DEFAULT nextval('teste.sync_logs_id_seq'::regclass);


--
-- TOC entry 7006 (class 2604 OID 7809112)
-- Name: systems id; Type: DEFAULT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.systems ALTER COLUMN id SET DEFAULT nextval('teste.systems_id_seq'::regclass);


--
-- TOC entry 7002 (class 2604 OID 7809001)
-- Name: users id; Type: DEFAULT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.users ALTER COLUMN id SET DEFAULT nextval('teste.users_id_seq'::regclass);


--
-- TOC entry 7166 (class 2606 OID 7813764)
-- Name: answer_result answer_result_pkey; Type: CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.answer_result
    ADD CONSTRAINT answer_result_pkey PRIMARY KEY (id);


--
-- TOC entry 7138 (class 2606 OID 7809404)
-- Name: answers answers_pkey; Type: CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.answers
    ADD CONSTRAINT answers_pkey PRIMARY KEY (id);


--
-- TOC entry 7178 (class 2606 OID 7813881)
-- Name: breaks_forms breaks_forms_pkey; Type: CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.breaks_forms
    ADD CONSTRAINT breaks_forms_pkey PRIMARY KEY (id);


--
-- TOC entry 7182 (class 2606 OID 7813901)
-- Name: breaks_machines breaks_machines_pkey; Type: CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.breaks_machines
    ADD CONSTRAINT breaks_machines_pkey PRIMARY KEY (id);


--
-- TOC entry 7158 (class 2606 OID 7812213)
-- Name: categories_answers categories_answers_pkey; Type: CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.categories_answers
    ADD CONSTRAINT categories_answers_pkey PRIMARY KEY (id);


--
-- TOC entry 7186 (class 2606 OID 7814119)
-- Name: controls controls_pkey; Type: CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.controls
    ADD CONSTRAINT controls_pkey PRIMARY KEY (id);


--
-- TOC entry 7106 (class 2606 OID 7808693)
-- Name: cost_centers cost_centers_pkey; Type: CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.cost_centers
    ADD CONSTRAINT cost_centers_pkey PRIMARY KEY (id);


--
-- TOC entry 7126 (class 2606 OID 7809139)
-- Name: credentials credentials_pkey; Type: CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.credentials
    ADD CONSTRAINT credentials_pkey PRIMARY KEY (id);


--
-- TOC entry 7150 (class 2606 OID 7809578)
-- Name: credentials_roles credentials_roles_pkey; Type: CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.credentials_roles
    ADD CONSTRAINT credentials_roles_pkey PRIMARY KEY (credential_id, role_id);


--
-- TOC entry 7102 (class 2606 OID 7808683)
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- TOC entry 7112 (class 2606 OID 7808711)
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- TOC entry 7100 (class 2606 OID 7808678)
-- Name: employers employers_pkey; Type: CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.employers
    ADD CONSTRAINT employers_pkey PRIMARY KEY (id);


--
-- TOC entry 7134 (class 2606 OID 7809385)
-- Name: forms forms_pkey; Type: CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.forms
    ADD CONSTRAINT forms_pkey PRIMARY KEY (id);


--
-- TOC entry 7104 (class 2606 OID 7808688)
-- Name: job_positions job_positions_pkey; Type: CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.job_positions
    ADD CONSTRAINT job_positions_pkey PRIMARY KEY (id);


--
-- TOC entry 7162 (class 2606 OID 7812281)
-- Name: limits_answers limits_answers_pkey; Type: CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.limits_answers
    ADD CONSTRAINT limits_answers_pkey PRIMARY KEY (id);


--
-- TOC entry 7152 (class 2606 OID 7810892)
-- Name: locations locations_employer_id_key; Type: CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.locations
    ADD CONSTRAINT locations_employer_id_key UNIQUE (employer_id);


--
-- TOC entry 7154 (class 2606 OID 7810866)
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- TOC entry 7174 (class 2606 OID 7813821)
-- Name: machine_answer_result machine_answer_result_pkey; Type: CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.machine_answer_result
    ADD CONSTRAINT machine_answer_result_pkey PRIMARY KEY (id);


--
-- TOC entry 7170 (class 2606 OID 7813801)
-- Name: machine_answers machine_answers_pkey; Type: CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.machine_answers
    ADD CONSTRAINT machine_answers_pkey PRIMARY KEY (id);


--
-- TOC entry 7142 (class 2606 OID 7809421)
-- Name: machines machines_pkey; Type: CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.machines
    ADD CONSTRAINT machines_pkey PRIMARY KEY (id);


--
-- TOC entry 7146 (class 2606 OID 7809559)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 7130 (class 2606 OID 7809354)
-- Name: sections section_pkey; Type: CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.sections
    ADD CONSTRAINT section_pkey PRIMARY KEY (id);


--
-- TOC entry 7128 (class 2606 OID 7809163)
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 7114 (class 2606 OID 7808721)
-- Name: sync_logs sync_logs_pkey; Type: CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.sync_logs
    ADD CONSTRAINT sync_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 7122 (class 2606 OID 7809121)
-- Name: systems systems_pkey; Type: CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.systems
    ADD CONSTRAINT systems_pkey PRIMARY KEY (id);


--
-- TOC entry 7164 (class 2606 OID 7812283)
-- Name: limits_answers unique_answer_id_limits_answers; Type: CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.limits_answers
    ADD CONSTRAINT unique_answer_id_limits_answers UNIQUE (answer_id);


--
-- TOC entry 7168 (class 2606 OID 7813766)
-- Name: answer_result unique_answerid_answer_result; Type: CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.answer_result
    ADD CONSTRAINT unique_answerid_answer_result UNIQUE (answer_id);


--
-- TOC entry 7116 (class 2606 OID 7809536)
-- Name: users unique_email_employee_users; Type: CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.users
    ADD CONSTRAINT unique_email_employee_users UNIQUE (email, employee_id);


--
-- TOC entry 7188 (class 2606 OID 7814121)
-- Name: controls unique_form_user_controls; Type: CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.controls
    ADD CONSTRAINT unique_form_user_controls UNIQUE (form_id, user_id);


--
-- TOC entry 7180 (class 2606 OID 7813883)
-- Name: breaks_forms unique_formid_breaks_forms; Type: CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.breaks_forms
    ADD CONSTRAINT unique_formid_breaks_forms UNIQUE (form_id);


--
-- TOC entry 7176 (class 2606 OID 7813823)
-- Name: machine_answer_result unique_machineanswerid_machine_answer_result; Type: CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.machine_answer_result
    ADD CONSTRAINT unique_machineanswerid_machine_answer_result UNIQUE (machine_answer_id);


--
-- TOC entry 7184 (class 2606 OID 7813903)
-- Name: breaks_machines unique_machineid_breaks_machines; Type: CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.breaks_machines
    ADD CONSTRAINT unique_machineid_breaks_machines UNIQUE (machine_id);


--
-- TOC entry 7160 (class 2606 OID 7812215)
-- Name: categories_answers unique_nome_categories_answers; Type: CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.categories_answers
    ADD CONSTRAINT unique_nome_categories_answers UNIQUE (nome);


--
-- TOC entry 7156 (class 2606 OID 7810868)
-- Name: locations unique_nome_employer_locations; Type: CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.locations
    ADD CONSTRAINT unique_nome_employer_locations UNIQUE (nome, employer_id);


--
-- TOC entry 7132 (class 2606 OID 7809528)
-- Name: sections unique_nome_employer_sections; Type: CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.sections
    ADD CONSTRAINT unique_nome_employer_sections UNIQUE (nome, employer_id);


--
-- TOC entry 7140 (class 2606 OID 7809520)
-- Name: answers unique_nome_form_answers; Type: CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.answers
    ADD CONSTRAINT unique_nome_form_answers UNIQUE (nome, form_id);


--
-- TOC entry 7144 (class 2606 OID 7809526)
-- Name: machines unique_nome_form_machines; Type: CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.machines
    ADD CONSTRAINT unique_nome_form_machines UNIQUE (nome, form_id);


--
-- TOC entry 7172 (class 2606 OID 7813803)
-- Name: machine_answers unique_nome_machineid_machine_answers; Type: CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.machine_answers
    ADD CONSTRAINT unique_nome_machineid_machine_answers UNIQUE (nome, machine_id);


--
-- TOC entry 7136 (class 2606 OID 7809522)
-- Name: forms unique_nome_section_forms; Type: CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.forms
    ADD CONSTRAINT unique_nome_section_forms UNIQUE (nome, section_id);


--
-- TOC entry 7148 (class 2606 OID 7809561)
-- Name: roles unique_nome_system_roles; Type: CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.roles
    ADD CONSTRAINT unique_nome_system_roles UNIQUE (nome, system_id);


--
-- TOC entry 7124 (class 2606 OID 7809123)
-- Name: systems unique_nome_systems; Type: CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.systems
    ADD CONSTRAINT unique_nome_systems UNIQUE (nome);


--
-- TOC entry 7118 (class 2606 OID 7809538)
-- Name: users unique_username_employee_users; Type: CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.users
    ADD CONSTRAINT unique_username_employee_users UNIQUE (username, employee_id);


--
-- TOC entry 7120 (class 2606 OID 7809009)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 7110 (class 2606 OID 7808703)
-- Name: workshifts workshifts_pkey; Type: CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.workshifts
    ADD CONSTRAINT workshifts_pkey PRIMARY KEY (id);


--
-- TOC entry 7108 (class 2606 OID 7808698)
-- Name: workstation_groups workstation_groups_pkey; Type: CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.workstation_groups
    ADD CONSTRAINT workstation_groups_pkey PRIMARY KEY (id);


--
-- TOC entry 7209 (class 2620 OID 7814041)
-- Name: employees trg_inativar_usuario_apos_exclusao_employee; Type: TRIGGER; Schema: teste; Owner: ADM
--

CREATE TRIGGER trg_inativar_usuario_apos_exclusao_employee AFTER DELETE ON teste.employees FOR EACH ROW EXECUTE FUNCTION teste.fn_inativar_usuario_apos_exclusao_employee();


--
-- TOC entry 7202 (class 2606 OID 7813767)
-- Name: answer_result answers_fkey; Type: FK CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.answer_result
    ADD CONSTRAINT answers_fkey FOREIGN KEY (answer_id) REFERENCES teste.answers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 7201 (class 2606 OID 7812284)
-- Name: limits_answers answers_fkey; Type: FK CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.limits_answers
    ADD CONSTRAINT answers_fkey FOREIGN KEY (answer_id) REFERENCES teste.answers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 7194 (class 2606 OID 7812243)
-- Name: answers categories_answers_fkey; Type: FK CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.answers
    ADD CONSTRAINT categories_answers_fkey FOREIGN KEY (categorie_id) REFERENCES teste.categories_answers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 7198 (class 2606 OID 7809579)
-- Name: credentials_roles credentials_fkey; Type: FK CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.credentials_roles
    ADD CONSTRAINT credentials_fkey FOREIGN KEY (credential_id) REFERENCES teste.credentials(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 7191 (class 2606 OID 7809164)
-- Name: sessions credentials_fkey; Type: FK CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.sessions
    ADD CONSTRAINT credentials_fkey FOREIGN KEY (credential_id) REFERENCES teste.credentials(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 7200 (class 2606 OID 7810869)
-- Name: locations employers_fkey; Type: FK CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.locations
    ADD CONSTRAINT employers_fkey FOREIGN KEY (employer_id) REFERENCES teste.employers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 7192 (class 2606 OID 7809355)
-- Name: sections employers_fkey; Type: FK CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.sections
    ADD CONSTRAINT employers_fkey FOREIGN KEY (employer_id) REFERENCES teste.employers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 7195 (class 2606 OID 7809405)
-- Name: answers forms_fkey; Type: FK CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.answers
    ADD CONSTRAINT forms_fkey FOREIGN KEY (form_id) REFERENCES teste.forms(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 7205 (class 2606 OID 7813884)
-- Name: breaks_forms forms_fkey; Type: FK CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.breaks_forms
    ADD CONSTRAINT forms_fkey FOREIGN KEY (form_id) REFERENCES teste.forms(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 7207 (class 2606 OID 7814122)
-- Name: controls forms_fkey; Type: FK CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.controls
    ADD CONSTRAINT forms_fkey FOREIGN KEY (form_id) REFERENCES teste.forms(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 7196 (class 2606 OID 7809422)
-- Name: machines forms_fkey; Type: FK CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.machines
    ADD CONSTRAINT forms_fkey FOREIGN KEY (form_id) REFERENCES teste.forms(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 7204 (class 2606 OID 7813824)
-- Name: machine_answer_result machine_answers_fkey; Type: FK CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.machine_answer_result
    ADD CONSTRAINT machine_answers_fkey FOREIGN KEY (machine_answer_id) REFERENCES teste.machine_answers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 7206 (class 2606 OID 7813904)
-- Name: breaks_machines machines_fkey; Type: FK CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.breaks_machines
    ADD CONSTRAINT machines_fkey FOREIGN KEY (machine_id) REFERENCES teste.machines(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 7203 (class 2606 OID 7813804)
-- Name: machine_answers machines_fkey; Type: FK CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.machine_answers
    ADD CONSTRAINT machines_fkey FOREIGN KEY (machine_id) REFERENCES teste.machines(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 7199 (class 2606 OID 7809584)
-- Name: credentials_roles roles_fkey; Type: FK CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.credentials_roles
    ADD CONSTRAINT roles_fkey FOREIGN KEY (role_id) REFERENCES teste.roles(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 7193 (class 2606 OID 7809386)
-- Name: forms section_fkey; Type: FK CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.forms
    ADD CONSTRAINT section_fkey FOREIGN KEY (section_id) REFERENCES teste.sections(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 7189 (class 2606 OID 7809145)
-- Name: credentials systems_fkey; Type: FK CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.credentials
    ADD CONSTRAINT systems_fkey FOREIGN KEY (system_id) REFERENCES teste.systems(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 7197 (class 2606 OID 7809562)
-- Name: roles systems_fkey; Type: FK CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.roles
    ADD CONSTRAINT systems_fkey FOREIGN KEY (system_id) REFERENCES teste.systems(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 7208 (class 2606 OID 7814127)
-- Name: controls users_fkey; Type: FK CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.controls
    ADD CONSTRAINT users_fkey FOREIGN KEY (user_id) REFERENCES teste.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 7190 (class 2606 OID 7809140)
-- Name: credentials users_fkey; Type: FK CONSTRAINT; Schema: teste; Owner: ADM
--

ALTER TABLE ONLY teste.credentials
    ADD CONSTRAINT users_fkey FOREIGN KEY (user_id) REFERENCES teste.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


INSERT INTO TESTE.USERS
SELECT
	(ROW_NUMBER() OVER (ORDER BY id) + 3)::bigint AS ID,
	ID::varchar(50) AS EMPLOYEE_ID,
	LOWER(REPLACE(PERSON_NAME, ' ', '.'))::varchar(50) AS USERNAME,
	(LOWER(REPLACE(PERSON_NAME, ' ', '.')) || '@pirahy.ind.br')::varchar(50) AS EMAIL,
	1::smallint AS STATUS,
	NOW()::timestamp with time zone AS DATA_CRIACAO,
	NOW()::timestamp with time zone AS DATA_ALTERACAO
FROM
	TESTE.EMPLOYEES E
WHERE
	NOT EXISTS (
		SELECT
			*
		FROM
			TESTE.USERS U
		WHERE
			E.ID = U.EMPLOYEE_ID
	)


-- Completed on 2026-06-18 16:26:14

--
-- PostgreSQL database dump complete
--

\unrestrict FjKOeCpdWFFephdW7pj5aDlsPD2QXS8nbi4QPWS1D5MvZQ6WT25rgWWdZ9vFjUn

