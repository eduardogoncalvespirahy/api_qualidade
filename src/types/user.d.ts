declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        credentialId: string;
        roles: string[];
      };
    }
  }
}

export {};
