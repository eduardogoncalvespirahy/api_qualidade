import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export class SeniorRepository {
  private token?: string;

  async authenticate() {
    const { data } = await axios.post(
      "https://platform.senior.com.br/t/senior.com.br/bridge/1.0/anonymous/rest/platform/authentication/actions/loginWithKey",
      {
        accessKey: process.env.SENIOR_ACCESS_KEY,
        secret: process.env.SENIOR_SECRET,
        tenantName: process.env.SENIOR_TENANT
      }
    );

    this.token = JSON.parse(data.jsonToken).access_token;
  }

  async getEmployees() {
    if (!this.token) {
      await this.authenticate();
    }
    
    const { data } = await axios.post(
      "https://platform.senior.com.br/t/senior.com.br/bridge/1.0/rest/platform/dynamicviews/queries/executeDynamicView",
      {
        "view": {
          "fields": [],
          "id": "v_employee",
          "name": "PDI",
          "tags": [],
          "tables": [
            {
              "schema": "hcm-report",
              "name": "v_employee"
            }
          ],
          "uri": "res://pirahy.ind.br/custom/dynamicviews/v_employee",
          "viewSynchronized": true,
          "kind": "Generated",
          "order": [
            {
              "name": "hcm-report.v_employee.register_number",
              "direction": "Asc"
            }
          ],
          "groups": [],
          "functions": [],
          "joins": [],
          "menuItems": [],
          "overrideUserTimezone": true,
          "timezoneOffset": -3,
          "timeShowsSeconds": false,
          "formatDecimalColumns": false,
          "factory": false,
          "filter": {
            "column": "hcm-report.v_employee.dismissal_date",
            "operator": "EMPTY",
            "_discriminator": "unaryExpression"
          }
        },
        "maxRows": 7000
      },
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
          "x-user-timezone-offset": "-180"
        }
      }
    );

    return data.values;
  }
}