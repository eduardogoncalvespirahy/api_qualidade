import { FaceApiEngine, FaceEngine } from "./face.engine";
import { FaceDescriptorRepository } from "../../repositories/faceDescriptor.repository";
import { SeniorPhotoRepository } from "../../repositories/seniorPhoto.repository";

export interface FaceMatch {
  match: boolean;
  distance: number;
}

export class FaceService {
  private readonly engine: FaceEngine = new FaceApiEngine();
  private readonly repository = new FaceDescriptorRepository();
  private readonly seniorPhoto = new SeniorPhotoRepository();

  // limiar de distância: <= significa "mesma pessoa". 0.5 é um bom ponto de partida.
  private readonly threshold = Number(process.env.FACE_MATCH_THRESHOLD ?? 0.5);

  private decodeImage(input: string | Buffer): Buffer {
    if (Buffer.isBuffer(input)) {
      return input;
    }
    // aceita data URL ("data:image/png;base64,....") ou base64 puro
    const base64 = input.includes(",") ? input.split(",")[1] : input;
    return Buffer.from(base64, "base64");
  }

  /** Cadastra o rosto do usuário a partir da foto vinda do Senior. */
  async enrollFromSenior(userId: string, registerNumber: string): Promise<void> {
    const base64 = await this.seniorPhoto.getEmployeePhotoBase64(registerNumber);
    if (!base64) {
      throw new Error("Foto do funcionário não encontrada no Senior");
    }
    const descriptor = await this.engine.computeDescriptor(this.decodeImage(base64));
    if (!descriptor) {
      throw new Error("Nenhum rosto detectado na foto do Senior");
    }
    await this.repository.upsert(userId, descriptor);
  }

  /** Cadastra o rosto a partir de uma imagem fornecida diretamente. */
  async enrollFromImage(userId: string, image: string | Buffer): Promise<void> {
    const descriptor = await this.engine.computeDescriptor(this.decodeImage(image));
    if (!descriptor) {
      throw new Error("Nenhum rosto detectado na imagem");
    }
    await this.repository.upsert(userId, descriptor);
  }

  /** Verifica a selfie contra o descritor cadastrado do usuário. */
  async verify(userId: string, image: string | Buffer): Promise<FaceMatch> {
    const stored = await this.repository.findByUserId(userId);
    if (!stored) {
      throw new Error("Usuário sem rosto cadastrado");
    }
    const descriptor = await this.engine.computeDescriptor(this.decodeImage(image));
    if (!descriptor) {
      throw new Error("Nenhum rosto detectado na imagem enviada");
    }
    const distance = this.engine.distance(stored, descriptor);
    return { match: distance <= this.threshold, distance };
  }
}
