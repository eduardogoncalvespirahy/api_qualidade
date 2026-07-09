import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const DV_URL =
  "https://platform.senior.com.br/t/senior.com.br/bridge/1.0/rest/platform/dynamicviews/queries/executeDynamicView";

export class SeniorRepository {
  private token?: string;

  async authenticate() {
    const { data } = await axios.post(
      "https://platform.senior.com.br/t/senior.com.br/bridge/1.0/anonymous/rest/platform/authentication/actions/loginWithKey",
      {
        accessKey: process.env.SENIOR_ACCESS_KEY,
        secret: process.env.SENIOR_SECRET,
        tenantName: process.env.SENIOR_TENANT,
      },
    );

    this.token = JSON.parse(data.jsonToken).access_token;
  }

  /** Garante e retorna o access_token da plataforma. */
  async getToken(): Promise<string> {
    if (!this.token) {
      await this.authenticate();
    }
    return this.token as string;
  }

  private headers() {
    return {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
      "x-user-timezone-offset": "-180",
    };
  }

  async getEmployees() {
    if (!this.token) {
      await this.authenticate();
    }

    const { data } = await axios.post(
      DV_URL,
      {
        view: {
          fields: [],
          id: "v_employee",
          name: "PDI",
          tags: [],
          tables: [{ schema: "hcm-report", name: "v_employee" }],
          uri: "res://pirahy.ind.br/custom/dynamicviews/v_employee",
          viewSynchronized: true,
          kind: "Generated",
          order: [
            {
              name: "hcm-report.v_employee.register_number",
              direction: "Asc",
            },
          ],
          groups: [],
          functions: [],
          joins: [],
          menuItems: [],
          overrideUserTimezone: true,
          timezoneOffset: -3,
          timeShowsSeconds: false,
          formatDecimalColumns: false,
          factory: false,
          filter: {
            column: "hcm-report.v_employee.dismissal_date",
            operator: "EMPTY",
            _discriminator: "unaryExpression",
          },
        },
        maxRows: 1000,
      },
      { headers: this.headers() },
    );

    return data.values;
  }

  async findEmployeeByRegisterNumber(registerNumber: string | number) {
    if (!this.token) {
      await this.authenticate();
    }

    const { data } = await axios.get(
      `https://platform.senior.com.br/t/senior.com.br/bridge/1.0/rest/hcm/payroll/entities/employee`,
      {
        headers: { Authorization: `Bearer ${this.token}` },
        params: { filter: `registernumber='${registerNumber}'` },
      },
    );

    const item =
      (data.contents ?? data.entities ?? data.values ?? [])[0] ?? null;
    if (!item) {
      return null;
    }

    return item;
  }

  async findAttachment(id: string | number) {
    if (!this.token) {
      await this.authenticate();
    }

    const { data } = await axios.get(
      `https://platform.senior.com.br/t/senior.com.br/bridge/1.0/rest/hcm/payroll/entities/attachment`,
      {
        headers: { Authorization: `Bearer ${this.token}` },
        params: { filter: `id='${id}'` },
      },
    );

    return data;
  }

  async findPersonById(personId: string) {
    if (!this.token) {
      await this.authenticate();
    }

    const { data } = await axios.get(
      `https://platform.senior.com.br/t/senior.com.br/bridge/1.0/rest/hcm/payroll/entities/person/${personId}`,
      {
        headers: { Authorization: `Bearer ${this.token}` },
      },
    );

    return data;
  }

  async findEmployeeAttachment(attachment: string) {
    if (!this.token) {
      await this.authenticate();
    }

    const { data } = await axios.get(
      `https://platform.senior.com.br/t/senior.com.br/bridge/1.0/rest/hcm/payroll/entities/employeeAttachment/${attachment}`,
      {
        headers: { Authorization: `Bearer ${this.token}` },
      },
    );

    return data;
  }  
}
