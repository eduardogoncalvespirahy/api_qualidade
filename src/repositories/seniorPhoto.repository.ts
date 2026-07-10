import axios from "axios";
import dotenv from "dotenv";

import { SeniorRepository } from "./senior.repository";

dotenv.config();

const PLATFORM =
  process.env.SENIOR_PLATFORM ??
  "https://platform.senior.com.br/t/senior.com.br/bridge/1.0/rest";

// serviço de payroll do HCM (dev.senior.com.br/api_publica/hcm_payroll)
const PAYROLL = `${PLATFORM}/hcm/payroll/entities`;

// API legada de anexos (retorna o link da foto na S3)
const HCM_API =
  process.env.SENIOR_HCM_API ?? "https://hcm-api.senior.com.br/hcm-api";

interface EmployeeRef {
  personId: string;
  companyNumber: string | number;
  employeeType: string | number;
  registerNumber: string | number;
}

/**
 * Busca a foto do colaborador no Senior HCM seguindo o fluxo documentado:
 *
 *   1) /payroll/entities/person   -> id da pessoa + `attachment` (id da foto)
 *   2) /payroll/entities/employee -> companynumber, employeetype, registernumber
 *   3) hcm-api/attachment/{id}    -> link da foto na Amazon S3 (200x200)
 *
 * Ref.: suporte.senior.com.br/hc/pt-br/articles/4409379854868
 *
 * Observações da própria Senior:
 *  - O passo 3 fica no HCM legado e NÃO permite customização; exige um bearer
 *    token de um usuário que TAMBÉM seja colaborador integrado ao Painel de
 *    Gestão. Se o token de integração não funcionar, informe um token de
 *    usuário-colaborador em SENIOR_HCM_USER_TOKEN.
 *  - A imagem retorna em 200x200.
 */
export class SeniorPhotoRepository {
  constructor(private readonly senior = new SeniorRepository()) {}

  async getEmployeePhotoBase64(
    registerNumber: string | number,
  ): Promise<string | null> {
    const token = await this.senior.getToken();

    // (2) localiza o colaborador pelo registerNumber (numcad) e obtém person.id
    const employee = await this.findEmployeeByRegisterNumber(
      token,
      registerNumber,
    );
    if (!employee) {
      return null;
    }

    // (1) pessoa -> id do anexo (foto)
    const attachmentId = await this.findPersonAttachmentId(
      token,
      employee.personId,
    );
    if (!attachmentId) {
      return null;
    }

    // (3) anexo -> link na S3
    const link = await this.getAttachmentLink(token, attachmentId, employee);
    if (!link) {
      return null;
    }

    // baixa a imagem e converte para base64
    return this.downloadAsBase64(link);
  }

  private async findEmployeeByRegisterNumber(
    token: string,
    registerNumber: string | number,
  ): Promise<EmployeeRef | null> {
    const { data } = await axios.get(`${PAYROLL}/employee`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { filter: `person.id='${registerNumber}'` },
    });

    console.log(`${PAYROLL}/employee` + " Resposta: ", data);

    const item =
      (data.contents ?? data.entities ?? data.values ?? [])[0] ?? null;
    if (!item) {
      return null;
    }

    return {
      personId: item.person?.id ?? item.personId ?? item.person,
      companyNumber: item.companyNumber ?? item.companynumber,
      employeeType: item.employeeType ?? item.employeetype,
      registerNumber:
        item.registerNumber ?? item.registernumber ?? registerNumber,
    };
  }

  private async findPersonAttachmentId(
    token: string,
    personId: string,
  ): Promise<string | null> {
    const { data } = await axios.get(`${PAYROLL}/person/${personId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log(`${PAYROLL}/person/${personId}` + " resposta : ", data);

    const person = data.contents?.[0] ?? data;
    return person?.attachment ?? null;
  }

  private async getAttachmentLink(
    token: string,
    attachmentId: string,
    employee: EmployeeRef,
  ): Promise<string | null> {
    // passo 3 pode exigir token de usuário-colaborador (HCM legado)
    const userToken = process.env.SENIOR_HCM_USER_TOKEN ?? token;

    try {
      const { data } = await axios.get(
        `${HCM_API}/attachment/${attachmentId}`,
        {
          headers: { Authorization: `Bearer ${userToken}` },
          params: {
            companyNumber: employee.companyNumber,
            employeeType: employee.employeeType,
            registerNumber: employee.registerNumber,
          },
        },
      );

      if (typeof data === "string") {
        return data;
      }
      return data?.url ?? data?.link ?? data?.location ?? null;
    } catch (error) {
      console.error(error);
      console.log("GET " + `${HCM_API}/attachment/${attachmentId}`);
    }

    return null;
  }

  private async downloadAsBase64(link: string): Promise<string> {
    const { data } = await axios.get<ArrayBuffer>(link, {
      responseType: "arraybuffer",
    });
    return Buffer.from(data).toString("base64");
  }
}
